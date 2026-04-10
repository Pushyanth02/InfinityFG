import { CHAPTERS } from '../src/data/chapters';
import { CROPS } from '../src/data/crops';
import { getSimulationReportDir } from './sharedGameConfig';
import { writeTextReport, writeTimestampedJsonReport } from './reportIo';

type DurationHours = 50 | 100 | 200;

interface SessionMetrics {
  durationHours: DurationHours;
  regionTimesSec: Record<string, number>;
  bossDefeatTimesSec: Record<string, number>;
  prestigeCount: number;
  cpsCurve: Array<{ hour: number; coinsPerSecond: number }>;
  machineIncome: number;
  workerIncome: number;
  maxRegionReached: number;
}

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => (a.startsWith('--') ? a.slice(2).split('=') : [a, 'true']))
);

const SESSIONS = parseInt(args.sessions ?? '300', 10);
const SEED = parseInt(args.seed ?? '20260410', 10);
const DURATIONS: DurationHours[] = [50, 100, 200];
const BOSS_COUNT = Math.min(CHAPTERS.length, 12);
const MID_GAME_START_CHAPTER_INDEX = 4; // Region 5
const MID_GAME_END_CHAPTER_INDEX = 7;   // Region 8
const LATE_GAME_CHAPTER_INDEX = 9;      // Region 10
const LATE_GAME_EXPLOSION_THRESHOLD_HOURS = 0.4;

function makePrng(seed: number): () => number {
  let s = seed >>> 0;
  return (): number => {
    s += 0x6D2B79F5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0xFFFFFFFF;
  };
}

function getRegionCropIds(regionIdx: number): string[] {
  const chapter = CHAPTERS[Math.min(regionIdx, CHAPTERS.length - 1)];
  const chapterCropIds = chapter?.crops?.filter((id) => CROPS.some((c) => c.id === id)) ?? [];
  if (chapterCropIds.length > 0) return chapterCropIds;
  return CROPS.slice(0, Math.min(CROPS.length, 3 + Math.floor(regionIdx / 2))).map((c) => c.id);
}

