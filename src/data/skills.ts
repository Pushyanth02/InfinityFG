// ============================================================
// COZY GARDEN — Expanded Skill Garden
// Five branching skill trees with meaningful playstyle choices.
// ============================================================

import type { UnlockMetadata } from '../types/unlock';
import { chapterGated, ALWAYS_UNLOCKED } from '../types/unlock';

/**
 * Skill trees representing different playstyles.
 */
export type SkillTree =
  | 'green_thumb'   // Manual farming focus
  | 'automaton'     // Machine/automation focus
  | 'merchant'      // Economy/trading focus
  | 'alchemist'     // Processing/crafting focus
  | 'pioneer';      // Region expansion focus

/**
 * Skill tiers for visual grouping.
 */
export type SkillTier = 'basic' | 'advanced' | 'expert' | 'master';

/**
 * Bonus application timing.
 */
export type BonusApplication = 'passive' | 'on_harvest' | 'on_sell' | 'on_tick' | 'on_craft';

/**
 * Individual skill bonus.
 */
export interface SkillBonus {
  type: string;
  value: number;
  application: BonusApplication;
}

/**
 * Extended skill node with unlock gating and exclusives.
 */
export interface ExtendedSkillNode {
  id: string;
  name: string;
  emoji: string;
  description: string;
  tree: SkillTree;
  tier: SkillTier;

  // Position in tree for UI (0-based grid)
  position: { x: number; y: number };

  // Unlock requirements
  unlockMetadata: UnlockMetadata;

  // Tree dependencies
  dependencies: string[];

  // Exclusive skills (cannot have both)
  exclusiveWith?: string[];

  // Cost
  cost: number;

  // Skill point cost (for budget system)
  pointCost: number;

  // Story chapter token gate (optional)
  chapterTokenRequired?: string;

  // Bonuses provided
  bonuses: SkillBonus[];

  // Special effect description (if any)
  specialEffect?: string;
}

// Re-export legacy interface for backwards compatibility
export interface SkillNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  dependencies: string[];
  tree: 'farming' | 'automation' | 'economy';
  bonus: { type: string; value: number };
}

// ============================================================
// GREEN THUMB TREE (Manual Farming Focus)
// ============================================================

