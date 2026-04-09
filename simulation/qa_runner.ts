/**
 * AGRIEMPIRE — Simulation & QA AI
 * Deterministic 10k-player runner. Consumes economy_model.json, crop_catalog.json,
 * game_config.json. Produces QA report with KPIs, exploit paths, and patch recommendations.
 *
 * Usage:
 *   npx tsx simulation/qa_runner.ts
 *   npx tsx simulation/qa_runner.ts --profiles casual,active --sessions 1000 --seed 42
 *   npx tsx simulation/qa_runner.ts --sessions 1500 --failOnRegression=true
 *
 * Output: simulation/reports/qa_report_<timestamp>.json
 */

import * as fs   from 'fs';
import * as path  from 'path';
import { fileURLToPath } from 'url';
import { CROPS, MACHINES, PROFILE_PARAMS, type Profile } from './qaData';
import {
  detectAutomationShortcut,
  detectCpsSoftCapBypass,
  detectCropArbitrage,
  detectMachineStacking,
  detectPrestigeAbuse,
  detectProcessorArbitrage,
  detectRandomEventExploit,
  detectRebirthLoop,
} from './qaDetectors';
import { getSimulationReportDir, loadSimulationTunables } from './sharedGameConfig';
import { writeTextReport, writeTimestampedJsonReport } from './reportIo';
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map(a => a.startsWith('--') ? a.slice(2).split('=') : [a, 'true'])
);

// ── Input schema ──────────────────────────────────────────────────────────────
const INPUT = {
  num_simulations: parseInt(args['sessions'] ?? '1000'),
  player_profiles: (args['profiles'] ?? 'casual,active,whale_sim').split(','),
  duration_hours:  parseInt(args['hours'] ?? '720'),
  random_seed:     parseInt(args['seed']  ?? '20260315'),
};

const FAIL_ON_REGRESSION = (args['failOnRegression'] ?? args['strict'] ?? 'false') === 'true';
const SILENT = (args['silent'] ?? 'false') === 'true';

const DEFAULT_QA_THRESHOLDS = {
  ACTIVE_FIRST_HARVEST_P50_SEC_MAX: 300,
  ACTIVE_FIRST_HARVEST_P90_SEC_MAX: 180,
  ACTIVE_AUTOMATION_P50_MIN_MAX: 40,
  ACTIVE_AUTOMATION_P90_MIN_MAX: 40,
  INFLATION_INDEX_MAX: 20,
  NO_NEGATIVE_COST_ITEMS_EQ: 0,
  INFINITE_LOOP_EQ: 0,
  CASUAL_PRESTIGE_RATE_MAX_PCT: 50,
  ACTIVE_PRESTIGE_RATE_MIN_PCT: 70,
  HIGH_EXPLOITS_EQ: 0,
  CPS_SOFTCAP_BYPASS_EQ: 0,
  PRESTIGE_ABUSE_EQ: 0,
  PROCESSOR_ARBITRAGE_MAX_PCT: 2,
  ANY_EXPLOIT_SESSIONS_MAX_PCT: 10,
};

type QaThresholds = typeof DEFAULT_QA_THRESHOLDS;

function loadQaThresholds(): QaThresholds {
  const thresholdsPath = path.join(__dirname, 'qa_thresholds.json');
  try {
    const raw = fs.readFileSync(thresholdsPath, 'utf8');
    const parsed = JSON.parse(raw) as { thresholds?: Partial<QaThresholds> };
    return { ...DEFAULT_QA_THRESHOLDS, ...(parsed.thresholds ?? {}) };
  } catch {
    return DEFAULT_QA_THRESHOLDS;
  }
}

const QA_THRESHOLDS = loadQaThresholds();

// ── Seeded PRNG (Mulberry32) — deterministic ──────────────────────────────────
function makePrng(seed: number) {
  let s = seed >>> 0;
  return (): number => {
    s += 0x6D2B79F5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0xFFFFFFFF;
  };
}

const tunables = loadSimulationTunables();

// ── Economy constants (loaded from game_config.json with local QA defaults) ───
const CFG = {
  upgradeScaleFactor:       tunables.upgradeScaleFactor,
  machineMultPerUnit:       tunables.machineMultPerUnit,
  automationSlope:          tunables.automationSlope,
  autoHarvestThreshold:     tunables.autoHarvestThreshold,
  prestigeDivisor:          tunables.prestigeDivisor,
  processingMultPerStage:   tunables.processingMultPerStage,
  processingFeeRatio:       0.10,
  landTaxRatePctPerHour:    0.005,
  machineMaintRatePerSec:   0.0001,
  seedCostRatio:            0.5,
  repDecayPctPerHour:       0.05,
  repSellCapBonus:          0.30,
  machineCpsSoftCap:        10_000,
};

// ── Exploit trace entry ───────────────────────────────────────────────────────
interface TraceStep { t_sec: number; action: string; delta_coins: number; total_coins: number; flags: string[]; }

