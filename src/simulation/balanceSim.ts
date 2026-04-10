export interface SimulatableGameState {
  coins: number;
  coinsPerSecond: number;
  nextUpgradeCost: number;
  buyUpgrade: () => void;
}

export function simulateGame(state: SimulatableGameState, hours = 50): SimulatableGameState {
  let time = 0;
  const dt = 1;

  while (time < hours * 3600) {
    const production = state.coinsPerSecond;
    state.coins += production * dt;

    if (state.coins > state.nextUpgradeCost) {
      state.buyUpgrade();
    }

    time += dt;
  }

  return state;
}