const greenThumbSkills: ExtendedSkillNode[] = [
  // TIER 1 - Basic
  {
    id: 'gt_01',
    name: 'Rapid Sowing',
    emoji: '🌱',
    description: 'Plant seeds 50% faster manually.',
    tree: 'green_thumb',
    tier: 'basic',
    position: { x: 1, y: 0 },
    unlockMetadata: ALWAYS_UNLOCKED,
    dependencies: [],
    cost: 100,
    pointCost: 1,
    bonuses: [{ type: 'plant_speed', value: 0.5, application: 'passive' }],
  },
  {
    id: 'gt_02',
    name: 'Bountiful Harvest',
    emoji: '🌾',
    description: '+15% yield from manual harvests.',
    tree: 'green_thumb',
    tier: 'basic',
    position: { x: 1, y: 1 },
    unlockMetadata: chapterGated(1),
    dependencies: ['gt_01'],
    cost: 500,
    pointCost: 1,
    bonuses: [{ type: 'manual_yield', value: 0.15, application: 'on_harvest' }],
  },

  // TIER 2 - Advanced (BRANCHING CHOICE)
  {
    id: 'gt_03a',
    name: 'Speed Farmer',
    emoji: '⚡',
    description: 'Crops grow 25% faster, but -10% manual yield. For active players.',
    tree: 'green_thumb',
    tier: 'advanced',
    position: { x: 0, y: 2 },
    unlockMetadata: chapterGated(2),
    dependencies: ['gt_02'],
    exclusiveWith: ['gt_03b'],
    cost: 2000,
    pointCost: 2,
    bonuses: [
      { type: 'crop_growth', value: 0.25, application: 'passive' },
      { type: 'manual_yield', value: -0.10, application: 'on_harvest' },
    ],
    specialEffect: 'Trade yield for speed',
  },
  {
    id: 'gt_03b',
    name: 'Deep Roots',
    emoji: '🌳',
    description: '+40% manual yield, but crops grow 15% slower. For patient farmers.',
    tree: 'green_thumb',
    tier: 'advanced',
    position: { x: 2, y: 2 },
    unlockMetadata: chapterGated(2),
    dependencies: ['gt_02'],
    exclusiveWith: ['gt_03a'],
    cost: 2000,
    pointCost: 2,
    bonuses: [
      { type: 'manual_yield', value: 0.40, application: 'on_harvest' },
      { type: 'crop_growth', value: -0.15, application: 'passive' },
    ],
    specialEffect: 'Trade speed for yield',
  },

  // TIER 3 - Expert
  {
    id: 'gt_04',
    name: 'Green Thumb Mastery',
    emoji: '💚',
    description: '+20% to all manual farming bonuses.',
    tree: 'green_thumb',
    tier: 'expert',
    position: { x: 1, y: 3 },
    unlockMetadata: chapterGated(4),
    dependencies: ['gt_03a', 'gt_03b'], // Only need ONE of these (checked as OR)
    cost: 8000,
    pointCost: 3,
    bonuses: [
      { type: 'manual_yield', value: 0.20, application: 'on_harvest' },
      { type: 'plant_speed', value: 0.20, application: 'passive' },
    ],
    specialEffect: 'Amplifies all Green Thumb skills',
  },

  // TIER 4 - Master
  {
    id: 'gt_05',
    name: 'Nature\'s Blessing',
    emoji: '✨',
    description: '5% chance for double harvest. Crops sometimes regrow instantly.',
    tree: 'green_thumb',
    tier: 'master',
    position: { x: 1, y: 4 },
    unlockMetadata: chapterGated(6),
    dependencies: ['gt_04'],
    cost: 50000,
    pointCost: 4,
    bonuses: [
      { type: 'double_harvest_chance', value: 0.05, application: 'on_harvest' },
      { type: 'instant_regrow_chance', value: 0.03, application: 'on_harvest' },
    ],
    specialEffect: 'Ultimate manual farming power',
  },
];

// ============================================================
// AUTOMATON TREE (Machine/Automation Focus)
// ============================================================

const automatonSkills: ExtendedSkillNode[] = [
  // TIER 1 - Basic
  {
    id: 'at_01',
    name: 'Circuit Overload',
    emoji: '⚡',
    description: 'Machines produce 10% faster.',
    tree: 'automaton',
    tier: 'basic',
    position: { x: 1, y: 0 },
    unlockMetadata: ALWAYS_UNLOCKED,
    dependencies: [],
    cost: 250,
    pointCost: 1,
    bonuses: [{ type: 'machine_speed', value: 0.10, application: 'passive' }],
  },
  {
    id: 'at_02',
    name: 'Teflon Gears',
    emoji: '⚙️',
    description: 'Machine maintenance costs reduced by 20%.',
    tree: 'automaton',
    tier: 'basic',
    position: { x: 1, y: 1 },
    unlockMetadata: chapterGated(1),
    dependencies: ['at_01'],
    cost: 1000,
    pointCost: 1,
    bonuses: [{ type: 'machine_maint', value: -0.20, application: 'passive' }],
  },

  // TIER 2 - Advanced (BRANCHING CHOICE)
  {
    id: 'at_03a',
    name: 'Overclock Protocol',
    emoji: '🔥',
    description: '+30% machine speed, but +15% wear rate. High risk, high reward.',
    tree: 'automaton',
    tier: 'advanced',
    position: { x: 0, y: 2 },
    unlockMetadata: chapterGated(2),
    dependencies: ['at_02'],
    exclusiveWith: ['at_03b'],
    cost: 4000,
    pointCost: 2,
    bonuses: [
      { type: 'machine_speed', value: 0.30, application: 'passive' },
      { type: 'machine_wear', value: 0.15, application: 'passive' },
    ],
    specialEffect: 'Aggressive automation',
  },
  {
    id: 'at_03b',
    name: 'Efficiency Core',
    emoji: '💎',
    description: '+15% machine yield, -30% wear rate. Steady and reliable.',
    tree: 'automaton',
    tier: 'advanced',
    position: { x: 2, y: 2 },
    unlockMetadata: chapterGated(2),
    dependencies: ['at_02'],
    exclusiveWith: ['at_03a'],
    cost: 4000,
    pointCost: 2,
    bonuses: [
      { type: 'machine_yield', value: 0.15, application: 'passive' },
      { type: 'machine_wear', value: -0.30, application: 'passive' },
    ],
    specialEffect: 'Conservative automation',
  },

  // TIER 3 - Expert
  {
    id: 'at_04',
    name: 'Self-Repair Module',
    emoji: '🔧',
    description: 'Machines slowly repair themselves over time.',
    tree: 'automaton',
    tier: 'expert',
    position: { x: 1, y: 3 },
    unlockMetadata: chapterGated(4),
    dependencies: ['at_03a', 'at_03b'],
    cost: 15000,
    pointCost: 3,
    bonuses: [{ type: 'machine_self_repair', value: 0.01, application: 'on_tick' }],
    specialEffect: 'Passive machine healing',
  },

  // TIER 4 - Master
  {
    id: 'at_05',
    name: 'Factory Synergy',
    emoji: '🏭',
    description: 'Each machine type boosts all others by 2%.',
    tree: 'automaton',
    tier: 'master',
    position: { x: 1, y: 4 },
    unlockMetadata: chapterGated(6),
    dependencies: ['at_04'],
    cost: 75000,
    pointCost: 4,
    bonuses: [{ type: 'machine_type_synergy', value: 0.02, application: 'passive' }],
    specialEffect: 'Machine diversity bonus',
  },
];