function runSession(durationHours: DurationHours, seed: number): SessionMetrics {
  const rng = makePrng(seed);
  const maxSec = durationHours * 3600;
  const tick = 30;

  let coins = 50;
  let machineCount = 0;
  let workerCount = 0;
  let engineerCount = 0;
  let farmerCount = 0;
  let machineCost = 120;
  let workerCost = 150;
  let machineCps = 0;

  let regionIdx = 0;
  let regionEnteredAt = 0;
  let bossHp = CHAPTERS[regionIdx].boss.maxHp;
  let hasUCW = false;
  let prestigeCount = 0;

  let overclockRemaining = 0;
  let overclockCooldown = 0;

  const regionTimesSec: Record<string, number> = {};
  const bossDefeatTimesSec: Record<string, number> = {};
  const cpsCurve: Array<{ hour: number; coinsPerSecond: number }> = [];
  const recentCrops: Array<{ cropId: string; t: number }> = [];

  let machineIncome = 0;
  let workerIncome = 0;
  let maxRegionReached = 1;

  for (let t = 0; t <= maxSec; t += tick) {
    const hour = Math.floor(t / 3600);
    const demandWindow = Math.floor(t / 300);
    const marketDemandCrop = CROPS[demandWindow % CROPS.length]?.id ?? CROPS[0].id;

    const cropPool = getRegionCropIds(regionIdx);
    const cropScores = cropPool.map((cropId) => {
      const crop = CROPS.find((c) => c.id === cropId);
      if (!crop) return { cropId, score: 0 };
      const demandBoost = crop.id === marketDemandCrop ? 1.35 : 1;
      const rarityPressure = crop.rarity === 'legendary' || crop.rarity === 'epic' ? 0.9 : 1;
      const score = ((crop.baseValue * crop.yield) / Math.max(1, crop.growthTime)) * demandBoost * rarityPressure;
      return { cropId, score };
    });
    cropScores.sort((a, b) => b.score - a.score);
    const chosenCropId = (rng() < 0.22 ? cropScores[1] : cropScores[0])?.cropId ?? cropPool[0];
    const chosenCrop = CROPS.find((c) => c.id === chosenCropId) ?? CROPS[0];
    recentCrops.push({ cropId: chosenCrop.id, t });
    while (recentCrops.length > 0 && recentCrops[0].t < t - 600) recentCrops.shift();

    const farmerPreMachine = 1 + Math.min(0.35, farmerCount * 0.015);
    const engineerOverclockPenalty = overclockRemaining > 0 ? Math.max(0.72, 0.82 + engineerCount * 0.02) : 1;
    const overclockMult = overclockRemaining > 0 ? 1.4 : 1;

    const manualIncome = ((chosenCrop.baseValue * chosenCrop.yield) / Math.max(1, chosenCrop.growthTime)) * tick * farmerPreMachine;
    const machineIncomeTick = machineCps * tick * (1 + workerCount * 0.01);
    const gain = (manualIncome + machineIncomeTick) * overclockMult * engineerOverclockPenalty;
    coins += gain;
    machineIncome += machineIncomeTick * overclockMult * engineerOverclockPenalty;
    workerIncome += manualIncome * overclockMult * engineerOverclockPenalty;

    if (t % 3600 === 0) {
      cpsCurve.push({ hour, coinsPerSecond: gain / tick });
    }

    if (overclockCooldown > 0) overclockCooldown -= tick;
    if (overclockRemaining > 0) overclockRemaining -= tick;

    if (overclockCooldown <= 0 && machineCount >= 3 && coins > 500 && rng() < 0.12) {
      overclockRemaining = 120;
      overclockCooldown = 900;
      coins -= Math.max(30, coins * 0.003);
    }

    if (coins >= machineCost && rng() < 0.34) {
      coins -= machineCost;
      machineCount += 1;
      machineCps += 0.45 * Math.pow(1.14, Math.min(regionIdx, 10));
      machineCost = Math.round(machineCost * 1.18);
    }

    if (coins >= workerCost && rng() < 0.22) {
      coins -= workerCost;
      workerCount += 1;
      if (engineerCount <= farmerCount) engineerCount += 1;
      else farmerCount += 1;
      workerCost = Math.round(workerCost * 1.28);
    }

    const chapter = CHAPTERS[regionIdx];
    hasUCW = hasUCW || coins >= (chapter.boss.recommendedWeaponCost ?? 1000);
    const diversity = new Set(recentCrops.map((c) => c.cropId)).size;
    const diversityGateMet = diversity >= 3;
    const bossDamageBase = 1 + machineCount * 0.05 + workerCount * 0.03;
    const bossTimingMult = overclockRemaining > 0 ? 2.2 : 0.8;
    const bossDamage = hasUCW && diversityGateMet ? bossDamageBase * bossTimingMult : 0.1 * bossDamageBase;
    bossHp -= bossDamage;

    if (bossHp <= 0) {
      const chapterId = chapter.id;
      const elapsedSec = t - regionEnteredAt;
      regionTimesSec[chapterId] = (regionTimesSec[chapterId] ?? 0) + elapsedSec;
      bossDefeatTimesSec[chapterId] = elapsedSec;

      regionIdx += 1;
      maxRegionReached = Math.max(maxRegionReached, regionIdx + 1);
      regionEnteredAt = t;
      hasUCW = false;

      if (regionIdx >= BOSS_COUNT) {
        prestigeCount += 1;
        regionIdx = 0;
        machineCount = 0;
        workerCount = Math.max(1, Math.floor(workerCount * 0.25));
        engineerCount = Math.max(1, Math.floor(engineerCount * 0.4));
        farmerCount = Math.max(1, Math.floor(farmerCount * 0.4));
        machineCps = 1 + prestigeCount * 0.4; // prestige unlocks stronger baseline automation
        machineCost = 120;
        workerCost = 150;
        coins = 100;
      }
      bossHp = CHAPTERS[regionIdx].boss.maxHp;
    }
  }

  return {
    durationHours,
    regionTimesSec,
    bossDefeatTimesSec,
    prestigeCount,
    cpsCurve,
    machineIncome,
    workerIncome,
    maxRegionReached,
  };
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, n) => s + n, 0) / values.length;
}

