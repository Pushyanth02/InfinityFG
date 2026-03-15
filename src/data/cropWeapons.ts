// ============================================================
// COZY GARDEN — ULTIMATE CROP WEAPONS (UCWs)
// One per chapter, purchased/crafted via Story Book → Crop Weapons tab.
// ============================================================

export interface CropWeaponRecipeItem {
  cropId: string;
  cropName: string;
  emoji: string;
  amount: number;
}

export interface CropWeapon {
  id: string;
  name: string;
  emoji: string;
  chapter: number;
  /** Gold coin cost to unlock */
  cost: number;
  /** Crops (by id) needed to craft */
  recipe: CropWeaponRecipeItem[];
  effect: {
    type: 'boss_damage_mult' | 'global_yield_mult' | 'machine_speed_mult' | 'all_mult';
    /** Multiplier value (e.g. 2 = ×2 boss damage) */
    value: number;
    /** Plain-English description shown in UI */
    description: string;
  };
  /** Flavour lore shown on the card */
  lore: string;
  /** Boss ID this weapon was designed to fight */
  targetBossId: string;
}

export const CROP_WEAPONS: CropWeapon[] = [
  {
    id: 'ucw_wheat_flail',
    name: 'Golden Wheat Flail',
    emoji: '🌾',
    chapter: 1,
    cost: 800,
    recipe: [
      { cropId: 'crop_001', cropName: 'Wheat', emoji: '🌾', amount: 50 },
      { cropId: 'crop_004', cropName: 'Carrot', emoji: '🥕', amount: 30 },
    ],
    effect: {
      type: 'boss_damage_mult',
      value: 2,
      description: 'Deals ×2 damage to Crumblewort the Root-Rot on every harvest.',
    },
    lore: 'Woven from the last golden stalks of Grandma\'s meadow, this flail carries the warmth of a hundred summer harvests. Crumblewort cannot stand the smell.',
    targetBossId: 'boss_crumblewort',
  },
  {
    id: 'ucw_kale_staff',
    name: 'River Kale Staff',
    emoji: '🥬',
    chapter: 2,
    cost: 4000,
    recipe: [
      { cropId: 'crop_unl_kale', cropName: 'Kale', emoji: '🥬', amount: 80 },
      { cropId: 'crop_unl_rice', cropName: 'Rice', emoji: '🌾', amount: 60 },
    ],
    effect: {
      type: 'boss_damage_mult',
      value: 2.5,
      description: 'Deals ×2.5 damage to the Swamp Mold and increases your 🌾 crop yield by 10%.',
    },
    lore: 'Riverland elders lashed bundles of kale and dried rice straw into a staff. Its bitter tannins dissolve the mold on contact — and the rice fibres keep it strong in the wet.',
    targetBossId: 'boss_swamp_mold',
  },
  {
    id: 'ucw_potato_mortar',
    name: 'Highland Potato Mortar',
    emoji: '🥔',
    chapter: 3,
    cost: 18000,
    recipe: [
      { cropId: 'crop_003', cropName: 'Potato', emoji: '🥔', amount: 120 },
      { cropId: 'crop_unl_oats', cropName: 'Oats', emoji: '🌾', amount: 100 },
    ],
    effect: {
      type: 'boss_damage_mult',
      value: 3,
      description: 'Fires compressed potato-and-oat rounds at the Frost Mite Queen, dealing ×3 damage per harvest.',
    },
    lore: 'The highland smiths packed dense potato paste into iron tubes. When fired through cold oat husks, the resulting impact shatters frost-mite exoskeletons into dust.',
    targetBossId: 'boss_frost_mite',
  },
  {
    id: 'ucw_pepper_cannon',
    name: 'Desert Pepper Cannon',
    emoji: '🌶️',
    chapter: 4,
    cost: 90000,
    recipe: [
      { cropId: 'crop_unl_pepper', cropName: 'Pepper', emoji: '🌶️', amount: 200 },
      { cropId: 'crop_unl_mango', cropName: 'Mango', emoji: '🥭', amount: 150 },
    ],
    effect: {
      type: 'boss_damage_mult',
      value: 3.5,
      description: 'Fires capsaicin-mango blasts at the Desert Locust, dealing ×3.5 damage. Also boosts all Garden Helpers\' speed by 15%.',
    },
    lore: 'Nomads compressed dried ghost-pepper oil and fermented mango pulp into cartridges. When detonated near the swarm, the capsaicin cloud scatters a billion locusts immediately.',
    targetBossId: 'boss_desert_locust',
  },
  {
    id: 'ucw_cacao_potion',
    name: 'Rainforest Cacao Elixir',
    emoji: '🍫',
    chapter: 5,
    cost: 400000,
    recipe: [
      { cropId: 'crop_unl_cacao', cropName: 'Cacao', emoji: '🍫', amount: 300 },
      { cropId: 'crop_unl_vanilla', cropName: 'Vanilla', emoji: '🌸', amount: 250 },
    ],
    effect: {
      type: 'boss_damage_mult',
      value: 4,
      description: 'Saturates the Vine Strangler with fermented cacao and cured vanilla, dealing ×4 damage. All crops also grow 20% faster globally.',
    },
    lore: 'Rainforest alchemists spent a century perfecting this brew — fermented cacao and cured vanilla combined in precise ratios. One drop dissolves ten metres of vine instantly.',
    targetBossId: 'boss_vine_strangler',
  },
  {
    id: 'ucw_saffron_torch',
    name: 'Volcanic Saffron Torch',
    emoji: '🔥',
    chapter: 6,
    cost: 1800000,
    recipe: [
      { cropId: 'crop_unl_saffron', cropName: 'Saffron', emoji: '🌺', amount: 500 },
      { cropId: 'crop_unl_dragonfruit', cropName: 'Dragon Fruit', emoji: '🍈', amount: 400 },
    ],
    effect: {
      type: 'all_mult',
      value: 5,
      description: 'An all-purpose weapon that deals ×5 boss damage AND permanently multiplies all coin earnings by ×1.5.',
    },
    lore: 'Volcanic artisans crystallised saffron threads into a handle and filled a dragon-fruit casing with pressurised mineral brine. When lit, it burns with a cold blue flame the Ember Blister cannot absorb.',
    targetBossId: 'boss_ember_blister',
  },
  {
    id: 'ucw_starlight_sceptre',
    name: 'Starlight Sceptre',
    emoji: '✨',
    chapter: 7,
    cost: 8000000,
    recipe: [
      { cropId: 'crop_unl_saffron', cropName: 'Saffron', emoji: '🌺', amount: 1000 },
      { cropId: 'crop_unl_dragonfruit', cropName: 'Dragon Fruit', emoji: '🍈', amount: 1000 },
      { cropId: 'crop_unl_vanilla', cropName: 'Vanilla', emoji: '🌸', amount: 1000 },
      { cropId: 'crop_unl_cacao', cropName: 'Cacao', emoji: '🍫', amount: 1000 },
    ],
    effect: {
      type: 'all_mult',
      value: 10,
      description: 'The ultimate weapon. Deals ×10 damage to the Void Blight and doubles ALL game production permanently.',
    },
    lore: 'Formed from the combined light of every crop grown across all seven chapters. The Sceptre does not attack — it simply reminds the Void what growing feels like. The Blight cannot bear it.',
    targetBossId: 'boss_void_blight',
  },
];

/** Helper: get a weapon by ID */
export const getWeapon = (id: string): CropWeapon | undefined =>
  CROP_WEAPONS.find(w => w.id === id);

/** Helper: get the weapon for a chapter number */
export const getWeaponForChapter = (chapter: number): CropWeapon | undefined =>
  CROP_WEAPONS.find(w => w.chapter === chapter);