// ============================================================
// MERCHANT TREE (Economy/Trading Focus)
// ============================================================

const merchantSkills: ExtendedSkillNode[] = [
  // TIER 1 - Basic
  {
    id: 'mt_01',
    name: 'Market Insider',
    emoji: '📈',
    description: 'Sell all crops for 10% more coins.',
    tree: 'merchant',
    tier: 'basic',
    position: { x: 1, y: 0 },
    unlockMetadata: ALWAYS_UNLOCKED,
    dependencies: [],
    cost: 500,
    pointCost: 1,
    bonuses: [{ type: 'sell_multiplier', value: 0.10, application: 'on_sell' }],
  },
  {
    id: 'mt_02',
    name: 'Tax Haven',
    emoji: '🏦',
    description: 'Unlock costs for regions and content reduced by 15%.',
    tree: 'merchant',
    tier: 'basic',
    position: { x: 1, y: 1 },
    unlockMetadata: chapterGated(1),
    dependencies: ['mt_01'],
    cost: 2500,
    pointCost: 1,
    bonuses: [{ type: 'unlock_discount', value: 0.15, application: 'passive' }],
  },

  // TIER 2 - Advanced (BRANCHING CHOICE)
  {
    id: 'mt_03a',
    name: 'Bulk Buyer',
    emoji: '📦',
    description: 'Seeds cost 25% less. Good for active planting.',
    tree: 'merchant',
    tier: 'advanced',
    position: { x: 0, y: 2 },
    unlockMetadata: chapterGated(2),
    dependencies: ['mt_02'],
    exclusiveWith: ['mt_03b'],
    cost: 6000,
    pointCost: 2,
    bonuses: [{ type: 'seed_cost', value: -0.25, application: 'passive' }],
    specialEffect: 'Reduces planting costs',
  },
  {
    id: 'mt_03b',
    name: 'Premium Seller',
    emoji: '💰',
    description: '+25% sell price for rare+ crops only.',
    tree: 'merchant',
    tier: 'advanced',
    position: { x: 2, y: 2 },
    unlockMetadata: chapterGated(2),
    dependencies: ['mt_02'],
    exclusiveWith: ['mt_03a'],
    cost: 6000,
    pointCost: 2,
    bonuses: [{ type: 'rare_sell_multiplier', value: 0.25, application: 'on_sell' }],
    specialEffect: 'Focus on rare crops',
  },

  // TIER 3 - Expert
  {
    id: 'mt_04',
    name: 'Trade Routes',
    emoji: '🛤️',
    description: 'Region reputation gains +30% faster.',
    tree: 'merchant',
    tier: 'expert',
    position: { x: 1, y: 3 },
    unlockMetadata: chapterGated(4),
    dependencies: ['mt_03a', 'mt_03b'],
    cost: 20000,
    pointCost: 3,
    bonuses: [{ type: 'reputation_gain', value: 0.30, application: 'passive' }],
    specialEffect: 'Faster regional progress',
  },

  // TIER 4 - Master
  {
    id: 'mt_05',
    name: 'Merchant Prince',
    emoji: '👑',
    description: 'Unlocks merchant offers 1 chapter early. +10% all sell prices.',
    tree: 'merchant',
    tier: 'master',
    position: { x: 1, y: 4 },
    unlockMetadata: chapterGated(6),
    dependencies: ['mt_04'],
    cost: 100000,
    pointCost: 4,
    bonuses: [
      { type: 'sell_multiplier', value: 0.10, application: 'on_sell' },
      { type: 'merchant_early_unlock', value: 1, application: 'passive' },
    ],
    specialEffect: 'Ultimate trading power',
  },
];

