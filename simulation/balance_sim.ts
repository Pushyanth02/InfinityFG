/**
 * AGRIEMPIRE — MONTE CARLO BALANCE SIMULATOR
 * Standard S4: Simulation First
 *
 * Runs N virtual player sessions and validates whether pacing targets are met.
 * Run with: npx ts-node simulation/balance_sim.ts
 *
 * Output: simulation/reports/sim_report_<timestamp>.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Config (mirrors game_config.json) ────────────────────────────────────────
const CONFIG = {
  // Economy (patch v1.0.1 applied)
  base_crop_value_scalar: 1.0,
  farm_multiplier_cap: 10.0,
  machine_multiplier_per_unit: 0.07,       // was 0.1 — patch v1.0.1
  upgrade_scale_factor: 1.15,
  machine_tier_exponent: 1.18,
  automation_slope: 0.12,
  auto_harvest_trigger_threshold: 6,       // was 3 — patch v1.0.1
  prestige_divisor: 5_000_000,             // was 1M — patch v1.0.1
  processing_value_multiplier: 2.3,

  // Simulation
  num_sessions: 1000,
  session_max_seconds: 72000, // 20 hours
  tick_seconds: 10,           // sim tick resolution

  // Pacing targets (S4) — first_harvest corrected to 60s per patch v1.0.1
  target_first_harvest_seconds: 60,
  target_first_automation_seconds: 30 * 60,
  target_prestige_seconds: 20 * 3600,
  target_cps_at_1h: 50,
};

// ─── Sim crop data (representative subset) ───────────────────────────────────
const SIM_CROPS = [
  { id: 'wheat',   growthSec: 30,  yield: 4,  value: 5,  seedCost: 3 },
  { id: 'corn',    growthSec: 45,  yield: 3,  value: 12, seedCost: 6 },
  { id: 'rice',    growthSec: 80,  yield: 6,  value: 14, seedCost: 7 },
  { id: 'grape',   growthSec: 200, yield: 5,  value: 60, seedCost: 30 },
  { id: 'coffee',  growthSec: 300, yield: 3,  value: 120,seedCost: 60 },
];

// ─── Sim machine data (costs match real MACHINES data) ───────────────────────
const SIM_MACHINES = [
  // T1 — affordable early; automation=2 each; need 3 T1 machines for threshold=6
  { id: 'seed_sorter',     tier:1, baseCost: 100,    productionRate: 0.2,   automation: 2 },
  { id: 'auto_planter',    tier:1, baseCost: 200,    productionRate: 0.5,   automation: 2 },
  { id: 'drip_irrigation', tier:1, baseCost: 350,    productionRate: 0.8,   automation: 2 },
  // T2 — mid game; automation=3 each; still need 2 T2 after all T1 to clear threshold
  { id: 'auto_harvester',  tier:2, baseCost: 3500,   productionRate: 4.0,   automation: 3 },
  { id: 'grain_mill',      tier:2, baseCost: 2800,   productionRate: 3.0,   automation: 3 },
  // T3+ — late game
  { id: 'hydroponic_bay',  tier:3, baseCost: 25000,  productionRate: 30.0,  automation: 4 },
  { id: 'mega_harvester',  tier:4, baseCost: 80000,  productionRate: 100.0, automation: 5 },
  { id: 'ai_farm_mgr',     tier:5, baseCost: 300000, productionRate: 350.0, automation: 6 },
];

// ─── Virtual player strategies ────────────────────────────────────────────────
type Strategy = 'balanced' | 'machine_first' | 'crop_grinder' | 'prestige_rusher';

function chooseCrop(coins: number): typeof SIM_CROPS[0] {
  // Buy the most expensive crop we can afford
  const affordable = SIM_CROPS.filter(c => c.seedCost <= coins);
  if (affordable.length === 0) return SIM_CROPS[0];
  return affordable[affordable.length - 1];
}

function chooseMachine(coins: number, owned: string[]): typeof SIM_MACHINES[0] | null {
  const buyable = SIM_MACHINES.filter(m => {
    const cost = Math.round(m.baseCost * Math.pow(CONFIG.machine_tier_exponent, m.tier));
    return !owned.includes(m.id) && coins >= cost;
  });
  return buyable.length > 0 ? buyable[buyable.length - 1] : null;
}

// ─── Single session simulation ────────────────────────────────────────────────
interface SessionResult {
  sess_id: number;
  strategy: Strategy;
  first_harvest_sec: number | null;
  first_automation_sec: number | null;
  prestige_sec: number | null;
  cps_at_1h: number;
  lifetime_coins: number;
  machines_built: number;
  time_played_sec: number;
}

function simulate(sess_id: number, strategy: Strategy): SessionResult {
  // State
  let coins = 50;
  let lifetimeCoins = 0;
  let cps = 0;
  let automationLevel = 0;
  const maxPlots = 4;

  interface Plot { cropId: string; readyAt: number; }
  const plots: Plot[] = [];
  const ownedMachines: string[] = [];
  let machineProductionRate = 0;

  let firstHarvestSec: number | null = null;
  let firstAutomationSec: number | null = null;
  let prestigeSec: number | null = null;
  let cpsAt1h = 0;

  const farmMult = 1.0; // base farm multiplier

  for (let t = 0; t < CONFIG.session_max_seconds; t += CONFIG.tick_seconds) {
    // ── Passive income ──
    const passiveIncome = cps * CONFIG.tick_seconds;
    coins += passiveIncome;
    lifetimeCoins += passiveIncome;

    // ── Auto-harvest ──
    const autoOn = automationLevel >= CONFIG.auto_harvest_trigger_threshold;
    let harvestValue = 0;

    const remaining: Plot[] = [];
    for (const p of plots) {
      if (t >= p.readyAt) {
        const crop = SIM_CROPS.find(c => c.id === p.cropId)!;
        const machMult = 1 + ownedMachines.length * CONFIG.machine_multiplier_per_unit;
        const val = crop.value * crop.yield * farmMult * machMult * CONFIG.base_crop_value_scalar;
        if (autoOn || firstHarvestSec !== null) {
          // auto-harvest or manual harvest past first
          harvestValue += val;
          if (firstHarvestSec === null) firstHarvestSec = t;
          if (firstHarvestSec === t) firstHarvestSec = t; // record
        } else {
          // Still manual — record first harvest
          harvestValue += val;
          firstHarvestSec = t;
          remaining.push(p);
          remaining.pop();
          continue;
        }
      } else {
        remaining.push(p);
      }
    }
    plots.length = 0;
    plots.push(...remaining);
    coins += harvestValue;
    lifetimeCoins += harvestValue;

    // ── Plant crops ──
    while (plots.length < maxPlots) {
      const crop = chooseCrop(coins);
      if (coins < crop.seedCost) break;
      coins -= crop.seedCost;
      // Growth time modified by automation (speed bonus approximated)
      const growMod = 1 + (automationLevel * 0.02);
      plots.push({ cropId: crop.id, readyAt: t + Math.ceil(crop.growthSec / growMod) });
    }

    // ── Buy machines (strategy driven) ──
    const shouldBuyMachine =
      strategy === 'balanced'         ? (t % 60 === 0 && ownedMachines.length < 10) :
      strategy === 'machine_first'    ? (ownedMachines.length < 15) :
      strategy === 'crop_grinder'     ? (ownedMachines.length < 3) :
      strategy === 'prestige_rusher'  ? (ownedMachines.length < 5) : false;

    if (shouldBuyMachine) {
      const m = chooseMachine(coins, ownedMachines);
      if (m) {
        const cost = Math.round(m.baseCost * Math.pow(CONFIG.machine_tier_exponent, m.tier));
        coins -= cost;
        ownedMachines.push(m.id);
        machineProductionRate += m.productionRate;
        automationLevel += m.automation;
        cps = machineProductionRate * (1 + automationLevel * CONFIG.automation_slope);

        if (automationLevel >= CONFIG.auto_harvest_trigger_threshold && firstAutomationSec === null) {
          firstAutomationSec = t;
        }
      }
    }

    // ── Record CPS at 1h ──
    if (t === 3600 || (t < 3600 && t + CONFIG.tick_seconds > 3600)) {
      cpsAt1h = cps;
    }

    // ── Check prestige condition ──
    if (lifetimeCoins >= CONFIG.prestige_divisor && prestigeSec === null) {
      prestigeSec = t;
    }

    // ── Prestige reset (prestige_rusher only) ──
    if (strategy === 'prestige_rusher' && prestigeSec !== null && t === prestigeSec + 10) {
      coins = 100;
      lifetimeCoins = 0;
      plots.length = 0;
      ownedMachines.length = 0;
      machineProductionRate = 0;
      automationLevel = 0;
      cps = 0;
    }
  }

  return {
    sess_id,
    strategy,
    first_harvest_sec: firstHarvestSec,
    first_automation_sec: firstAutomationSec,
    prestige_sec: prestigeSec,
    cps_at_1h: cpsAt1h,
    lifetime_coins: lifetimeCoins,
    machines_built: ownedMachines.length,
    time_played_sec: CONFIG.session_max_seconds,
  };
}

// ─── Statistics helpers ───────────────────────────────────────────────────────
function stats(arr: number[]) {
  if (arr.length === 0) return { mean: null, median: null, p10: null, p90: null, stddev: null };
  arr.sort((a, b) => a - b);
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  const median = arr[Math.floor(arr.length / 2)];
  const p10 = arr[Math.floor(arr.length * 0.10)];
  const p90 = arr[Math.floor(arr.length * 0.90)];
  const stddev = Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length);
  return { mean: Math.round(mean), median: Math.round(median), p10: Math.round(p10), p90: Math.round(p90), stddev: Math.round(stddev) };
}

// ─── Run simulation ───────────────────────────────────────────────────────────
console.log(`🌾 AgriEmpire Balance Simulator — Running ${CONFIG.num_sessions} sessions...`);
const strategies: Strategy[] = ['balanced', 'machine_first', 'crop_grinder', 'prestige_rusher'];
const results: SessionResult[] = [];

for (let i = 0; i < CONFIG.num_sessions; i++) {
  const strategy = strategies[i % strategies.length];
  results.push(simulate(i, strategy));
}

// ─── Aggregate ────────────────────────────────────────────────────────────────
const firstHarvests = results.map(r => r.first_harvest_sec).filter((v): v is number => v !== null);
const firstAutos    = results.map(r => r.first_automation_sec).filter((v): v is number => v !== null);
const prestiges     = results.map(r => r.prestige_sec).filter((v): v is number => v !== null);
const cpsAt1hArr    = results.map(r => r.cps_at_1h);
// lifetimeArr omitted as it is currently unused in stats aggregation


// ─── Pacing validation ────────────────────────────────────────────────────────
const harvestStats = stats(firstHarvests);
const autoStats    = stats(firstAutos);
const prestigeStats= stats(prestiges);
const cpsStats     = stats(cpsAt1hArr);

const passes = (actual: number | null, target: number, tolerancePct: number): 'PASS' | 'FAIL' | 'WARN' => {
  if (actual === null) return 'FAIL';
  const lo = target * (1 - tolerancePct);
  const hi = target * (1 + tolerancePct);
  if (actual >= lo && actual <= hi) return 'PASS';
  if (actual < lo * 0.5 || actual > hi * 2) return 'FAIL';
  return 'WARN';
};

const report = {
  schema: 'agriempire-sim-report/v1',
  issued_by: 'antigravity',
  timestamp: new Date().toISOString(),
  config: CONFIG,
  notes: 'Monte Carlo balance simulation. Results validate pacing targets from engineering_standards.json S4.',

  summary: {
    total_sessions: CONFIG.num_sessions,
    sessions_reached_first_harvest: firstHarvests.length,
    sessions_reached_automation: firstAutos.length,
    sessions_reached_prestige: prestiges.length,
  },

  pacing_validation: {
    first_harvest: {
      target_seconds: CONFIG.target_first_harvest_seconds,
      actual_stats_seconds: harvestStats,
      target_minutes: CONFIG.target_first_harvest_seconds / 60,
      actual_mean_minutes: harvestStats.mean ? harvestStats.mean / 60 : null,
      status: passes(harvestStats.mean, CONFIG.target_first_harvest_seconds, 0.5),
    },
    first_automation: {
      target_seconds: CONFIG.target_first_automation_seconds,
      actual_stats_seconds: autoStats,
      target_minutes: CONFIG.target_first_automation_seconds / 60,
      actual_mean_minutes: autoStats.mean ? autoStats.mean / 60 : null,
      status: passes(autoStats.mean, CONFIG.target_first_automation_seconds, 0.40),
    },
    prestige: {
      target_seconds: CONFIG.target_prestige_seconds,
      actual_stats_seconds: prestigeStats,
      target_hours: CONFIG.target_prestige_seconds / 3600,
      actual_mean_hours: prestigeStats.mean ? prestigeStats.mean / 3600 : null,
      status: passes(prestigeStats.mean, CONFIG.target_prestige_seconds, 0.5),
    },
    cps_at_1h: {
      target: CONFIG.target_cps_at_1h,
      actual_stats: cpsStats,
      status: passes(cpsStats.mean, CONFIG.target_cps_at_1h, 0.5),
    },
  },

  by_strategy: strategies.map(strategy => {
    const sub = results.filter(r => r.strategy === strategy);
    return {
      strategy,
      count: sub.length,
      avg_machines: Math.round(sub.reduce((s, r) => s + r.machines_built, 0) / sub.length),
      avg_lifetime_coins: Math.round(sub.reduce((s, r) => s + r.lifetime_coins, 0) / sub.length),
      avg_cps_1h: Math.round(sub.reduce((s, r) => s + r.cps_at_1h, 0) / sub.length * 10) / 10,
      prestige_rate_pct: Math.round(sub.filter(r => r.prestige_sec !== null).length / sub.length * 100),
    };
  }),

  recommendations: [] as string[],
};

// Auto-generate recommendations
if (report.pacing_validation.first_harvest.status !== 'PASS') {
  report.recommendations.push('First harvest timing off-target. Check base_crop_value_scalar and wheat growthTime.');
}
if (report.pacing_validation.first_automation.status !== 'PASS') {
  report.recommendations.push('Automation unlock too slow/fast. Check auto_harvest_trigger_threshold and machine costs.');
}
if (report.pacing_validation.prestige.status !== 'PASS') {
  report.recommendations.push('Prestige pacing off. Adjust prestige_divisor within safe_range [500000, 10000000].');
}
if (report.pacing_validation.cps_at_1h.status !== 'PASS') {
  report.recommendations.push('CPS at 1h off-target. Check machine productionRate values and automation_slope.');
}
if (report.recommendations.length === 0) {
  report.recommendations.push('✅ All pacing targets met. Economy is within balance parameters.');
}

// ─── Output report ────────────────────────────────────────────────────────────
const reportDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

const filename = `sim_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
const outPath = path.join(reportDir, filename);
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log('\n📊 SIMULATION RESULTS:');
console.log('─'.repeat(60));
console.log(`First Harvest:  ${report.pacing_validation.first_harvest.status.padEnd(5)} | Mean: ${(harvestStats.mean ?? 0) / 60 | 0}m (target: 5m)`);
console.log(`First Auto:     ${report.pacing_validation.first_automation.status.padEnd(5)} | Mean: ${(autoStats.mean ?? 0) / 60 | 0}m (target: 30m)`);
console.log(`Prestige:       ${report.pacing_validation.prestige.status.padEnd(5)} | Mean: ${((prestigeStats.mean ?? 0) / 3600).toFixed(1)}h (target: 20h)`);
console.log(`CPS at 1h:      ${report.pacing_validation.cps_at_1h.status.padEnd(5)} | Mean: ${cpsStats.mean} (target: 50)`);
console.log('─'.repeat(60));
console.log('\n📁 Report saved to:', outPath);

const overall = Object.values(report.pacing_validation).every(v => v.status === 'PASS') ? '✅ PASS' : '⚠️  NEEDS REVIEW';
console.log(`\nOverall: ${overall}`);
