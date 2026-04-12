import { runSimulation } from './balanceSim';
import { GAME_CONFIG } from '../src/config/gameConfig';

export interface AutoBalanceConfig {
  cropValueScale: number;
  bossScale: number;
  machineScale: number;
}

const MAX_BALANCE_ITERATIONS = 20;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function autoBalance(): AutoBalanceConfig {
  const config: AutoBalanceConfig = {
    cropValueScale: GAME_CONFIG.CROP_VALUE_BASE,
    bossScale: GAME_CONFIG.AI_BALANCER_BOSS_SCALE_BASE,
    machineScale: GAME_CONFIG.AI_BALANCER_MACHINE_SCALE_BASE,
  };

  for (let i = 0; i < MAX_BALANCE_ITERATIONS; i++) {
    const result = runSimulation(50, config);

    // TARGET: reach region 12 in ~50 hours
    if (result.region < 12) {
      config.cropValueScale = clamp(
        config.cropValueScale * 1.05,
        GAME_CONFIG.AI_BALANCER_CROP_VALUE_MIN,
        GAME_CONFIG.AI_BALANCER_CROP_VALUE_MAX
      );
      config.machineScale = clamp(
        config.machineScale * 1.02,
        GAME_CONFIG.AI_BALANCER_MACHINE_SCALE_MIN,
        GAME_CONFIG.AI_BALANCER_MACHINE_SCALE_MAX
      );
    }

    if (result.region > 12) {
      config.bossScale = clamp(
        config.bossScale * 1.05,
        GAME_CONFIG.AI_BALANCER_BOSS_SCALE_MIN,
        GAME_CONFIG.AI_BALANCER_BOSS_SCALE_MAX
      );
    }
  }

  return config;
}
