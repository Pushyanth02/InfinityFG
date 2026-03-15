export interface SkillNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  dependencies: string[];
  tree: 'farming' | 'automation' | 'economy';
  bonus: { type: string; value: number };
}

export const SKILL_TREE: SkillNode[] = [
  // Farming Tree
  {
    id: 'skill_f_01',
    name: 'Rapid Sowing',
    description: 'Manual planting speed increased by 50%.',
    cost: 100,
    dependencies: [],
    tree: 'farming',
    bonus: { type: 'plant_speed', value: 0.5 }
  },
  {
    id: 'skill_f_02',
    name: 'Bountiful Harvest',
    description: '+10% yield from all manual harvests.',
    cost: 500,
    dependencies: ['skill_f_01'],
    tree: 'farming',
    bonus: { type: 'manual_yield', value: 0.1 }
  },
  
  // Automation Tree
  {
    id: 'skill_a_01',
    name: 'Circuit Overload',
    description: 'Machines produce 5% faster.',
    cost: 250,
    dependencies: [],
    tree: 'automation',
    bonus: { type: 'machine_speed', value: 0.05 }
  },
  {
    id: 'skill_a_02',
    name: 'Teflon Gears',
    description: 'Machine maintenance costs reduced by 15%.',
    cost: 1000,
    dependencies: ['skill_a_01'],
    tree: 'automation',
    bonus: { type: 'machine_maint', value: -0.15 }
  },

  // Economy Tree
  {
    id: 'skill_e_01',
    name: 'Market Insider',
    description: 'Sell all crops for 5% more coins.',
    cost: 500,
    dependencies: [],
    tree: 'economy',
    bonus: { type: 'sell_multiplier', value: 0.05 }
  },
  {
    id: 'skill_e_02',
    name: 'Tax Haven',
    description: 'Unlock costs for regions reduced by 20%.',
    cost: 2500,
    dependencies: ['skill_e_01'],
    tree: 'economy',
    bonus: { type: 'unlock_discount', value: 0.2 }
  }
];
