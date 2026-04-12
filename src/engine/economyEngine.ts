export function calculateMachineCost(
  baseCost: number,
  owned: number,
  scaling: number,
): number {
  return baseCost * Math.pow(scaling, owned);
}
