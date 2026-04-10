import { runSimulation } from './balanceSim';

export interface AutoBalanceConfig {
  cropValueScale: number;
  bossScale: number;
  machineScale: number;
}

export function autoBalance(): AutoBalanceConfig {
  const config: AutoBalanceConfig = {
    cropValueScale: 1.8,
    bossScale: 25,
    machineScale: 1.15,
  };

  for (let i = 0; i < 20; i++) {
    const result = runSimulation(50, config);

    // TARGET: reach region 12 in ~50 hours
    if (result.region < 12) {
      config.cropValueScale *= 1.05;
      config.machineScale *= 1.02;
    }

    if (result.region > 12) {
      config.bossScale *= 1.05;
    }
  }

  return config;
}