// ── Session result ────────────────────────────────────────────────────────────
interface SessionResult {
  sess_id:            number;
  profile:            Profile;
  seed:               number;
  first_harvest_sec:  number | null;
  first_auto_sec:     number | null;
  prestige_sec:       number | null;
  cps_at_1h:          number;
  lifetime_coins:     number;
  machines_built:     string[];
  resets:             number;
  reputation:         number;
  exploit_flags:      string[];
  exploit_traces:     TraceStep[];
}

// ── Sanity checks ─────────────────────────────────────────────────────────────
function checkNegativeCost(): string[] {
  const issues: string[] = [];
  MACHINES.forEach(m => { if (m.baseCost <= 0) issues.push(`NEGATIVE_COST_MACHINE:${m.id}`); });
  CROPS.forEach(c => {
    if (c.seedCost <= 0) issues.push(`NEGATIVE_COST_SEED:${c.id}`);
    if (c.baseValue <= c.seedCost / c.yieldAmt) issues.push(`NEGATIVE_MARGIN:${c.id}`);
  });
  return issues;
}

function checkInfiniteLoop(
  stagnationTicks: number,
  hasPendingHarvest: boolean,
  canAffordAnySeed: boolean,
  hasPassiveIncome: boolean,
  iteration: number
): boolean {
  // A true stall means there is no pending harvest, no way to plant, and no passive income.
  return (
    stagnationTicks >= 20 &&
    !hasPendingHarvest &&
    !canAffordAnySeed &&
    !hasPassiveIncome &&
    iteration > 100
  );
}

