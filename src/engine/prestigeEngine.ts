import { GAME_CONFIG } from '../config/gameConfig';

export function calculateSpiritPoints(lifetimeCoins: number): number {
  return Math.floor(
    GAME_CONFIG.PRESTIGE_LOG_BASE * Math.log10(Math.max(lifetimeCoins, 1)),
  );
}

export function getPrestigeMultiplier(points: number): number {
  return 1 + points * GAME_CONFIG.PRESTIGE_BONUS_PER_POINT;
}

export function getSpiritPoints(coins: number): number {
  return calculateSpiritPoints(coins);
}