// ============================================================
// ALCHEMIST TREE (Processing/Crafting Focus)
// ============================================================

const alchemistSkills: ExtendedSkillNode[] = [
  // TIER 1 - Basic
  {
    id: 'al_01',
    name: 'Quick Brew',
    emoji: '🧪',
    description: 'Processing chains complete 15% faster.',
    tree: 'alchemist',
    tier: 'basic',
    position: { x: 1, y: 0 },
    unlockMetadata: chapterGated(2),
    dependencies: [],
    cost: 1000,
    pointCost: 1,
    bonuses: [{ type: 'processing_speed', value: 0.15, application: 'passive' }],
  },
  {
    id: 'al_02',
    name: 'Value Extract',
    emoji: '💎',
    description: 'Processed goods sell for 20% more.',
    tree: 'alchemist',
    tier: 'basic',
    position: { x: 1, y: 1 },
    unlockMetadata: chapterGated(2),
    dependencies: ['al_01'],
    cost: 3000,
    pointCost: 1,
    bonuses: [{ type: 'processed_sell_bonus', value: 0.20, application: 'on_sell' }],
  },

  // TIER 2 - Advanced (BRANCHING CHOICE)
  {
    id: 'al_03a',
    name: 'Mass Production',
    emoji: '🏭',
    description: '+30% processing speed, but -10% output quality.',
    tree: 'alchemist',
    tier: 'advanced',
    position: { x: 0, y: 2 },
    unlockMetadata: chapterGated(3),
    dependencies: ['al_02'],
    exclusiveWith: ['al_03b'],
    cost: 8000,
    pointCost: 2,
    bonuses: [
      { type: 'processing_speed', value: 0.30, application: 'passive' },
      { type: 'processed_sell_bonus', value: -0.10, application: 'on_sell' },
    ],
    specialEffect: 'Quantity over quality',
  },
  {
    id: 'al_03b',
    name: 'Artisan Craft',
    emoji: '✨',
    description: '+30% processed goods value, but -10% processing speed.',
    tree: 'alchemist',
    tier: 'advanced',
    position: { x: 2, y: 2 },
    unlockMetadata: chapterGated(3),
    dependencies: ['al_02'],
    exclusiveWith: ['al_03a'],
    cost: 8000,
    pointCost: 2,
    bonuses: [
      { type: 'processed_sell_bonus', value: 0.30, application: 'on_sell' },
      { type: 'processing_speed', value: -0.10, application: 'passive' },
    ],
    specialEffect: 'Quality over quantity',
  },

  // TIER 3 - Expert
  {
    id: 'al_04',
    name: 'Recipe Mastery',
    emoji: '📜',
    description: 'All recipes cost 20% less ingredients.',
    tree: 'alchemist',
    tier: 'expert',
    position: { x: 1, y: 3 },
    unlockMetadata: chapterGated(5),
    dependencies: ['al_03a', 'al_03b'],
    cost: 25000,
    pointCost: 3,
    bonuses: [{ type: 'recipe_cost', value: -0.20, application: 'on_craft' }],
    specialEffect: 'Efficient crafting',
  },

  // TIER 4 - Master
  {
    id: 'al_05',
    name: 'Philosopher\'s Touch',
    emoji: '⚗️',
    description: '10% chance to create bonus output when crafting.',
    tree: 'alchemist',
    tier: 'master',
    position: { x: 1, y: 4 },
    unlockMetadata: chapterGated(6),
    dependencies: ['al_04'],
    cost: 80000,
    pointCost: 4,
    bonuses: [{ type: 'craft_bonus_chance', value: 0.10, application: 'on_craft' }],
    specialEffect: 'Ultimate crafting mastery',
  },
];