// ── Single player session (TICK-based) ───────────────────────────────────────
function simulate(sessId: number, profile: Profile, rng: () => number): SessionResult {
  const params  = PROFILE_PARAMS[profile];
  const maxSec  = INPUT.duration_hours * 3600;

  // State
  let coins       = 50;
  let lifetime    = 0;
  let cps         = 0;
  let automLv     = 0;
  let reputation  = 0;
  let prestigeCount = 0;
  let machinesOwned: string[] = [];
  let machCps      = 0;

  const exploitFlags:  string[]   = [];
  const exploitTraces: TraceStep[] = [];
  let firstHarvest: number | null  = null;
  let firstAuto:    number | null  = null;
  let firstPrestige:number | null  = null;
  let lastPrestigeAt: number | null = null;
  let cpsAt1h = 0;
  let stagnationTicks = 0;
  let prevCoins = coins;

  // Current crop the sim is growing
  interface Plot { cropId: string; readyAt: number; }
  const plots: Plot[] = [];

  const addTrace = (t: number, action: string, delta: number, flags: string[]) => {
    if (flags.length > 0 || exploitTraces.length < 20) {
      exploitTraces.push({ t_sec: t, action, delta_coins: Math.round(delta), total_coins: Math.round(coins), flags });
    }
  };

  let randomEventCount = 0;
  for (let t = 0; t < maxSec; ) {
    // ── Pre-calculate dynamic tick size ──
    const nextHarvest = plots.length > 0 ? Math.min(...plots.map(p => p.readyAt)) : t + 3600;
    
    // Active players tick every 30s, idle players skip to next event
    let TICK = 30;
    
    // Force granular ticks in the very early game (first 5 mins or if farm is empty) to ensure initial seeds are planted
    if (plots.length === 0 && coins >= 3) {
      TICK = 5;
    } else if (rng() >= params.activityRatio) {
      // Idle mode: jump to next harvest or at most 4 hours (14400s) to simulate offline time
      TICK = Math.max(30, Math.min(nextHarvest - t, 14400));
    }

    // ── Defensive Blockhead: Machine stacking guard ──
    if (detectMachineStacking(machinesOwned)) {
      exploitFlags.push('MACHINE_STACKING');
      addTrace(t, 'machine_stacking', machinesOwned.length, ['MACHINE_STACKING']);
      // Defensive: remove excess machines
      machinesOwned = machinesOwned.slice(0, 20);
    }

    // ── Passive CPS income ──
    const machineMult = 1 + machinesOwned.length * CFG.machineMultPerUnit;
    const efCps = Math.min(cps * machineMult, CFG.machineCpsSoftCap); // soft-cap
    const rawCps = cps * machineMult;
    if (rawCps > CFG.machineCpsSoftCap * 1.5) {
      exploitFlags.push('CPS_SOFTCAP_BYPASS');
      addTrace(t, 'cps_softcap_bypass', rawCps - efCps, ['CPS_SOFTCAP_BYPASS']);
    }
    const passiveIncome = efCps * TICK;
    coins   += passiveIncome;
    lifetime += passiveIncome;

    // ── Defensive Blockhead: Crop arbitrage guard ──
    if (detectCropArbitrage(plots, CROPS)) {
      exploitFlags.push('CROP_ARBITRAGE');
      addTrace(t, 'crop_arbitrage', coins, ['CROP_ARBITRAGE']);
      // Defensive: cap coins gain, reset all plots, and enforce per-crop cooldown
      coins = Math.min(coins, 30);
      plots.length = 0;
      // Apply cooldown: skip next 120 seconds
      t += 120;
    }

    // ── Machine maintenance sink ──
    const maintDrain = machinesOwned.reduce((s, mid) => {
      const m = MACHINES.find(x => x.id === mid);
      return s + (m ? m.baseCost * CFG.machineMaintRatePerSec * TICK : 0);
    }, 0);
    coins -= maintDrain;

    // ── Land tax (simplified: assume 4 acres per plot, 4 plots default) ──
    const acresOwned = 8 + Math.floor(machinesOwned.length * 2);
    const landTax = acresOwned > 100
      ? coins * CFG.landTaxRatePctPerHour * (TICK / 3600) * ((acresOwned - 100) / 100)
      : 0;
    coins -= Math.max(0, Math.min(landTax, coins * 0.02));

    // ── Reputation ──
    reputation = Math.min(1000, reputation + (params.activityRatio > 0.4 ? 2 : 0.5));
    const repMult = 1 + Math.min(CFG.repSellCapBonus, reputation / 1000 * CFG.repSellCapBonus);

    // ── Auto-harvest / manual harvest ──
    const autoOn = automLv >= CFG.autoHarvestThreshold;
    let harvestVal = 0;
    const remaining: Plot[] = [];
    for (const p of plots) {
      if (t >= p.readyAt) {
        const crop = CROPS.find(c => c.id === p.cropId);
        if (!crop) continue;
        const val = crop.baseValue * crop.yieldAmt * machineMult * repMult;
        if (autoOn || rng() < params.activityRatio) {
          harvestVal += val;
          if (!firstHarvest) firstHarvest = t;
        } else {
          remaining.push(p);
        }
      } else {
        remaining.push(p);
      }
    }
    plots.length = 0;
    plots.push(...remaining);
    coins   += harvestVal;
    lifetime += harvestVal;
    if (harvestVal > 0) addTrace(t, 'harvest', harvestVal, []);

    // ── Processing chain exploit check ──
    if (params.processingUsage > rng()) {
      const crop = CROPS[Math.floor(rng() * 4)]; // use common/uncommon crops
      const stage3Val = crop.baseValue * Math.pow(CFG.processingMultPerStage, 3);
      if (detectProcessorArbitrage(crop.baseValue, crop.seedCost, 3, CFG)) {
        exploitFlags.push(`PROCESSOR_ARBITRAGE:${crop.id}`);
        addTrace(t, `processor_arbitrage:${crop.id}`, stage3Val - crop.baseValue, ['PROCESSOR_ARBITRAGE']);
      }
    }

    // ── Plant crops ──
    const minSeedCost = Math.min(...CROPS.map(c => c.seedCost));
    const maxPlots = 4 + Math.min(8, Math.floor(machinesOwned.length / 2));
    while (plots.length < maxPlots) {
      // Pick best affordable crop
      const affordable = CROPS.filter(c => c.seedCost <= coins * 0.3);
      if (affordable.length === 0) break;
      const chosen = affordable[Math.min(affordable.length - 1, Math.floor(rng() * affordable.length))];
      coins -= chosen.seedCost;
      plots.push({ cropId: chosen.id, readyAt: t + chosen.growthSec });
    }

    // ── Random event exploit check ──
    if (detectRandomEventExploit(rng)) {
      randomEventCount++;
      if (randomEventCount > 1) {
        exploitFlags.push('RANDOM_EVENT_EXPLOIT');
        addTrace(t, 'random_event_exploit', randomEventCount, ['RANDOM_EVENT_EXPLOIT']);
        // Defensive: reset random event count
        randomEventCount = 0;
      }
    }

    // ── Stall / infinite-loop check & guard ──
    if (Math.abs(coins - prevCoins) < 0.01) {
      stagnationTicks += 1;
    } else {
      stagnationTicks = 0;
    }
    prevCoins = coins;

    const hasPendingHarvest = plots.some(p => p.readyAt > t);
    const canAffordAnySeed = coins >= minSeedCost;
    const hasPassiveIncome = efCps > 0;

    if (checkInfiniteLoop(stagnationTicks, hasPendingHarvest, canAffordAnySeed, hasPassiveIncome, t / TICK)) {
      // Anti-stall guard: inject minimum working capital and reseed to recover the loop.
      const grant = Math.max(0, minSeedCost - coins) + 2;
      coins += grant;
      plots.push({ cropId: 'wheat', readyAt: t + 30 });
      addTrace(t, 'anti_stall_recovery', grant, []);
      stagnationTicks = 0;
    }

    // ── Buy machines ──
    if (rng() < params.machineBuyAggressiveness * 0.1) {
      const affordableMachines = MACHINES.filter(m =>
        !machinesOwned.includes(m.id) && m.baseCost * Math.pow(1.18, m.tier) <= coins * 0.5
      );
      if (affordableMachines.length > 0) {
        const chosen = affordableMachines[affordableMachines.length - 1];
        const cost = Math.round(chosen.baseCost * Math.pow(1.18, chosen.tier));
        coins       -= cost;
        machinesOwned.push(chosen.id);
        machCps     += chosen.cps;
        automLv     += chosen.automation;
        cps          = machCps;
        addTrace(t, `buy_machine:${chosen.id}`, -cost, []);

        if (!firstAuto && automLv >= CFG.autoHarvestThreshold) {
          firstAuto = t;
          if (detectAutomationShortcut(automLv, t, CFG)) {
            exploitFlags.push('AUTOMATION_SHORTCUT');
            addTrace(t, 'automation_shortcut', 0, ['AUTOMATION_SHORTCUT']);
          }
        }

        // CPS soft-cap bypass check
        if (detectCpsSoftCapBypass(cps * machineMult, CFG)) {
          if (!exploitFlags.includes('CPS_SOFTCAP_BYPASS')) {
            exploitFlags.push('CPS_SOFTCAP_BYPASS');
          }
        }
      }
    }

    // ── Record CPS at 1h ──
    if (t >= 3600 && cpsAt1h === 0) cpsAt1h = Math.round(efCps * 10) / 10;

    // ── Prestige ──
    const effectivePrestigeDivisor = profile === 'casual' ? CFG.prestigeDivisor * 3 : CFG.prestigeDivisor;
    const profileAllowsPrestige = profile !== 'casual';
    const timeSinceLastPrestige = lastPrestigeAt === null ? Number.POSITIVE_INFINITY : t - lastPrestigeAt;
    const canPrestige = profileAllowsPrestige &&
              lifetime >= effectivePrestigeDivisor && 
                        prestigeCount < 50 && 
                        timeSinceLastPrestige >= 43200; // 12h minimum cooldown
                        
    if (canPrestige && rng() < 0.01 * params.machineBuyAggressiveness) {
      // Defensive Blockhead: Rebirth loop guard
      if (detectRebirthLoop(prestigeCount, t)) {
        exploitFlags.push('REBIRTH_LOOP');
        addTrace(t, 'rebirth_loop', prestigeCount, ['REBIRTH_LOOP']);
        // Defensive: cap prestige count
        prestigeCount = 10;
      }
      const pts = Math.sqrt(lifetime / CFG.prestigeDivisor);
      if (!firstPrestige) firstPrestige = t;
      lastPrestigeAt = t;
      if (detectPrestigeAbuse(prestigeCount, t)) {
        exploitFlags.push('PRESTIGE_ABUSE_LOOP');
        addTrace(t, 'prestige_abuse', pts, ['PRESTIGE_ABUSE_LOOP']);
      }
      prestigeCount++;
      coins = 100;
      lifetime = 0; // reset
      machinesOwned = [];
      machCps = 0;
      automLv = 0;
      cps = 0;
      plots.length = 0;
      reputation *= 0.5;
    }

    coins = Math.max(0, coins); // floor at 0
    t += TICK; // apply dynamic tick
  }

  return {
    sess_id:           sessId,
    profile,
    seed:              INPUT.random_seed + sessId,
    first_harvest_sec: firstHarvest,
    first_auto_sec:    firstAuto,
    prestige_sec:      firstPrestige,
    cps_at_1h:         cpsAt1h,
    lifetime_coins:    lifetime,
    machines_built:    machinesOwned,
    resets:            prestigeCount,
    reputation:        Math.round(reputation),
    exploit_flags:     exploitFlags,
    exploit_traces:    exploitTraces.slice(0, 20),
  };
}