function buildScenarioSummary(duration: DurationHours, metrics: SessionMetrics[]) {
  const regionIds = CHAPTERS.slice(0, BOSS_COUNT).map((c) => c.id);
  const avgTimePerRegionHours = Object.fromEntries(
    regionIds.map((regionId) => {
      const vals = metrics.map((m) => (m.regionTimesSec[regionId] ?? 0) / 3600).filter((v) => v > 0);
      return [regionId, Number(mean(vals).toFixed(2))];
    })
  );
  const avgBossDefeatMinutes = Object.fromEntries(
    regionIds.map((regionId) => {
      const vals = metrics.map((m) => (m.bossDefeatTimesSec[regionId] ?? 0) / 60).filter((v) => v > 0);
      return [regionId, Number(mean(vals).toFixed(1))];
    })
  );

  const prestigePerSession = mean(metrics.map((m) => m.prestigeCount));
  const prestigeFrequencyPer100h = Number((prestigePerSession / duration * 100).toFixed(2));

  const cpsByHour: Record<number, number[]> = {};
  metrics.forEach((m) =>
    m.cpsCurve.forEach((p) => {
      cpsByHour[p.hour] = cpsByHour[p.hour] ?? [];
      cpsByHour[p.hour].push(p.coinsPerSecond);
    })
  );
  const cpsCurve = Object.entries(cpsByHour)
    .map(([h, values]) => ({ hour: Number(h), avgCoinsPerSecond: Number(mean(values).toFixed(2)) }))
    .sort((a, b) => a.hour - b.hour);

  const machineIncome = metrics.reduce((s, m) => s + m.machineIncome, 0);
  const workerIncome = metrics.reduce((s, m) => s + m.workerIncome, 0);
  const machineShare = machineIncome / Math.max(1, machineIncome + workerIncome);
  const avgMaxRegionReached = mean(metrics.map((m) => m.maxRegionReached));

  const symptoms: string[] = [];
  if (avgMaxRegionReached < 3) symptoms.push('Early game too slow: players are stuck below Region 3.');
  const midStartId = CHAPTERS[MID_GAME_START_CHAPTER_INDEX]?.id;
  const midEndId = CHAPTERS[MID_GAME_END_CHAPTER_INDEX]?.id;
  const lateGameId = CHAPTERS[LATE_GAME_CHAPTER_INDEX]?.id;

  if (midStartId && midEndId && avgTimePerRegionHours[midStartId] && avgTimePerRegionHours[midEndId] && avgTimePerRegionHours[midEndId] > avgTimePerRegionHours[midStartId] * 2) {
    symptoms.push('Mid-game dead zone: Regions 5–8 are significantly slower than early progression.');
  }
  if (lateGameId && avgTimePerRegionHours[lateGameId] && avgTimePerRegionHours[lateGameId] < LATE_GAME_EXPLOSION_THRESHOLD_HOURS) {
    symptoms.push('Late-game explosion: Region 10+ appears to break intended scaling.');
  }
  if (machineShare > 0.75 || machineShare < 0.25) {
    symptoms.push('One dominant strategy detected: economy is too skewed toward only machines or only workers.');
  }
  if (symptoms.length === 0) symptoms.push('No critical pacing symptom detected for this scenario.');

  return {
    duration_hours: duration,
    avg_time_per_region_hours: avgTimePerRegionHours,
    avg_boss_defeat_minutes: avgBossDefeatMinutes,
    prestige_frequency_per_100h: prestigeFrequencyPer100h,
    cps_curve: cpsCurve,
    machine_vs_worker_dominance: {
      machine_income_share: Number(machineShare.toFixed(3)),
      worker_income_share: Number((1 - machineShare).toFixed(3)),
    },
    symptoms,
  };
}

console.log(`🎯 Balance Phase Simulator — ${SESSIONS} sessions/scenario, seed=${SEED}`);
const report = {
  schema: 'infinityfg-balance-phase/v1',
  issued_by: 'SimulationQA_AI',
  timestamp: new Date().toISOString(),
  input: { sessions: SESSIONS, seed: SEED, durations_hours: DURATIONS },
  scenarios: [] as ReturnType<typeof buildScenarioSummary>[],
};

for (const duration of DURATIONS) {
  const scenarioSessions: SessionMetrics[] = [];
  for (let i = 0; i < SESSIONS; i++) {
    scenarioSessions.push(runSession(duration, SEED + duration * 10_000 + i * 31337));
  }
  report.scenarios.push(buildScenarioSummary(duration, scenarioSessions));
}

const reportDir = getSimulationReportDir();
const jsonPath = writeTimestampedJsonReport(reportDir, 'balance_phase_report', report);
const summaryPath = `${reportDir}/balance_phase_summary_latest.md`;

const summary = [
  '# InfinityFG Balance Phase Summary',
  '',
  `Generated: ${report.timestamp}`,
  '',
  ...report.scenarios.flatMap((scenario) => [
    `## ${scenario.duration_hours}h scenario`,
    `- Prestige frequency (/100h): ${scenario.prestige_frequency_per_100h}`,
    `- Machine share: ${(scenario.machine_vs_worker_dominance.machine_income_share * 100).toFixed(1)}%`,
    `- Worker share: ${(scenario.machine_vs_worker_dominance.worker_income_share * 100).toFixed(1)}%`,
    `- Symptoms: ${scenario.symptoms.join(' | ')}`,
    '',
  ]),
].join('\n');

writeTextReport(summaryPath, summary);

console.log(`📁 JSON: ${jsonPath}`);
console.log(`📁 Summary: ${summaryPath}`);
console.log('✅ Balance phase simulation completed.');