// ============================================================
// PIONEER TREE (Region Expansion Focus)
// ============================================================

const pioneerSkills: ExtendedSkillNode[] = [
  // TIER 1 - Basic
  {
    id: 'pi_01',
    name: 'Explorer\'s Spirit',
    emoji: '🧭',
    description: 'Region unlock costs reduced by 15%.',
    tree: 'pioneer',
    tier: 'basic',
    position: { x: 1, y: 0 },
    unlockMetadata: chapterGated(2),
    dependencies: [],
    cost: 1500,
    pointCost: 1,
    bonuses: [{ type: 'region_unlock_cost', value: -0.15, application: 'passive' }],
  },
  {
    id: 'pi_02',
    name: 'Regional Expert',
    emoji: '🗺️',
    description: '+10% production in all regions.',
    tree: 'pioneer',
    tier: 'basic',
    position: { x: 1, y: 1 },
    unlockMetadata: chapterGated(2),
    dependencies: ['pi_01'],
    cost: 4000,
    pointCost: 1,
    bonuses: [{ type: 'region_multiplier', value: 0.10, application: 'passive' }],
  },

  // TIER 2 - Advanced (BRANCHING CHOICE)
  {
    id: 'pi_03a',
    name: 'Settler\'s Focus',
    emoji: '🏠',
    description: '+25% production in your highest region. Focus on one region.',
    tree: 'pioneer',
    tier: 'advanced',
    position: { x: 0, y: 2 },
    unlockMetadata: chapterGated(3),
    dependencies: ['pi_02'],
    exclusiveWith: ['pi_03b'],
    cost: 10000,
    pointCost: 2,
    bonuses: [{ type: 'top_region_bonus', value: 0.25, application: 'passive' }],
    specialEffect: 'Specialization bonus',
  },
  {
    id: 'pi_03b',
    name: 'Nomad\'s Way',
    emoji: '🐪',
    description: 'Switching regions is instant. +5% bonus for each unlocked region.',
    tree: 'pioneer',
    tier: 'advanced',
    position: { x: 2, y: 2 },
    unlockMetadata: chapterGated(3),
    dependencies: ['pi_02'],
    exclusiveWith: ['pi_03a'],
    cost: 10000,
    pointCost: 2,
    bonuses: [
      { type: 'region_switch_instant', value: 1, application: 'passive' },
      { type: 'region_count_bonus', value: 0.05, application: 'passive' },
    ],
    specialEffect: 'Diversification bonus',
  },

  // TIER 3 - Expert
  {
    id: 'pi_04',
    name: 'Weather Hardened',
    emoji: '🌦️',
    description: 'Reduce negative weather effects by 40%.',
    tree: 'pioneer',
    tier: 'expert',
    position: { x: 1, y: 3 },
    unlockMetadata: chapterGated(5),
    dependencies: ['pi_03a', 'pi_03b'],
    cost: 30000,
    pointCost: 3,
    bonuses: [{ type: 'weather_resistance', value: 0.40, application: 'passive' }],
    specialEffect: 'Weather immunity',
  },

  // TIER 4 - Master
  {
    id: 'pi_05',
    name: 'World Champion',
    emoji: '🌍',
    description: '+5% to ALL bonuses for each region at max reputation.',
    tree: 'pioneer',
    tier: 'master',
    position: { x: 1, y: 4 },
    unlockMetadata: chapterGated(7),
    dependencies: ['pi_04'],
    cost: 150000,
    pointCost: 4,
    bonuses: [{ type: 'max_rep_region_bonus', value: 0.05, application: 'passive' }],
    specialEffect: 'Ultimate exploration mastery',
  },
];

