import UCW_DATA from '../data/ucw.json';

export type UcwEffect = 'shield_break' | 'burst_dps' | 'true_damage';

export interface UcwDefinition {
  id: string;
  name: string;
  region: number;
  requiredCrop: string;
  cost: number;
  effect: UcwEffect;
  multiplier: number;
}

export interface UcwCombatState {
  bossHP: number;
  bossShield: number;
  activeUCW: UcwDefinition[];
}

export const UCW: UcwDefinition[] = UCW_DATA as UcwDefinition[];

export function applyUCW(state: UcwCombatState, dps: number, deltaSec = 1): number {
  let finalDps = dps;

  for (const ucw of state.activeUCW) {
    switch (ucw.effect) {
      case 'shield_break': {
        const shieldDamage = dps * ucw.multiplier * deltaSec;
        state.bossShield = Math.max(0, state.bossShield - shieldDamage);
        break;
      }
      case 'burst_dps':
        finalDps *= ucw.multiplier;
        break;
      case 'true_damage': {
        const trueDamage = dps * ucw.multiplier * deltaSec;
        state.bossHP = Math.max(0, state.bossHP - trueDamage);
        break;
      }
      default:
        break;
    }
  }

  return finalDps;
}

export function getUcwsByRegion(maxRegion: number): UcwDefinition[] {
  return UCW.filter((ucw) => ucw.region <= maxRegion);
}
