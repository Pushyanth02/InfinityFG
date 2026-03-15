export type RecipeType = 'weapon' | 'module' | 'consumable' | 'product';

export interface RecipeComponent {
  item: string;
  qty: number;
}

export interface RecipeUnlockCondition {
  chapterMin?: number;
  storyQuestId?: string;
  workerId?: string;
  workerTrust?: number;
  requiredSkillId?: string;
}

export interface RecipeDef {
  recipe_id: string;
  name: string;
  type: RecipeType;
  components: RecipeComponent[];
  craftStation: string;
  craftTime_s: number;
  unlockCondition: RecipeUnlockCondition;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  costCoins: number;
  output: {
    item: string;
    uses?: number;
  };
}

export const STORY_RECIPES: RecipeDef[] = [
  {
    recipe_id: 'rec_antifungal_serum',
    name: 'Antifungal Serum',
    type: 'weapon',
    components: [
      { item: 'herb_extract', qty: 50 },
      { item: 'moonwater', qty: 20 },
      { item: 'spore_filter', qty: 10 },
    ],
    craftStation: 'processor_tier3',
    craftTime_s: 600,
    unlockCondition: {
      chapterMin: 3,
      workerId: 'wf_lina_01',
      workerTrust: 50,
      requiredSkillId: 'al_02',
    },
    rarity: 'rare',
    costCoins: 4200,
    output: {
      item: 'weapon_antifungal_01',
      uses: 10,
    },
  },
  {
    recipe_id: 'rec_river_kale_staff',
    name: 'River Kale Staff',
    type: 'weapon',
    components: [
      { item: 'river_kale', qty: 30 },
      { item: 'driftwood_core', qty: 12 },
    ],
    craftStation: 'processor_tier2',
    craftTime_s: 420,
    unlockCondition: {
      chapterMin: 2,
      requiredSkillId: 'at_02',
    },
    rarity: 'uncommon',
    costCoins: 1600,
    output: {
      item: 'weapon_river_kale_staff',
      uses: 8,
    },
  },
  {
    recipe_id: 'rec_overclock_coating',
    name: 'Overclock Coating',
    type: 'module',
    components: [
      { item: 'resin', qty: 24 },
      { item: 'copper_powder', qty: 16 },
    ],
    craftStation: 'processor_tier2',
    craftTime_s: 300,
    unlockCondition: {
      chapterMin: 2,
      requiredSkillId: 'at_03a',
    },
    rarity: 'rare',
    costCoins: 2200,
    output: {
      item: 'module_overclock_coating',
    },
  },
];

export const getRecipeById = (id: string) => STORY_RECIPES.find((r) => r.recipe_id === id);
