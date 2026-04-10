export function calculateSpiritPoints(lifetimeCoins: number): number {
  if (lifetimeCoins <= 0) return 0;
  return Math.floor(10 * Math.log10(lifetimeCoins));
}

export function getPrestigeMultiplier(points: number): number {
  return 1 + points * 0.05;
}
