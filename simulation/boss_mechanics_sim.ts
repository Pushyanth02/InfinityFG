import { CHAPTERS } from '../src/data/chapters';
import { applyBossHit, runBossTick } from '../src/engine/bossEngine';
import { getSimulationReportDir } from './sharedGameConfig';
import { writeTimestampedJsonReport } from './reportIo';

interface BossSimResult {
  chapterId: string;
  bossId: string;
  defeated: boolean;
  timeToDefeatSec: number | null;
  totalDamage: number;
  totalRegen: number;
  totalCoinDrain: number;
}

function runBossScenario(chapterIndex: number): BossSimResult {
  const chapter = CHAPTERS[chapterIndex];
  const boss = chapter.boss;
  const dt = 0.25;
  const maxDurationSec = 20 * 60;
  const baseDps = 14 + chapterIndex * 4;
  const harvestDamage = 10 + chapterIndex * 3;
  const weakCropId = boss.weakCropIds[0];

  let hp = boss.maxHp;
  let elapsed = 0;
  let totalDamage = 0;
  let totalRegen = 0;
  let totalCoinDrain = 0;
  let timeToDefeatSec: number | null = null;

  for (; elapsed < maxDurationSec && hp > 0; elapsed += dt) {
    const tick = runBossTick({
      boss,
      currentHp: hp,
      baseDps,
      deltaSec: dt,
      elapsedSec: elapsed,
    });
    hp = tick.nextHp;
    totalDamage += tick.damageApplied;
    totalRegen += tick.regenApplied;
    totalCoinDrain += tick.coinDrain;

    if (hp <= 0) {
      timeToDefeatSec = elapsed;
      break;
    }

    // Deterministic periodic harvest hit.
    if (weakCropId && Math.floor(elapsed) % 7 === 0) {
      const hit = applyBossHit(boss, hp, harvestDamage * 3, elapsed);
      hp = hit.nextHp;
      totalDamage += hit.damageApplied;
      if (hp <= 0) {
        timeToDefeatSec = elapsed;
        break;
      }
    }
  }

  return {
    chapterId: chapter.id,
    bossId: boss.id,
    defeated: hp <= 0,
    timeToDefeatSec,
    totalDamage: Math.round(totalDamage),
    totalRegen: Math.round(totalRegen),
    totalCoinDrain: Math.round(totalCoinDrain),
  };
}

const results = CHAPTERS.map((_, idx) => runBossScenario(idx));
const defeatedCount = results.filter((r) => r.defeated).length;

const report = {
  schema: 'agriempire-boss-sim/v1',
  generatedAt: new Date().toISOString(),
  summary: {
    chapters: CHAPTERS.length,
    defeatedCount,
    defeatRatePct: Math.round((defeatedCount / Math.max(1, CHAPTERS.length)) * 100),
  },
  results,
};

const outPath = writeTimestampedJsonReport(getSimulationReportDir(), 'boss_sim_report', report);
console.log('Boss sim report:', outPath);
