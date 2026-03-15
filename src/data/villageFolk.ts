import type { UnlockRequirement } from '../types/unlock';

export type VillageRole = 'gardener' | 'engineer' | 'scientist' | 'trader' | 'manager';

export interface TrustUnlock {
  trustThreshold: number;
  unlock: string;
}

export interface PersonalQuest {
  id: string;
  title: string;
  trustReward: number;
  chapterTier: number;
}

export interface VillageWorkerDef {
  worker_id: string;
  name: string;
  role: VillageRole;
  tier: number;
  hireCost: number;
  base_efficiency: number;
  assign_bonus: Record<string, number>;
  trust_unlocks: TrustUnlock[];
  storyQuest: string;
  affinity: {
    crops: string[];
    region: string;
  };
  uniqueAbility: {
    id: string;
    desc: string;
  };
  unlockRequirement: UnlockRequirement;
  repeatable?: boolean;
  personalQuests: PersonalQuest[];
}

export const VILLAGE_FOLK: VillageWorkerDef[] = [
  {
    worker_id: 'wf_lina_01',
    name: 'Lina',
    role: 'gardener',
    tier: 1,
    hireCost: 150,
    base_efficiency: 0.02,
    assign_bonus: { yield: 0.2, speed: 0.1 },
    trust_unlocks: [
      { trustThreshold: 50, unlock: 'lina_recipe_seed_salve' },
      { trustThreshold: 100, unlock: 'lina_signature_module' },
    ],
    storyQuest: 'help_restore_herbs_garden',
    affinity: { crops: ['herb', 'healing'], region: 'meadow' },
    uniqueAbility: {
      id: 'botanical_residue',
      desc: 'Generates residue for advanced recipes.',
    },
    unlockRequirement: { all: [{ type: 'chapter_started', chapter: 1 }] },
    personalQuests: [
      { id: 'lina_q1', title: 'Restore Herb Beds', trustReward: 20, chapterTier: 1 },
      { id: 'lina_q2', title: 'Distill Seed Salve', trustReward: 30, chapterTier: 1 },
      { id: 'lina_q3', title: 'Healer of Riverlands', trustReward: 50, chapterTier: 2 },
    ],
  },
  {
    worker_id: 'wf_rook_01',
    name: 'Rook',
    role: 'engineer',
    tier: 2,
    hireCost: 320,
    base_efficiency: 0.015,
    assign_bonus: { machine_speed: 0.25, maintenance_reduction: 0.1 },
    trust_unlocks: [
      { trustThreshold: 50, unlock: 'rook_precision_joint' },
      { trustThreshold: 100, unlock: 'rook_signature_module' },
    ],
    storyQuest: 'rebuild_river_mill',
    affinity: { crops: ['kale', 'rice'], region: 'riverlands' },
    uniqueAbility: {
      id: 'precision_tuning',
      desc: 'Assigned machines gain reduced wear when overclocked.',
    },
    unlockRequirement: { all: [{ type: 'chapter_completed', chapter: 1 }] },
    personalQuests: [
      { id: 'rook_q1', title: 'Repair the Mill', trustReward: 20, chapterTier: 2 },
      { id: 'rook_q2', title: 'Tune the Processor', trustReward: 30, chapterTier: 2 },
      { id: 'rook_q3', title: 'Calibrate Floodgates', trustReward: 50, chapterTier: 3 },
    ],
  },
  {
    worker_id: 'wf_maru_01',
    name: 'Maru',
    role: 'scientist',
    tier: 3,
    hireCost: 700,
    base_efficiency: 0.02,
    assign_bonus: { yield: 0.1, quality: 0.25 },
    trust_unlocks: [
      { trustThreshold: 50, unlock: 'maru_spore_filter_recipe' },
      { trustThreshold: 100, unlock: 'maru_signature_module' },
    ],
    storyQuest: 'study_swamp_mold',
    affinity: { crops: ['mushroom', 'healing'], region: 'riverlands' },
    uniqueAbility: {
      id: 'spore_analysis',
      desc: 'Increases chance to discover rare processing outcomes.',
    },
    unlockRequirement: { all: [{ type: 'chapter_started', chapter: 3 }] },
    personalQuests: [
      { id: 'maru_q1', title: 'Collect Spore Samples', trustReward: 20, chapterTier: 3 },
      { id: 'maru_q2', title: 'Stabilize Serum', trustReward: 30, chapterTier: 3 },
      { id: 'maru_q3', title: 'Antifungal Breakthrough', trustReward: 50, chapterTier: 4 },
    ],
  },
  {
    worker_id: 'wf_tess_01',
    name: 'Tess',
    role: 'trader',
    tier: 2,
    hireCost: 500,
    base_efficiency: 0.01,
    assign_bonus: { sell_bonus: 0.2, fragment_drop: 0.15 },
    trust_unlocks: [
      { trustThreshold: 50, unlock: 'merchant_fragments_plus' },
      { trustThreshold: 100, unlock: 'tess_signature_contract' },
    ],
    storyQuest: 'open_river_trade_route',
    affinity: { crops: ['rice', 'herb'], region: 'riverlands' },
    uniqueAbility: {
      id: 'market_whispers',
      desc: 'Spawns one extra merchant fragment offer each chapter.',
    },
    unlockRequirement: { all: [{ type: 'chapter_started', chapter: 2 }] },
    personalQuests: [
      { id: 'tess_q1', title: 'Deliver First Caravan', trustReward: 20, chapterTier: 2 },
      { id: 'tess_q2', title: 'Broker Rare Fragment', trustReward: 30, chapterTier: 2 },
      { id: 'tess_q3', title: 'Found Market Ledger', trustReward: 50, chapterTier: 3 },
    ],
  },
  {
    worker_id: 'wf_hired_hand',
    name: 'Hired Hand',
    role: 'manager',
    tier: 1,
    hireCost: 80,
    base_efficiency: 0.01,
    assign_bonus: { speed: 0.05 },
    trust_unlocks: [],
    storyQuest: 'none',
    affinity: { crops: [], region: 'meadow' },
    uniqueAbility: { id: 'none', desc: 'General helper with no signature path.' },
    unlockRequirement: { all: [{ type: 'chapter_started', chapter: 1 }] },
    repeatable: true,
    personalQuests: [],
  },
];

export const getVillageFolkById = (id: string) =>
  VILLAGE_FOLK.find((w) => w.worker_id === id);
