import { CROPS } from '../data/crops';
import { AUGMENTED_MACHINES } from '../data/machine_upgrades';
import { WORKERS } from '../data/world';
import { SKILL_TREE } from '../data/skills';
import type { PlayerMachine } from '../types/base';

/**
 * Calculates a total multiplier from a set of unlocked skills for a specific bonus type.
 */
export const getSkillMultiplier = (unlockedSkills: string[], bonusType: string): number => {
  return unlockedSkills.reduce((acc, skillId) => {
    const skill = SKILL_TREE.find(s => s.id === skillId);
    if (skill && skill.bonus.type === bonusType) {
      return acc + skill.bonus.value;
    }
    return acc;
  }, 1);
};

/**
 * Formats large numbers into human-readable strings (k, M, B, T).
 */
export const fmt = (num: number) => {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'k';
  return Math.floor(num).toLocaleString();
};

/**
 * Calculates interest/growth for a single plot based on delta time.
 */
export const calculatePlotGrowth = (
  currentProgress: number,
  cropId: string,
  delta: number,
  unlockedSkills: string[] = []
): { nextProgress: number; isReady: boolean } => {
  const crop = CROPS.find((c) => c.id === cropId);
  if (!crop) return { nextProgress: currentProgress, isReady: false };

  // Farming skill: plant_speed (affects growth time in this sim)
  const growthMultiplier = getSkillMultiplier(unlockedSkills, 'plant_speed');
  const effectiveGrowthTime = crop.growthTime / growthMultiplier;

  const nextProgress = currentProgress + delta / effectiveGrowthTime;
  return {
    nextProgress: Math.min(1, nextProgress),
    isReady: nextProgress >= 1,
  };
};

/**
 * Calculates coin gain from automated machines.
 * Incorporates upgrade levels (speed, yield), worker bonuses, and skill multipliers.
 */
export const calculateMachineProduction = (
  machines: PlayerMachine[],
  workers: Record<string, number>,
  delta: number,
  unlockedSkills: string[] = [],
  prestigePoints: number = 0
): number => {
  let coinGain = 0;
  
  const workerBonus = 1 + Object.entries(workers).reduce((acc, [id, count]) => {
    const wDef = WORKERS.find(w => w.id === id);
    return acc + (wDef ? wDef.efficiency_bonus * count : 0);
  }, 0);

  const machineSpeedBonus = getSkillMultiplier(unlockedSkills, 'machine_speed');
  const sellMultiplier = getSkillMultiplier(unlockedSkills, 'sell_multiplier');
  const prestigeBonus = 1 + (prestigePoints || 0) * 0.1;

  // Optimize: Pre-map definitions for O(1) lookup
  const machineDefs = new Map(AUGMENTED_MACHINES.map(m => [m.id, m]));

  machines.forEach(pm => {
    const def = machineDefs.get(pm.machineId);
    if (def && !pm.isBroken) {
      // Base production rate from definition
      let cps = (def.productionRate.cropsPerMin / 60) * machineSpeedBonus;
      
      // Apply Speed Upgrade: Each level adds 10% speed
      cps *= (1 + pm.level.speed * 0.1);
      
      // Base value per crop: based on tier
      let seedValue = 10 * Math.pow(1.5, def.tier) * sellMultiplier * prestigeBonus;
      
      // Apply Yield Upgrade: Each level adds 15% yield
      seedValue *= (1 + pm.level.yield * 0.15);
      
      coinGain += cps * pm.count * delta * seedValue * workerBonus;
    }
  });

  return coinGain;
};

/**
 * Calculates the cost of the next machine.
 */
export const getMachineCost = (baseCost: number, currentCount: number): number => {
  return Math.floor(baseCost * Math.pow(1.18, currentCount));
};

/**
 * Calculates the cost of a machine upgrade.
 */
export const getUpgradeCost = (baseCost: number, level: number): number => {
  return Math.floor(baseCost * 0.5 * Math.pow(1.2, level));
};

/**
 * Calculates the cost of hiring a worker.
 */
export const getWorkerCost = (baseCost: number, currentCount: number): number => {
  return Math.floor(baseCost * Math.pow(2.5, currentCount));
};

/**
 * Calculates the cost of buying a new plot.
 */
export const getPlotCost = (plotCount: number): number => {
  return Math.floor(100 * Math.pow(2, plotCount - 4));
};
