import { GAME_CONFIG } from '../config/gameConfig';

export function getInfinityMultiplier(coins: number): number {
  const safeCoins = Math.max(1, coins);
  const tier = Math.log10(safeCoins) / GAME_CONFIG.INFINITY_TIER_DIVISOR;
  return Math.pow(GAME_CONFIG.INFINITY_GROWTH_BASE, tier);
}