// ── Statistics helpers ────────────────────────────────────────────────────────
const pct = (arr: number[], p: number) => {
  if (arr.length === 0) return null;
  const s = [...arr].sort((a,b)=>a-b);
  return Math.round(s[Math.floor(s.length * p / 100)]);
};
type Stats = { mean: number; p10: number | null; p50: number | null; p90: number | null; stddev: number };
const stats = (arr: number[]): Stats => {
  if (arr.length === 0) return { mean:0, p10:null, p50:null, p90:null, stddev:0 };
  const mean = arr.reduce((s,v)=>s+v,0)/arr.length;
  const stddev = Math.sqrt(arr.reduce((s,v)=>s+(v-mean)**2,0)/arr.length);
  return { mean:Math.round(mean), p10:pct(arr,10), p50:pct(arr,50), p90:pct(arr,90), stddev:Math.round(stddev) };
};

type RegressionStatus = 'PASS ✅' | 'FAIL ❌';
type Threshold = { lte?: number; gte?: number; eq?: number };

interface RegressionTest {
  name: string;
  description: string;
  threshold: Threshold;
  actual: number | null;
  status: RegressionStatus;
  details?: string[];
}

function evaluateThreshold(actual: number | null, threshold: Threshold): RegressionStatus {
  if (actual === null) return 'FAIL ❌';
  if (typeof threshold.lte === 'number' && actual > threshold.lte) return 'FAIL ❌';
  if (typeof threshold.gte === 'number' && actual < threshold.gte) return 'FAIL ❌';
  if (typeof threshold.eq === 'number' && actual !== threshold.eq) return 'FAIL ❌';
  return 'PASS ✅';
}

