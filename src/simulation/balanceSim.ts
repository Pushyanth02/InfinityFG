import { GAME_CONFIG } from '../config/gameConfig';

export interface SimulatableGameState {
  coins: number;
  coinsPerSecond: number;
  nextUpgradeCost: number;
  buyUpgrade: () => void;
}

function clampFinitePositive(value: number, fallback = 0): number {
  if (!Number.isFinite(value)) return fallback;
  if (value <= 0) return 0;
  return Math.min(value, GAME_CONFIG.SIMULATION_VALUE_CAP);
}

export function simulateGame(state: SimulatableGameState, hours = 50): SimulatableGameState {
  let time = 0;
  const dt = 1;

  while (time < hours * 3600) {
    const production = clampFinitePositive(state.coinsPerSecond, 0);
    state.coins = clampFinitePositive(state.coins + production * dt, 0);

    if (state.coins > state.nextUpgradeCost) {
      state.buyUpgrade();
      state.coins = clampFinitePositive(state.coins, 0);
      state.coinsPerSecond = clampFinitePositive(state.coinsPerSecond, 0);
      state.nextUpgradeCost = clampFinitePositive(state.nextUpgradeCost, GAME_CONFIG.SIMULATION_VALUE_CAP);
    }

    if (!Number.isFinite(state.coins) || !Number.isFinite(state.coinsPerSecond) || !Number.isFinite(state.nextUpgradeCost)) {
      state.coins = clampFinitePositive(state.coins, GAME_CONFIG.SIMULATION_VALUE_CAP);
      state.coinsPerSecond = clampFinitePositive(state.coinsPerSecond, 0);
      state.nextUpgradeCost = clampFinitePositive(state.nextUpgradeCost, GAME_CONFIG.SIMULATION_VALUE_CAP);
      break;
    }

    time += dt;
  }

  return state;
}