// ============================================================
// COMBINED SKILL DATA
// ============================================================

/**
 * All extended skill nodes.
 */
export const EXTENDED_SKILL_TREE: ExtendedSkillNode[] = [
  ...greenThumbSkills,
  ...automatonSkills,
  ...merchantSkills,
  ...alchemistSkills,
  ...pioneerSkills,
].map((skill) => {
  const tokenByTier: Record<SkillTier, string | undefined> = {
    basic: 'meadow_token',
    advanced: 'riverlands_token',
    expert: 'highlands_token',
    master: 'desert_token',
  };
  return {
    ...skill,
    chapterTokenRequired: skill.chapterTokenRequired ?? tokenByTier[skill.tier],
  };
});

/**
 * Legacy SKILL_TREE for backwards compatibility.
 * Maps extended skills to the old format.
 */
export const SKILL_TREE: SkillNode[] = EXTENDED_SKILL_TREE.map((skill) => ({
  id: skill.id,
  name: skill.name,
  description: skill.description,
  cost: skill.cost,
  dependencies: skill.dependencies,
  tree: skill.tree === 'green_thumb' ? 'farming' :
        skill.tree === 'automaton' ? 'automation' : 'economy',
  bonus: skill.bonuses[0] ? {
    type: skill.bonuses[0].type,
    value: skill.bonuses[0].value,
  } : { type: 'none', value: 0 },
}));

/**
 * Get skill by ID.
 */
export function getSkill(id: string): ExtendedSkillNode | undefined {
  return EXTENDED_SKILL_TREE.find((s) => s.id === id);
}

/**
 * Get skills by tree.
 */
export function getSkillsByTree(tree: SkillTree): ExtendedSkillNode[] {
  return EXTENDED_SKILL_TREE.filter((s) => s.tree === tree);
}

/**
 * Check if a skill can be purchased given current unlocked skills.
 */
export function canPurchaseSkill(
  skillId: string,
  unlockedSkills: string[]
): { canPurchase: boolean; reason?: string } {
  const skill = getSkill(skillId);
  if (!skill) return { canPurchase: false, reason: 'Skill not found' };

  // Already owned
  if (unlockedSkills.includes(skillId)) {
    return { canPurchase: false, reason: 'Already unlocked' };
  }

  // Check dependencies (OR logic - need at least one if multiple)
  if (skill.dependencies.length > 0) {
    const hasAnyDep = skill.dependencies.some((dep) => unlockedSkills.includes(dep));
    if (!hasAnyDep) {
      return { canPurchase: false, reason: 'Missing prerequisite skill' };
    }
  }

  // Check exclusives
  if (skill.exclusiveWith) {
    const hasExclusive = skill.exclusiveWith.some((ex) => unlockedSkills.includes(ex));
    if (hasExclusive) {
      const blockedBy = skill.exclusiveWith.find((ex) => unlockedSkills.includes(ex));
      const blockingSkill = getSkill(blockedBy!);
      return {
        canPurchase: false,
        reason: `Blocked by ${blockingSkill?.name ?? blockedBy}`,
      };
    }
  }

  return { canPurchase: true };
}

/**
 * Get total bonuses from unlocked skills for a specific type.
 */
export function getTotalSkillBonus(
  unlockedSkills: string[],
  bonusType: string,
  application?: BonusApplication
): number {
  let total = 0;

  for (const skillId of unlockedSkills) {
    const skill = getSkill(skillId);
    if (!skill) continue;

    for (const bonus of skill.bonuses) {
      if (bonus.type === bonusType) {
        if (!application || bonus.application === application) {
          total += bonus.value;
        }
      }
    }
  }

  return total;
}

/**
 * Skill point budget configuration.
 */
export const SKILL_POINT_CONFIG = {
  /** Points earned per chapter completed */
  POINTS_PER_CHAPTER: 3,

  /** Maximum points that can be spent in a single tree */
  MAX_POINTS_PER_TREE: 12,

  /** Total maximum skill points (soft cap) */
  TOTAL_MAX_POINTS: 25,
};
