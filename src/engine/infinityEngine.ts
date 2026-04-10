export function getInfinityMultiplier(coins: number): number {
  const safeCoins = Math.max(1, coins);
  const tier = Math.log10(safeCoins) / 10;
  return Math.pow(1.1, tier);
}
