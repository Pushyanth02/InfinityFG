import type { ChapterBoss } from '../data/chapters';
import { GAME_CONFIG } from '../config/gameConfig';

export interface BossTickInput {
  boss: ChapterBoss;
  currentHp: number;
  baseDps: number;
  deltaSec: number;
  elapsedSec: number;
}

export interface BossTickResult {
  nextHp: number;
  damageApplied: number;
  regenApplied: number;
  coinDrain: number;
  nextElapsedSec: number;
}

const MECHANIC_REGEN = new Set(['spread_patches', 'void_spread', 'canopy_growth']);
const MECHANIC_DRAIN = new Set(['root_drain', 'light_absorption']);
const MECHANIC_ARMOR = new Set(['hardened_cores', 'core_harden', 'acid_resist', 'fire_shell']);
const MECHANIC_MIST = new Set(['frost_spores', 'spore_cloud']);
const MECHANIC_BURST = new Set(['bloating_surge', 'mite_swarm', 'swarm_scatter', 'locust_wave', 'ember_burst']);

function hasAny(mechanics: string[] | undefined, set: Set<string>): boolean {
  if (!mechanics?.length) return false;
  return mechanics.some((m) => set.has(m));
}

function getDamageTakenMultiplier(boss: ChapterBoss, hpRatio: number, elapsedSec: number): number {
  const mechanics = boss.mechanics ?? [];
  let mult = 1;

  if (hasAny(mechanics, MECHANIC_ARMOR) && hpRatio <= 0.6) mult *= 0.8;
  if (hasAny(mechanics, MECHANIC_MIST)) mult *= 0.9;

  // Periodic defensive windows to create deterministic combat pacing.
  if (hasAny(mechanics, MECHANIC_BURST)) {
    const cycleSec = 12;
    const activeWindowSec = 3;
    if (elapsedSec % cycleSec < activeWindowSec) mult *= 0.6;
  }

  if (mechanics.includes('legendary_weakness') && hpRatio <= 0.25) mult *= 1.5;

  return mult;
}

function getRegenPerSec(boss: ChapterBoss, hpRatio: number, elapsedSec: number): number {
  const mechanics = boss.mechanics ?? [];
  let regen = 0;

  if (hasAny(mechanics, MECHANIC_REGEN)) {
    regen += boss.maxHp * 0.0012;
  }
  if (mechanics.includes('bloating_surge') && elapsedSec % 15 < 2) {
    regen += boss.maxHp * 0.0035;
  }
  if (hpRatio <= 0.3) {
    // Late-fight recovery pressure.
    regen += boss.maxHp * 0.0004;
  }

  return regen;
}

function getCoinDrainPerSec(boss: ChapterBoss): number {
  if (!hasAny(boss.mechanics, MECHANIC_DRAIN)) return 0;
  return Math.max(1, boss.maxHp * GAME_CONFIG.BOSS_COIN_DRAIN_PER_HP_RATIO);
}

export function runBossTick(input: BossTickInput): BossTickResult {
  const { boss, currentHp, baseDps, deltaSec, elapsedSec } = input;
  if (currentHp <= 0 || deltaSec <= 0 || baseDps <= 0) {
    return {
      nextHp: currentHp,
      damageApplied: 0,
      regenApplied: 0,
      coinDrain: 0,
      nextElapsedSec: elapsedSec + Math.max(0, deltaSec),
    };
  }

  const hpRatio = Math.max(0, Math.min(1, currentHp / Math.max(1, boss.maxHp)));
  const damageMult = getDamageTakenMultiplier(boss, hpRatio, elapsedSec);
  const regenPerSec = getRegenPerSec(boss, hpRatio, elapsedSec);
  const coinDrainPerSec = getCoinDrainPerSec(boss);

  const rawDamage = baseDps * deltaSec;
  const damageApplied = Math.max(0, rawDamage * damageMult);
  const regenApplied = Math.max(0, regenPerSec * deltaSec);
  const nextHp = Math.max(0, Math.min(boss.maxHp, currentHp - damageApplied + regenApplied));

  return {
    nextHp,
    damageApplied,
    regenApplied,
    coinDrain: coinDrainPerSec * deltaSec,
    nextElapsedSec: elapsedSec + deltaSec,
  };
}

export function applyBossHit(
  boss: ChapterBoss,
  currentHp: number,
  baseDamage: number,
  elapsedSec: number,
): { nextHp: number; damageApplied: number } {
  if (currentHp <= 0 || baseDamage <= 0) return { nextHp: currentHp, damageApplied: 0 };
  const hpRatio = Math.max(0, Math.min(1, currentHp / Math.max(1, boss.maxHp)));
  const damageMult = getDamageTakenMultiplier(boss, hpRatio, elapsedSec);
  const damageApplied = Math.max(0, baseDamage * damageMult);
  return { nextHp: Math.max(0, currentHp - damageApplied), damageApplied };
}