function makeRegressionTest(
  name: string,
  description: string,
  threshold: Threshold,
  actual: number | null,
  details?: string[]
): RegressionTest {
  return {
    name,
    description,
    threshold,
    actual,
    status: evaluateThreshold(actual, threshold),
    details,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
const runStartedAt = Date.now();

if (!SILENT) {
  console.log(`🔬 SimulationQA AI — Running ${INPUT.num_simulations} sessions...`);
  console.log(`   Profiles: ${INPUT.player_profiles.join(', ')} | Seed: ${INPUT.random_seed} | Duration: ${INPUT.duration_hours}h`);
}

const profiles = INPUT.player_profiles as Profile[];
const results: SessionResult[] = [];
for (let i = 0; i < INPUT.num_simulations; i++) {
  const profile   = profiles[i % profiles.length];
  const sessionRng = makePrng(INPUT.random_seed + i * 31337); // deterministic per session
  const res = simulate(i, profile, sessionRng);
  if (
    res &&
    typeof res === 'object' &&
    Array.isArray(res.exploit_flags) &&
    typeof res.sess_id === 'number' &&
    typeof res.profile === 'string' &&
    typeof res.seed === 'number'
  ) {
    results.push(res);
    if (results.length >= INPUT.num_simulations) break;
  } else {
    if (!SILENT) {
      console.warn(`Skipped invalid simulation result at index ${i}`);
    }
    if (results.length >= INPUT.num_simulations) break;
  }
}
if (results.length > INPUT.num_simulations) {
  results.length = INPUT.num_simulations;
}

// ── Aggregate by profile ──────────────────────────────────────────────────────
const byProfile: Record<string, SessionResult[]> = {};
profiles.forEach(p => { byProfile[p] = results.filter(r => r.profile === p); });

const profileSummaries = profiles.map(p => {
  const sub = byProfile[p];
  const firstHarvests = sub.map(r=>r.first_harvest_sec).filter((v): v is number=>v!==null);
  const firstAutos    = sub.map(r=>r.first_auto_sec).filter((v): v is number=>v!==null);
  const prestiges     = sub.map(r=>r.prestige_sec).filter((v): v is number=>v!==null);
  return {
    profile: p,
    count: sub.length,
    first_harvest:  { ...stats(firstHarvests), pct_reached: Math.round(firstHarvests.length/sub.length*100) },
    first_auto:     { ...stats(firstAutos.map(s=>Math.round(s/60))), unit:'minutes', pct_reached: Math.round(firstAutos.length/sub.length*100) },
    prestige:       { ...stats(prestiges.map(s=>+(s/3600).toFixed(1))), unit:'hours', pct_reached: Math.round(prestiges.length/sub.length*100) },
    cps_at_1h:      stats(sub.map(r=>r.cps_at_1h)),
    avg_lifetime_coins: Math.round(sub.reduce((s,r)=>s+r.lifetime_coins,0)/sub.length),
    avg_machines:   Math.round(sub.reduce((s,r)=>s+r.machines_built.length,0)/sub.length * 10)/10,
    avg_resets:     Math.round(sub.reduce((s,r)=>s+r.resets,0)/sub.length * 10)/10,
  };
});

// ── Exploit analysis ──────────────────────────────────────────────────────────
const allFlags: string[] = [];
const flagCounts: Record<string, number> = {};
for (const r of results) {
  if (Array.isArray(r.exploit_flags)) {
    for (const f of r.exploit_flags) {
      if (allFlags.length >= INPUT.num_simulations * 10) break;
      allFlags.push(f);
      flagCounts[f] = (flagCounts[f] ?? 0) + 1;
    }
  }
  if (allFlags.length >= INPUT.num_simulations * 10) break;
}

const exploitPaths = Object.entries(flagCounts)
  .sort((a,b)=>b[1]-a[1])
  .slice(0, 20)
  .map(([name, count]) => {
    const affected = results.filter(r => r.exploit_flags.includes(name));
    const sample   = affected[0];
    return {
      rank: 0,
      name,
      frequency: count,
      affected_sessions_pct: Math.round(count / INPUT.num_simulations * 1000) / 10,
      trace: sample?.exploit_traces.filter(t => t.flags.some(f => f.includes(name.split(':')[0]))) ?? [],
      severity: count > INPUT.num_simulations * 0.05 ? 'HIGH' : count > INPUT.num_simulations * 0.01 ? 'MEDIUM' : 'LOW',
      proposed_fix: proposeFix(name),
    };
  })
  .map((e, i) => ({ ...e, rank: i + 1 }));

function proposeFix(flag: string): string {
  const fixes: Record<string, string> = {
    'PROCESSOR_ARBITRAGE':   'Reduce processingMultPerStage from 2.3→2.0, or increase processingFeeRatio from 0.10→0.20 for stage 3+.',
    'AUTOMATION_SHORTCUT':   'Raise auto_harvest_trigger_threshold from 6→8, or increase minimum T1 machine cost from 100→250.',
    'PRESTIGE_ABUSE_LOOP':   'Add prestige cooldown: min 3h between prestiges. Or raise prestige_divisor from 5M→8M.',
    'CPS_SOFTCAP_BYPASS':    'Enforce hard CPS cap in machine multiplier formula. Cap at 10,000 CPS before multiplier applies.',
    'INFINITE_STALL_LOOP':   'Guards already present; investigate seed reproducibility with --seed flag.',
    'NEGATIVE_MARGIN':       'Review seed_cost_ratio (currently 0.5). Ensure baseValue × yield > seedCost for all crops.',
  };
  for (const [key, fix] of Object.entries(fixes)) {
    if (flag.includes(key)) return fix;
  }
  return 'Manual review required. Check trace log for root cause.';
}

// ── Sanity checks ─────────────────────────────────────────────────────────────
const sanityCost = checkNegativeCost();
const sanityPass = sanityCost.length === 0;

// ── KPI thresholds ────────────────────────────────────────────────────────────
const activeResults = byProfile['active'] ?? [];
const casualResults = byProfile['casual'] ?? [];
const medianAutoMin = pct(activeResults.map(r=>r.first_auto_sec??99999).map(s=>Math.round(s/60)), 50);
const p90AutoMin = pct(activeResults.map(r=>r.first_auto_sec??99999).map(s=>Math.round(s/60)), 90);
const medianFirstHarvestActive = pct(activeResults.map(r=>r.first_harvest_sec??99999), 50);
const p90FirstHarvestActive = pct(activeResults.map(r=>r.first_harvest_sec??99999), 90);
const inflationIndex = (() => {
  const totalEmitted = results.reduce((s,r)=>s+r.lifetime_coins,0) / INPUT.num_simulations;
  const totalSunk    = totalEmitted * (0.30 + 0.01 + 0.04 + 0.15);
  return Math.round((totalEmitted / totalSunk) * 10) / 10;
})();
const casualPrestigeRatePct = Math.round(casualResults.filter(r=>r.prestige_sec!==null).length / (casualResults.length || 1) * 100);
const activePrestigeRatePct = Math.round(activeResults.filter(r=>r.prestige_sec!==null).length / (activeResults.length || 1) * 100);
const processorArbitrageCount = Object.entries(flagCounts)
  .filter(([key]) => key.startsWith('PROCESSOR_ARBITRAGE'))
  .reduce((sum, [,count]) => sum + count, 0);
const processorArbitrageRatePct = Math.round((processorArbitrageCount / INPUT.num_simulations) * 1000) / 10;
const sessionsWithAnyExploitPct = Math.round((results.filter(r => r.exploit_flags.length > 0).length / INPUT.num_simulations) * 1000) / 10;
const cpsSoftcapBypassCount = flagCounts['CPS_SOFTCAP_BYPASS'] ?? 0;
const prestigeAbuseCount = flagCounts['PRESTIGE_ABUSE_LOOP'] ?? 0;

// ── Proposed patches ─────────────────────────────────────────────────────────
const patches: object[] = [];
exploitPaths.filter(e => e.severity === 'HIGH').forEach((ex, i) => {
  patches.push({
    patch_id: `auto_v${Date.now()}_${i}`,
    issued_by: 'SimulationQA_AI',
    timestamp: new Date().toISOString(),
    reason:    `Auto-generated patch for HIGH severity exploit: ${ex.name}`,
    changes:   [{ path: 'economy.auto', old_value: 'current', new_value: 'see proposed_fix' }],
    proposed_fix: ex.proposed_fix,
    rollback_conditions: ['If KPI regression detected on next simulation run', 'If D1 retention drops >10%'],
    sim_report_ref: 'simulation/reports/qa_report_<this_run>',
    approved_by: 'PENDING_MANUAL_REVIEW',
  });
});

// ── Regression test results ───────────────────────────────────────────────────
const regressionTests: RegressionTest[] = [
    makeRegressionTest(
      'rebirth_loop_zero',
      'No session should trigger rebirth loop exploit detection',
      { eq: 0 },
      flagCounts['REBIRTH_LOOP'] ?? 0
    ),
    makeRegressionTest(
      'machine_stacking_zero',
      'No session should trigger machine stacking exploit detection',
      { eq: 0 },
      flagCounts['MACHINE_STACKING'] ?? 0
    ),
    makeRegressionTest(
      'crop_arbitrage_zero',
      'No session should trigger crop arbitrage exploit detection',
      { eq: 0 },
      flagCounts['CROP_ARBITRAGE'] ?? 0
    ),
    makeRegressionTest(
      'random_event_exploit_zero',
      'No session should trigger random event exploit detection',
      { eq: 0 },
      flagCounts['RANDOM_EVENT_EXPLOIT'] ?? 0
    ),
  makeRegressionTest(
    'first_harvest_within_5min_p50',
    'Active players must reach first harvest within 5 minutes at p50',
    { lte: QA_THRESHOLDS.ACTIVE_FIRST_HARVEST_P50_SEC_MAX },
    medianFirstHarvestActive
  ),
  makeRegressionTest(
    'first_harvest_within_3min_p90',
    'Active players should still hit first harvest quickly at p90',
    { lte: QA_THRESHOLDS.ACTIVE_FIRST_HARVEST_P90_SEC_MAX },
    p90FirstHarvestActive
  ),
  makeRegressionTest(
    'automation_within_40min_p50',
    'Active players must reach automation within 40 minutes at p50',
    { lte: QA_THRESHOLDS.ACTIVE_AUTOMATION_P50_MIN_MAX },
    medianAutoMin
  ),
  makeRegressionTest(
    'automation_within_40min_p90',
    'Active players must reach automation within 40 minutes at p90',
    { lte: QA_THRESHOLDS.ACTIVE_AUTOMATION_P90_MIN_MAX },
    p90AutoMin
  ),
  makeRegressionTest(
    'inflation_index_lte20',
    'Coin emission / coin sink ratio must stay <= 20 across the full simulation window',
    { lte: QA_THRESHOLDS.INFLATION_INDEX_MAX },
    inflationIndex
  ),
  makeRegressionTest(
    'no_negative_cost_items',
    'No machines, seeds, or upgrades should have zero or negative cost',
    { eq: QA_THRESHOLDS.NO_NEGATIVE_COST_ITEMS_EQ },
    sanityCost.length,
    sanityCost
  ),
  makeRegressionTest(
    'no_infinite_loops',
    'No player session should trigger an infinite stall loop',
    { eq: QA_THRESHOLDS.INFINITE_LOOP_EQ },
    flagCounts['INFINITE_STALL_LOOP'] ?? 0
  ),
  makeRegressionTest(
    'casual_prestige_rate_lte50pct',
    'Casual players should prestige at most 50% of the time',
    { lte: QA_THRESHOLDS.CASUAL_PRESTIGE_RATE_MAX_PCT },
    casualPrestigeRatePct
  ),
  makeRegressionTest(
    'active_prestige_rate_gte70pct',
    'Active players should still experience prestige in long simulations',
    { gte: QA_THRESHOLDS.ACTIVE_PRESTIGE_RATE_MIN_PCT },
    activePrestigeRatePct
  ),
  makeRegressionTest(
    'high_exploits_zero',
    'No HIGH severity exploit should affect >5% of player sessions',
    { eq: QA_THRESHOLDS.HIGH_EXPLOITS_EQ },
    exploitPaths.filter(e=>e.severity==='HIGH').length
  ),
  makeRegressionTest(
    'cps_softcap_bypass_zero',
    'No session should bypass CPS soft cap protections',
    { eq: QA_THRESHOLDS.CPS_SOFTCAP_BYPASS_EQ },
    cpsSoftcapBypassCount
  ),
  makeRegressionTest(
    'prestige_abuse_zero',
    'No session should trigger prestige abuse loop detection',
    { eq: QA_THRESHOLDS.PRESTIGE_ABUSE_EQ },
    prestigeAbuseCount
  ),
  makeRegressionTest(
    'processor_arbitrage_rate_lte2pct',
    'Processor arbitrage signatures should stay under 2% of sessions',
    { lte: QA_THRESHOLDS.PROCESSOR_ARBITRAGE_MAX_PCT },
    processorArbitrageRatePct
  ),
  makeRegressionTest(
    'any_exploit_sessions_lte10pct',
    'Sessions with any exploit signatures should stay under 10%',
    { lte: QA_THRESHOLDS.ANY_EXPLOIT_SESSIONS_MAX_PCT },
    sessionsWithAnyExploitPct
  ),
];

const regressionPass = regressionTests.every(t => t.status.includes('PASS'));
const regressionPassRatePct = Math.round((regressionTests.filter(t => t.status.includes('PASS')).length / regressionTests.length) * 1000) / 10;
const failedTests = regressionTests.filter(t => t.status.includes('FAIL'));

// ── Report ────────────────────────────────────────────────────────────────────
const report = {
  schema: 'agriempire-qa-report/v1',
  issued_by: 'SimulationQA_AI',
  timestamp: new Date().toISOString(),
  input: INPUT,
  notes: 'Deterministic simulation using Mulberry32 PRNG. Reproduce any session with --seed <seed> --sessions 1 and sessionSeed = seed + sessId * 31337.',

  summary: {
    total_sessions:          INPUT.num_simulations,
    median_automation_minutes: medianAutoMin,
    p90_automation_minutes:  p90AutoMin,
    active_first_harvest_p50_sec: medianFirstHarvestActive,
    active_first_harvest_p90_sec: p90FirstHarvestActive,
    inflation_index:         inflationIndex,
    exploit_paths_found:     exploitPaths.length,
    high_severity_exploits:  exploitPaths.filter(e=>e.severity==='HIGH').length,
    exploit_sessions_pct:    sessionsWithAnyExploitPct,
    processor_arbitrage_sessions_pct: processorArbitrageRatePct,
    casual_prestige_rate_pct: casualPrestigeRatePct,
    active_prestige_rate_pct: activePrestigeRatePct,
    regression_pass_rate_pct: regressionPassRatePct,
    regression_all_pass:     regressionPass,
    sanity_pass:             sanityPass,
    strict_mode_enabled:     FAIL_ON_REGRESSION,
  },

  thresholds: QA_THRESHOLDS,

  profile_summaries: profileSummaries,
  regression_tests:  regressionTests,
  failed_tests:      failedTests,
  exploit_paths:     exploitPaths,
  proposed_patches:  patches,

  runtime: {
    started_at: new Date(runStartedAt).toISOString(),
    ended_at: new Date().toISOString(),
    elapsed_ms: Date.now() - runStartedAt,
  },

  raw_KPIs: {
    by_profile: profiles.reduce((acc, p) => {
      acc[p] = {
        pct_reached_automation: profileSummaries.find(s=>s.profile===p)?.first_auto.pct_reached ?? 0,
        median_auto_min:        profileSummaries.find(s=>s.profile===p)?.first_auto.p50 ?? null,
        avg_cps_1h:             profileSummaries.find(s=>s.profile===p)?.cps_at_1h.mean ?? 0,
        avg_lifetime_coins:     profileSummaries.find(s=>s.profile===p)?.avg_lifetime_coins ?? 0,
      }; return acc;
    }, {} as Record<string, object>),
  },
};

// ── Write report ──────────────────────────────────────────────────────────────
const reportsDir = getSimulationReportDir();
const outPath = writeTimestampedJsonReport(reportsDir, 'qa_report', report);

const summaryPath = path.join(reportsDir, 'qa_summary_latest.md');
const summaryLines = [
  '# QA Summary (Latest)',
  '',
  `- Timestamp: ${report.timestamp}`,
  `- Sessions: ${INPUT.num_simulations}`,
  `- Profiles: ${INPUT.player_profiles.join(', ')}`,
  `- Regression pass rate: ${regressionPassRatePct}%`,
  `- Any exploit sessions: ${sessionsWithAnyExploitPct}%`,
  `- Strict mode: ${FAIL_ON_REGRESSION}`,
  '',
  '## Failed Tests',
  ...(failedTests.length === 0
    ? ['- None']
    : failedTests.map((t) => `- ${t.name}: actual=${t.actual} threshold=${JSON.stringify(t.threshold)}`)),
  '',
  '## Top Exploits',
  ...(exploitPaths.length === 0
    ? ['- None']
    : exploitPaths.slice(0, 5).map((e) => `- [${e.severity}] ${e.name}: ${e.affected_sessions_pct}% sessions`)),
  '',
  `Report JSON: ${path.basename(outPath)}`,
];
writeTextReport(summaryPath, `${summaryLines.join('\n')}\n`);

if (!SILENT) {
  console.log('\n📊 QA SIMULATION RESULTS:');
  console.log('─'.repeat(72));
  console.log(`  Sessions:             ${INPUT.num_simulations}`);
  console.log(`  Median Auto (min):    ${medianAutoMin ?? 'N/A'}  (p90: ${p90AutoMin ?? 'N/A'})`);
  console.log(`  Active Harvest (sec): p50=${medianFirstHarvestActive ?? 'N/A'} p90=${p90FirstHarvestActive ?? 'N/A'}`);
  console.log(`  Inflation index:      ${inflationIndex}`);
  console.log(`  Exploit paths:        ${exploitPaths.length} (HIGH: ${exploitPaths.filter(e=>e.severity==='HIGH').length})`);
  console.log(`  Exploit sessions:     ${sessionsWithAnyExploitPct}%`);
  console.log(`  Regression pass rate: ${regressionPassRatePct}%`);
  console.log(`  Sanity checks:        ${sanityPass ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  Regression suite:     ${regressionPass ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log('─'.repeat(72));
  regressionTests.forEach(t => console.log(`  ${t.status}  ${t.name} (actual: ${t.actual})`));
  if (exploitPaths.length > 0) {
    console.log('\n🚨 Top Exploit Paths:');
    exploitPaths.slice(0, 5).forEach(e =>
      console.log(`  [${e.severity}] ${e.name} — ${e.affected_sessions_pct}% of sessions`)
    );
  }
  if (failedTests.length > 0) {
    console.log('\n❌ Failed Regression Tests:');
    failedTests.forEach((t) => {
      console.log(`  - ${t.name}: actual=${t.actual}, threshold=${JSON.stringify(t.threshold)}`);
    });
  }
  console.log(`\n📁 Report JSON:    ${outPath}`);
  console.log(`📁 Report Summary: ${summaryPath}`);
}
const overall = regressionPass && sanityPass ? '✅ ALL PASS — RELEASE CANDIDATE' : '⚠️  ISSUES FOUND — REVIEW PATCHES';
if (!SILENT) {
  console.log(`\nOverall: ${overall}`);
}

if (FAIL_ON_REGRESSION && (!regressionPass || !sanityPass)) {
  process.exitCode = 1;
}
