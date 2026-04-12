export interface AdaptiveDifficultyInput {
  coinsPerSecond: number;
  lifetimeCoins: number;
  chapterNumber: number;
  playTimeHours: number;
  bossBaseHp: number;
}

export interface AdaptiveDifficultyResult {
  skill: number;
  bossMaxHp: number;
  attackCooldownMultiplier: number;
  rewardMultiplier: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function calculatePlayerSkill(input: Omit<AdaptiveDifficultyInput, 'bossBaseHp'>): number {
  const efficiency = input.coinsPerSecond / Math.max(input.lifetimeCoins, 1);
  const progressionSpeed = input.chapterNumber / Math.max(input.playTimeHours, 1);
  return Math.max(0, efficiency * 0.5 + progressionSpeed * 0.5);
}

export function applyAdaptiveDifficulty(input: AdaptiveDifficultyInput): AdaptiveDifficultyResult {
  const skill = calculatePlayerSkill(input);
  const bossMaxHp = input.bossBaseHp * (1 + skill * 0.5);
  const attackCooldownMultiplier = 1 - skill * 0.3;
  const rewardMultiplier = 1 + skill * 0.4;

  return clampDifficulty({
    skill,
    bossMaxHp,
    attackCooldownMultiplier,
    rewardMultiplier,
  }, input.bossBaseHp);
}

export function clampDifficulty(
  result: AdaptiveDifficultyResult,
  bossBaseHp: number,
): AdaptiveDifficultyResult {
  return {
    ...result,
    bossMaxHp: clamp(result.bossMaxHp, bossBaseHp, bossBaseHp * 3),
    attackCooldownMultiplier: clamp(result.attackCooldownMultiplier, 0.5, 1.25),
    rewardMultiplier: Math.max(1, result.rewardMultiplier),
  };
}
