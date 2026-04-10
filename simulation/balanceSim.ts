import { simulateGame, type SimulatableGameState } from '../src/simulation/balanceSim';

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
  cropValueScale: 1.8,
  bossScale: 25,
  machineScale: 1.15,
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

export function runSimulation(hours = 50, config: BalanceConfig = DEFAULT_CONFIG): BalanceRunResult {
  const final = simulateGame(createState(config), hours);
  const region = Math.max(1, Math.floor(Math.log10(Math.max(1, final.coins)) * 1.6));
  return {
    region,
    coins: Math.round(final.coins),
    coinsPerSecond: Math.round(final.coinsPerSecond * 100) / 100,
  };
}
