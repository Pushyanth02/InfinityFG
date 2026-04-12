import { simulateGame, type SimulatableGameState } from '../src/simulation/balanceSim';
import { GAME_CONFIG } from '../src/config/gameConfig';

export interface BalanceRunResult {
  region: number;
  coins: number;
  coinsPerSecond: number;
}

export interface BalanceConfig {
  cropValueScale: number;
  bossScale: number;
  machineScale: number;
}

const DEFAULT_CONFIG: BalanceConfig = {
  cropValueScale: GAME_CONFIG.CROP_VALUE_BASE,
  bossScale: GAME_CONFIG.AI_BALANCER_BOSS_SCALE_BASE,
  machineScale: GAME_CONFIG.AI_BALANCER_MACHINE_SCALE_BASE,
};

function createState(config: BalanceConfig): SimulatableGameState {
  const state: SimulatableGameState = {
    coins: 100 * config.cropValueScale,
    coinsPerSecond: 1 * config.machineScale,
    nextUpgradeCost: 50,
    buyUpgrade: () => {
      if (state.coins < state.nextUpgradeCost) return;
      state.coins -= state.nextUpgradeCost;
      state.coinsPerSecond *= 1.12 * config.machineScale;
      state.nextUpgradeCost *= 1.18 + config.bossScale / 500;
    },
  };
  return state;
}

function sanitizeFinite(value: number, fallback = 0): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(value, GAME_CONFIG.SIMULATION_VALUE_CAP));
}

export function runSimulation(hours = 50, config: BalanceConfig = DEFAULT_CONFIG): BalanceRunResult {
  const final = simulateGame(createState(config), hours);
  const safeCoins = sanitizeFinite(final.coins, 0);
  const safeCps = sanitizeFinite(final.coinsPerSecond, 0);
  const rawRegion = Math.floor(Math.log10(Math.max(1, safeCoins)) * 1.6);
  const region = Math.max(1, Number.isFinite(rawRegion) ? rawRegion : 1);
  return {
    region,
    coins: Math.round(safeCoins),
    coinsPerSecond: Math.round(safeCps * 100) / 100,
  };
}
