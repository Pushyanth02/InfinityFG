export interface GameState {
  coins: number;
  lifetimeCoins: number;

  region: number;
  bossHP: number;

  crops: Record<string, number>;
  machines: Record<string, number>;
  workers: Record<string, number>;

  coinsPerSecond: number;
  nextUpgradeCost: number;
  buyUpgrade: () => void;
}
