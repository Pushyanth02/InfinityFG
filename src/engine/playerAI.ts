import type { BossAttackDefinition } from './bossAttackEngine';

export type PlayerStrategy = 'automation' | 'diversifier' | 'speedrunner' | 'balanced';

export interface PlayerStrategyContext {
  totalMachines: number;
  cropDiversity: number;
  prestigeCount: number;
  playTimeHours: number;
}

export interface BossAdaptation {
  strategy: PlayerStrategy;
  extraAttack?: BossAttackDefinition;
  shieldGain: number;
  cooldownMultiplier: number;
}

export function detectPlayerStrategy(input: PlayerStrategyContext): PlayerStrategy {
  const machineRatio =
    input.totalMachines / Math.max(input.totalMachines + input.cropDiversity, 1);
  const prestigeFreq = input.prestigeCount / Math.max(input.playTimeHours, 1);

  if (machineRatio > 0.7) return 'automation';
  if (input.cropDiversity > 5) return 'diversifier';
  if (prestigeFreq > 2) return 'speedrunner';
  return 'balanced';
}

export function adaptBossToPlayer(strategy: PlayerStrategy): BossAdaptation {
  switch (strategy) {
    case 'automation':
      return {
        strategy,
        extraAttack: {
          id: 'meta_counter_stun',
          type: 'stun',
          cooldown: 10,
          power: 1,
        },
        shieldGain: 0,
        cooldownMultiplier: 0.95,
      };
    case 'diversifier':
      return {
        strategy,
        extraAttack: {
          id: 'meta_counter_drain',
          type: 'drain',
          cooldown: 8,
          power: 0.1,
        },
        shieldGain: 0,
        cooldownMultiplier: 0.95,
      };
    case 'speedrunner':
      return {
        strategy,
        shieldGain: 20_000,
        cooldownMultiplier: 0.9,
      };
    default:
      return {
        strategy,
        shieldGain: 0,
        cooldownMultiplier: 1,
      };
  }
}
