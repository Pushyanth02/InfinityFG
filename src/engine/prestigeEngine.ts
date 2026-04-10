export function calculateSpiritPoints(lifetimeCoins: number): number {
  return Math.floor(10 * Math.log10(Math.max(lifetimeCoins, 1)));
}

export function getPrestigeMultiplier(points: number): number {
  return 1 + points * 0.05;
}

export function getSpiritPoints(coins: number): number {
  return calculateSpiritPoints(coins);
}
