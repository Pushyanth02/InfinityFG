export interface CropDef {
  id: string;
  growthSec: number;
  yieldAmt: number;
  baseValue: number;
  seedCost: number;
  rarity: string;
}

export interface MachineDef {
  id: string;
  tier: number;
  baseCost: number;
  cps: number;
  automation: number;
}

export type Profile = 'casual' | 'active' | 'whale_sim';

export const CROPS: CropDef[] = [
  { id: 'wheat', growthSec: 30, yieldAmt: 4, baseValue: 6, seedCost: 3, rarity: 'common' },
  { id: 'potato', growthSec: 60, yieldAmt: 5, baseValue: 12, seedCost: 6, rarity: 'common' },
  { id: 'rice', growthSec: 90, yieldAmt: 6, baseValue: 14, seedCost: 7, rarity: 'uncommon' },
  { id: 'grape', growthSec: 200, yieldAmt: 5, baseValue: 120, seedCost: 60, rarity: 'rare' },
  { id: 'coffee', growthSec: 300, yieldAmt: 3, baseValue: 222, seedCost: 111, rarity: 'rare' },
  { id: 'saffron', growthSec: 500, yieldAmt: 1, baseValue: 3497, seedCost: 1748, rarity: 'epic' },
  { id: 'w_truffle', growthSec: 3600, yieldAmt: 1, baseValue: 40000, seedCost: 20000, rarity: 'legendary' },
];

export const MACHINES: MachineDef[] = [
  { id: 'seed_sorter', tier: 1, baseCost: 100, cps: 0.2, automation: 2 },
  { id: 'auto_planter', tier: 1, baseCost: 200, cps: 0.5, automation: 2 },
  { id: 'drip_irrig', tier: 1, baseCost: 350, cps: 0.8, automation: 2 },
  { id: 'auto_harvest', tier: 2, baseCost: 3500, cps: 4.0, automation: 3 },
  { id: 'grain_mill', tier: 2, baseCost: 2800, cps: 3.0, automation: 3 },
  { id: 'hydroponic', tier: 3, baseCost: 25000, cps: 30.0, automation: 4 },
  { id: 'mega_harvest', tier: 4, baseCost: 80000, cps: 100.0, automation: 5 },
  { id: 'ai_farm_mgr', tier: 5, baseCost: 350000, cps: 350.0, automation: 6 },
];

export const PROFILE_PARAMS: Record<
  Profile,
  {
    sessionFrequency: number;
    activityRatio: number;
    machineBuyAggressiveness: number;
    upgradeSpendRatio: number;
    processingUsage: number;
  }
> = {
  casual: { sessionFrequency: 1, activityRatio: 0.2, machineBuyAggressiveness: 0.3, upgradeSpendRatio: 0.2, processingUsage: 0.1 },
  active: { sessionFrequency: 4, activityRatio: 0.5, machineBuyAggressiveness: 0.7, upgradeSpendRatio: 0.5, processingUsage: 0.4 },
  whale_sim: { sessionFrequency: 8, activityRatio: 0.9, machineBuyAggressiveness: 1.0, upgradeSpendRatio: 0.9, processingUsage: 0.9 },
};
