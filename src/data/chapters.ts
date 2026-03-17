// ============================================================
// COZY GARDEN — CHAPTERS, QUESTS & BOSS DEFINITIONS
// Each chapter maps to one region and tells one story arc.
// Story Book is the single source of truth for all unlocks.
// ============================================================

import type { UnlockMetadata } from '../types/unlock';
import { ALWAYS_UNLOCKED, chapterGated } from '../types/unlock';
import type {
  BossTemplate,
  ChapterRewards,
  StoryBeat,
  BalanceTargets,
  RegionChapterTemplate,
} from '../types/regionChapter';

export interface ChapterQuest {
  id: string;
  title: string;
  description: string;
  /** progress is tracked against game state in the store */
  objective: {
    type: 'harvest' | 'earn' | 'deploy' | 'hire';
    amount: number;
    /** optional: specific cropId, machineId, workerId to target */
    targetId?: string;
  };
  reward: { coins: number };
}

export interface ChapterBoss {
  id: string;
  name: string;
  emoji: string;
  flavor: string;
  /** Total damage needed to defeat the boss */
  maxHp: number;
  /** Coin-equivalent damage per harvested crop */
  damagePerCrop: number;
  /** These crop IDs deal 3× damage */
  weakCropIds: string[];
  defeatReward: {
    /** Extra coins awarded on defeat */
    coinsBonus: number;
    /** Region that is unlocked after defeat */
    unlocksRegionId: string;
    /** UCW that becomes available */
    unlocksWeaponId: string;
  };
  // ── Phase 3: canonical template fields ───────────────────
  /** Machine-readable mechanic tags driving boss engine behaviour */
  mechanics?: string[];
  /** Recommended total coin budget to craft + equip the UCW */
  recommendedWeaponCost?: number;
}

// ─── Story Book Page Types ────────────────────────────────────────
// The Story Book renders each chapter as a set of typed pages.
// Pages are data-driven: the generic StoryBookPage component renders
// any page based on its pageType field.
export type StoryPageType =
  | 'chapter_intro'       // Chapter overview and synopsis
  | 'exploration_quest'   // Active quest list for this chapter
  | 'merchant_page'       // Narrative market / merchant ledger
  | 'crafting_page'       // Recipe and crafting flow
  | 'worker_story'        // Worker background and personal quests
  | 'boss_prelude'        // Vague boss weakness hints
  | 'boss_page'           // Full boss fight + weapon deploy
  | 'resolution_page'     // Post-defeat celebration page
  | 'festival_page';      // Prestige / Great Harvest festival

export interface StoryPage {
  id: string;
  /** Determines how the page is rendered. */
  pageType: StoryPageType;
  chapterId: string;
  title: string;
  /** Narrative body text (may reference NPC dialogue or lore). */
  body: string;
  /** Emoji art asset reference shown as the page illustration. */
  art?: string;
  /** Worker ID — required for worker_story pages. */
  workerId?: string;
  /** Weapon ID — required for boss_page and crafting_page. */
  weaponId?: string;
  /** Completion reward (coins, items) applied when player marks the page done. */
  onComplete?: { rewards?: { coins?: number } };
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  regionId: string;
  emoji: string;
  /** 2-3 sentence story setup shown at chapter open */
  synopsis: string;
  quests: ChapterQuest[];
  boss: ChapterBoss;
  /** ID of the Ultimate Crop Weapon for this chapter */
  cropWeaponId: string;
  /** Story Book unlock and visibility metadata */
  unlockMetadata: UnlockMetadata;
  /** Story Book encyclopedia/blueprint pages unlocked in this chapter */
  pages: StoryPage[];

  // ── Phase 3: canonical template fields ───────────────────────
  /** Thematic tags for UI theming, asset selection and analytics */
  theme?: string[];
  /** Designer estimate of playtime in hours */
  recommendedPlaytimeHours?: number;
  /** Item IDs immediately available at chapter start */
  initialUnlocks?: string[];
  /** All crop IDs available/unlockable during this chapter */
  crops?: string[];
  /** Machine IDs unlocked during this chapter */
  machinesUnlocked?: string[];
  /** Key Village Folk worker IDs introduced in this chapter */
  workersIntroduced?: string[];
  /** Merchant archetype IDs that visit during this chapter */
  merchantTypes?: string[];
  /** Festival ID triggered on boss defeat */
  festival?: string;
  /** Rewards granted on chapter completion */
  rewards?: ChapterRewards;
  /** Ordered narrative milestones */
  storyBeats?: StoryBeat[];
  /** Balance targets for QA and engine calibration */
  balanceTargets?: BalanceTargets;
}

// ─────────────────────────────────────────────────────────────
const CHAPTER_DEFINITIONS: Omit<Chapter, 'unlockMetadata' | 'pages'>[] = [

  // ── CHAPTER 1 — Meadow Fields ───────────────────────────────
  {
    id: 'ch_01',
    number: 1,
    title: 'The First Planting',
    regionId: 'meadow',
    emoji: '🌾',
    synopsis:
      'Your grandmother left you her old garden plot, a little patch of meadow at the edge of Thistlewick Village. The soil is rich but something is stirring beneath the roots — a creeping rust called Crumblewort is spreading patch by patch. Grow fast, harvest well, and drive it back before the whole meadow turns grey.',
    // ── Phase 3 canonical template fields ────────────────────
    theme: ['meadow', 'sunny', 'fertile'],
    recommendedPlaytimeHours: 3,
    initialUnlocks: ['crop_001', 'crop_004', 'planter_t1', '3_plots'],
    crops: ['crop_001', 'crop_002', 'crop_003', 'crop_004', 'crop_005'],
    machinesUnlocked: ['planter_t1', 'waterer_t1', 'harvester_t1'],
    workersIntroduced: ['wf_lina_01', 'wf_hired_hand'],
    merchantTypes: ['kurei_caravan'],
    festival: 'meadow_festival',
    rewards: { peaceToken: 1, seedPack: 'radish_pack', prestigeFragments: 1 },
    storyBeats: [
      { id: 'ch01_beat_01', description: 'Grandmother\'s letter arrives — the meadow plot is yours.' },
      { id: 'ch01_beat_02', description: 'First harvest reveals grey rot spreading from the east corner.' },
      { id: 'ch01_beat_03', description: 'Lina identifies Crumblewort — wheat and carrot are its weakness.' },
      { id: 'ch01_beat_04', description: 'Craft the Wheat Flail to strike the killing blow.' },
      { id: 'ch01_beat_05', description: 'Crumblewort retreats — the Riverlands map is revealed.' },
    ],
    balanceTargets: { weaponCraftTargetMinutes: 180, bossDefeatTargetMinutes: 210 },
    // ─────────────────────────────────────────────────────────
    quests: [
      {
        id: 'ch01_q1',
        title: 'First Seeds',
        description: 'Plant and harvest your first 10 crops to feel the rhythm of the garden.',
        objective: { type: 'harvest', amount: 10 },
        reward: { coins: 150 },
      },
      {
        id: 'ch01_q2',
        title: 'Pocket Full of Coins',
        description: 'Earn 500 Gold Coins from your harvests.',
        objective: { type: 'earn', amount: 500 },
        reward: { coins: 200 },
      },
      {
        id: 'ch01_q3',
        title: 'Rooty Bot Deployed',
        description: 'Deploy your first Garden Helper to automate planting.',
        objective: { type: 'deploy', amount: 1 },
        reward: { coins: 300 },
      },
    ],
    boss: {
      id: 'boss_crumblewort',
      name: 'Crumblewort the Root-Rot',
      emoji: '🍂',
      flavor:
        'A slow grey creep of fungal rust that rots roots from below. Crumblewort hates the smell of fresh wheat and crunchy carrots — they burn it like sunlight.',
      maxHp: 500,
      damagePerCrop: 1,
      weakCropIds: ['crop_001', 'crop_004'], // Wheat, Carrot
      mechanics: ['spread_patches', 'hardened_cores'],
      recommendedWeaponCost: 650,
      defeatReward: {
        coinsBonus: 1000,
        unlocksRegionId: 'riverlands',
        unlocksWeaponId: 'ucw_wheat_flail',
      },
    },
    cropWeaponId: 'ucw_wheat_flail',
  },

  // ── CHAPTER 2 — Riverlands ───────────────────────────────────
  {
    id: 'ch_02',
    number: 2,
    title: 'The River Awakens',
    regionId: 'riverlands',
    emoji: '🏞️',
    synopsis:
      'The great river has flooded its banks for the third spring in a row, and a slimy green mold called the Swamp Mold has taken root in the waterlogged fields. The riverside villagers are counting on you. Rice paddies and kale beds are the mold\'s only natural enemy — grow them in abundance.',
    // ── Phase 3 canonical template fields ────────────────────
    theme: ['riverlands', 'floods', 'waterlogged'],
    recommendedPlaytimeHours: 5,
    initialUnlocks: ['crop_unl_rice', 'crop_unl_kale', 'planter_t2'],
    crops: ['crop_unl_rice', 'crop_unl_kale', 'crop_006', 'crop_007', 'crop_008'],
    machinesUnlocked: ['planter_t2', 'waterer_t2', 'harvester_t2'],
    workersIntroduced: ['wf_rook_01', 'wf_tess_01'],
    merchantTypes: ['river_trading_post'],
    festival: 'riverlands_festival',
    rewards: { peaceToken: 1, seedPack: 'lotus_pack', prestigeFragments: 1 },
    storyBeats: [
      { id: 'ch02_beat_01', description: 'The river breaks its banks — fields are flooded.' },
      { id: 'ch02_beat_02', description: 'Rook spots the Swamp Mold spreading through the paddies.' },
      { id: 'ch02_beat_03', description: 'Rice and kale plantings begin to push back the mold.' },
      { id: 'ch02_beat_04', description: 'Kale Staff crafted from the river reeds.' },
      { id: 'ch02_beat_05', description: 'Mold dissolves — the highland passes open for the first time.' },
    ],
    balanceTargets: { weaponCraftTargetMinutes: 240, bossDefeatTargetMinutes: 280 },
    // ─────────────────────────────────────────────────────────
    quests: [
      {
        id: 'ch02_q1',
        title: 'Water the Fields',
        description: 'Harvest 30 crops from the riverlands.',
        objective: { type: 'harvest', amount: 30 },
        reward: { coins: 500 },
      },
      {
        id: 'ch02_q2',
        title: 'Invite a Farmhand',
        description: 'Hire your first Village Folk to help with the flood recovery.',
        objective: { type: 'hire', amount: 1 },
        reward: { coins: 400 },
      },
      {
        id: 'ch02_q3',
        title: 'River Fortune',
        description: 'Earn 3,000 Gold Coins total.',
        objective: { type: 'earn', amount: 3000 },
        reward: { coins: 800 },
      },
    ],
    boss: {
      id: 'boss_swamp_mold',
      name: 'The Swamp Mold',
      emoji: '🌊',
      flavor:
        'A bloated, algae-coloured mass that thrives in standing water. It consumes root vegetables but recoils at the tannins in rice straw and the bitterness of fresh kale.',
      maxHp: 2000,
      damagePerCrop: 2,
      weakCropIds: ['crop_unl_rice', 'crop_unl_kale'],
      mechanics: ['bloating_surge', 'root_drain'],
      recommendedWeaponCost: 1800,
      defeatReward: {
        coinsBonus: 5000,
        unlocksRegionId: 'highlands',
        unlocksWeaponId: 'ucw_kale_staff',
      },
    },
    cropWeaponId: 'ucw_kale_staff',
  },

  // ── CHAPTER 3 — Highlands ────────────────────────────────────
  {
    id: 'ch_03',
    number: 3,
    title: 'Peaks of the Highlands',
    regionId: 'highlands',
    emoji: '⛰️',
    synopsis:
      'The mountain passes have been closed for a season — the Frost Mite Queen has colonised the highland terraces. Her brood chew through potato beds and strip oat stalks overnight. The highland elders say a heavy harvest of hardy roots and grains can overwhelm the swarm by sheer abundance.',
    // ── Phase 3 canonical template fields ────────────────────
    theme: ['highlands', 'frost', 'mountain'],
    recommendedPlaytimeHours: 8,
    initialUnlocks: ['crop_unl_oats', 'crop_009', 'processor_t2'],
    crops: ['crop_unl_oats', 'crop_009', 'crop_010', 'crop_011', 'crop_012'],
    machinesUnlocked: ['processor_t2', 'drone_t3'],
    workersIntroduced: ['wf_maru_01'],
    merchantTypes: ['highland_market_fair'],
    festival: 'highlands_festival',
    rewards: { peaceToken: 1, seedPack: 'oat_pack', prestigeFragments: 1 },
    storyBeats: [
      { id: 'ch03_beat_01', description: 'A blizzard traps the highland caravans — Maru arrives with research notes.' },
      { id: 'ch03_beat_02', description: 'Frost Mite Queen spotted laying eggs in the potato fields.' },
      { id: 'ch03_beat_03', description: 'Maru discovers oat extract disrupts the mite\'s harden cycle.' },
      { id: 'ch03_beat_04', description: 'Potato Mortar forged with highland granite and oat binding.' },
      { id: 'ch03_beat_05', description: 'Mite Queen shattered — desert compass recovered from the ruins.' },
    ],
    balanceTargets: { weaponCraftTargetMinutes: 300, bossDefeatTargetMinutes: 360 },
    // ─────────────────────────────────────────────────────────
    quests: [
      {
        id: 'ch03_q1',
        title: 'Highland Harvest',
        description: 'Harvest 75 crops from the highlands.',
        objective: { type: 'harvest', amount: 75 },
        reward: { coins: 1500 },
      },
      {
        id: 'ch03_q2',
        title: 'Machine Crew',
        description: 'Deploy 3 Garden Helpers in total.',
        objective: { type: 'deploy', amount: 3 },
        reward: { coins: 2000 },
      },
      {
        id: 'ch03_q3',
        title: 'Mountain Treasury',
        description: 'Earn 15,000 Gold Coins total.',
        objective: { type: 'earn', amount: 15000 },
        reward: { coins: 3000 },
      },
    ],
    boss: {
      id: 'boss_frost_mite',
      name: 'Frost Mite Queen',
      emoji: '❄️',
      flavor:
        'A crystalline insect queen the size of a barn cat, encrusted with ice. She commands thousands of mites that feed on crops. Potatoes and oats produce compounds she cannot digest — they shatter her exoskeleton.',
      maxHp: 8000,
      damagePerCrop: 3,
      weakCropIds: ['crop_003', 'crop_unl_oats'], // Potato, Oats
      mechanics: ['frost_spores', 'mite_swarm', 'core_harden'],
      recommendedWeaponCost: 3600,
      defeatReward: {
        coinsBonus: 20000,
        unlocksRegionId: 'desert',
        unlocksWeaponId: 'ucw_potato_mortar',
      },
    },
    cropWeaponId: 'ucw_potato_mortar',
  },

  // ── CHAPTER 4 — Desert Oasis ─────────────────────────────────
  {
    id: 'ch_04',
    number: 4,
    title: 'Sands of the Oasis',
    regionId: 'desert',
    emoji: '🏜️',
    synopsis:
      'Beyond the dry dunes lies a hidden oasis, but the Desert Locust has formed a massive cloud that blocks the sun and devours fields in minutes. Ancient nomads knew that spicy peppers and ripe mangoes repel the swarm — their oils coat the locust\'s wings and ground it immediately.',
    // ── Phase 3 canonical template fields ────────────────────
    theme: ['desert', 'arid', 'spice'],
    recommendedPlaytimeHours: 10,
    initialUnlocks: ['crop_unl_pepper', 'crop_unl_mango', 'planter_t3'],
    crops: ['crop_unl_pepper', 'crop_unl_mango', 'crop_013', 'crop_014', 'crop_015'],
    machinesUnlocked: ['planter_t3', 'waterer_t3', 'harvester_t3'],
    workersIntroduced: ['worker_013', 'worker_014'],
    merchantTypes: ['desert_spice_exchange'],
    festival: 'desert_festival',
    rewards: { peaceToken: 2, seedPack: 'spice_pack', prestigeFragments: 1 },
    storyBeats: [
      { id: 'ch04_beat_01', description: 'A locust scout cloud darkens the horizon — nomads warn of the swarm.' },
      { id: 'ch04_beat_02', description: 'Oasis water sources threatened; pepper and mango plots emergency-planted.' },
      { id: 'ch04_beat_03', description: 'First pepper harvest drives a scouting wave back — proof of concept.' },
      { id: 'ch04_beat_04', description: 'Pepper Cannon assembled from oasis ironwood and chilli extract.' },
      { id: 'ch04_beat_05', description: 'Locust cloud breaks apart — the rainforest canopy path opens.' },
    ],
    balanceTargets: { weaponCraftTargetMinutes: 360, bossDefeatTargetMinutes: 420 },
    // ─────────────────────────────────────────────────────────
    quests: [
      {
        id: 'ch04_q1',
        title: 'Desert Survival',
        description: 'Harvest 150 crops from the desert oasis.',
        objective: { type: 'harvest', amount: 150 },
        reward: { coins: 5000 },
      },
      {
        id: 'ch04_q2',
        title: 'Desert Caravan',
        description: 'Hire 3 Village Folk to form your desert crew.',
        objective: { type: 'hire', amount: 3 },
        reward: { coins: 4000 },
      },
      {
        id: 'ch04_q3',
        title: 'Oasis Wealth',
        description: 'Earn 100,000 Gold Coins total.',
        objective: { type: 'earn', amount: 100000 },
        reward: { coins: 10000 },
      },
    ],
    boss: {
      id: 'boss_desert_locust',
      name: 'The Desert Locust',
      emoji: '🦗',
      flavor:
        'A roiling black cloud of a billion locusts that moves like a living storm. The swarm is confused by the heat capsaicin in peppers and the fermentation acids in ripe mangoes — both cause the swarm to scatter.',
      maxHp: 30000,
      damagePerCrop: 5,
      weakCropIds: ['crop_unl_pepper', 'crop_unl_mango'],
      mechanics: ['swarm_scatter', 'locust_wave', 'acid_resist'],
      recommendedWeaponCost: 4200,
      defeatReward: {
        coinsBonus: 80000,
        unlocksRegionId: 'rainforest',
        unlocksWeaponId: 'ucw_pepper_cannon',
      },
    },
    cropWeaponId: 'ucw_pepper_cannon',
  },

  // ── CHAPTER 5 — Rainforest Canopy ───────────────────────────
  {
    id: 'ch_05',
    number: 5,
    title: 'The Rainforest Depths',
    regionId: 'rainforest',
    emoji: '🌿',
    synopsis:
      'Deep in the canopy, an ancient parasite called the Vine Strangler is choking the exotic botanical farms. It has wound itself around the cacao trees and vanilla orchids, the most precious plants in the entire rainforest. Only by cultivating abundant yields of these very plants can you overwhelm the parasite\'s need to spread.',
    // ── Phase 3 canonical template fields ────────────────────
    theme: ['rainforest', 'canopy', 'fermentation'],
    recommendedPlaytimeHours: 14,
    initialUnlocks: ['crop_unl_cacao', 'crop_unl_vanilla', 'processor_t3'],
    crops: ['crop_unl_cacao', 'crop_unl_vanilla', 'crop_016', 'crop_017', 'crop_018'],
    machinesUnlocked: ['processor_t3', 'drone_t4'],
    workersIntroduced: ['worker_017', 'worker_018'],
    merchantTypes: ['canopy_fermentation_market'],
    festival: 'rainforest_festival',
    rewards: { peaceToken: 2, seedPack: 'cacao_pack', prestigeFragments: 2 },
    storyBeats: [
      { id: 'ch05_beat_01', description: 'Ancient cacao trees begin to wilt — the Vine Strangler is first sighted.' },
      { id: 'ch05_beat_02', description: 'Canopy villages cut off as vine tendrils block the upper paths.' },
      { id: 'ch05_beat_03', description: 'Fermented cacao batch dissolves a test patch of Strangler vine.' },
      { id: 'ch05_beat_04', description: 'Cacao Potion brewed using cured vanilla and fermented cacao.' },
      { id: 'ch05_beat_05', description: 'Vine Strangler dissolved — the volcanic plains glow on the horizon.' },
    ],
    balanceTargets: { weaponCraftTargetMinutes: 480, bossDefeatTargetMinutes: 540 },
    // ─────────────────────────────────────────────────────────
    quests: [
      {
        id: 'ch05_q1',
        title: 'Canopy Harvest',
        description: 'Harvest 300 crops from the rainforest canopy.',
        objective: { type: 'harvest', amount: 300 },
        reward: { coins: 20000 },
      },
      {
        id: 'ch05_q2',
        title: 'Automation Army',
        description: 'Deploy 8 Garden Helpers in total.',
        objective: { type: 'deploy', amount: 8 },
        reward: { coins: 30000 },
      },
      {
        id: 'ch05_q3',
        title: 'Rainforest Riches',
        description: 'Earn 500,000 Gold Coins total.',
        objective: { type: 'earn', amount: 500000 },
        reward: { coins: 50000 },
      },
    ],
    boss: {
      id: 'boss_vine_strangler',
      name: 'The Vine Strangler',
      emoji: '🌱',
      flavor:
        'A vast network of dark vines that has taken on a collective intelligence over centuries. It fears fermentation — when cacao ferments and vanilla cures, the resulting chemical compounds dissolve its tendrils on contact.',
      maxHp: 120000,
      damagePerCrop: 10,
      weakCropIds: ['crop_unl_cacao', 'crop_unl_vanilla'],
      mechanics: ['vine_wrap', 'canopy_growth', 'ferment_resist'],
      recommendedWeaponCost: 9800,
      defeatReward: {
        coinsBonus: 300000,
        unlocksRegionId: 'volcanic',
        unlocksWeaponId: 'ucw_cacao_potion',
      },
    },
    cropWeaponId: 'ucw_cacao_potion',
  },

  // ── CHAPTER 6 — Volcanic Plains ─────────────────────────────
  {
    id: 'ch_06',
    number: 6,
    title: 'Into the Volcanic Plains',
    regionId: 'volcanic',
    emoji: '🌋',
    synopsis:
      'The mineral-rich volcanic soil produces legendary crops, but the Ember Blister Fungus has emerged from a newly opened vent. It thrives on heat and chokes the air with spores. Only crops with deep root networks and extreme heat-tolerance — saffron and dragon fruit — can absorb enough mineral steam to neutralise it.',
    // ── Phase 3 canonical template fields ────────────────────
    theme: ['volcanic', 'fire', 'rare_spice'],
    recommendedPlaytimeHours: 18,
    initialUnlocks: ['crop_unl_saffron', 'crop_unl_dragonfruit', 'planter_t4'],
    crops: ['crop_unl_saffron', 'crop_unl_dragonfruit', 'crop_019', 'crop_020'],
    machinesUnlocked: ['planter_t4', 'waterer_t4', 'harvester_t4'],
    workersIntroduced: ['worker_021', 'worker_022'],
    merchantTypes: ['volcanic_rare_goods_bazaar'],
    festival: 'volcanic_festival',
    rewards: { peaceToken: 2, seedPack: 'saffron_pack', prestigeFragments: 2 },
    storyBeats: [
      { id: 'ch06_beat_01', description: 'A new vent opens — ember spores blanket the volcanic terraces.' },
      { id: 'ch06_beat_02', description: 'First saffron plot survives the heat — spore density near it drops.' },
      { id: 'ch06_beat_03', description: 'Dragon fruit hydrating gel tested against the blister colonies.' },
      { id: 'ch06_beat_04', description: 'Saffron Torch forged from compressed saffron and volcanic iron.' },
      { id: 'ch06_beat_05', description: 'Ember Blister extinguished — the Celestial Farm path revealed.' },
    ],
    balanceTargets: { weaponCraftTargetMinutes: 600, bossDefeatTargetMinutes: 720 },
    // ─────────────────────────────────────────────────────────
    quests: [
      {
        id: 'ch06_q1',
        title: 'Volcanic Harvest',
        description: 'Harvest 500 crops from the volcanic plains.',
        objective: { type: 'harvest', amount: 500 },
        reward: { coins: 100000 },
      },
      {
        id: 'ch06_q2',
        title: 'Village of Experts',
        description: 'Hire 8 Village Folk in total.',
        objective: { type: 'hire', amount: 8 },
        reward: { coins: 80000 },
      },
      {
        id: 'ch06_q3',
        title: 'Volcanic Fortune',
        description: 'Earn 2,000,000 Gold Coins total.',
        objective: { type: 'earn', amount: 2000000 },
        reward: { coins: 200000 },
      },
    ],
    boss: {
      id: 'boss_ember_blister',
      name: 'Ember Blister Fungus',
      emoji: '🍄',
      flavor:
        'A shimmering orange fungal crown the size of a barn that pulses with geothermal heat. Its spores are as hot as embers. Saffron\'s anti-inflammatory compounds and the hydrating gel of dragon fruit extinguish the blister colonies.',
      maxHp: 500000,
      damagePerCrop: 25,
      weakCropIds: ['crop_unl_saffron', 'crop_unl_dragonfruit'],
      mechanics: ['ember_burst', 'spore_cloud', 'fire_shell'],
      recommendedWeaponCost: 22000,
      defeatReward: {
        coinsBonus: 1000000,
        unlocksRegionId: 'celestial',
        unlocksWeaponId: 'ucw_saffron_torch',
      },
    },
    cropWeaponId: 'ucw_saffron_torch',
  },

  // ── CHAPTER 7 — Celestial Farm ───────────────────────────────
  {
    id: 'ch_07',
    number: 7,
    title: 'The Great Harvest',
    regionId: 'celestial',
    emoji: '🌟',
    synopsis:
      'Beyond the known world floats the Celestial Farm — a mythic garden where legendary crops grow under starlight. But the Void Blight has arrived: a darkness that drains growth and colour from everything it touches. Only a full-spectrum harvest of legendary crops wielded through the Starlight Sceptre can seal the Blight away forever.',
    // ── Phase 3 canonical template fields ────────────────────
    theme: ['celestial', 'legendary', 'void'],
    recommendedPlaytimeHours: 24,
    initialUnlocks: ['crop_legendary_01', 'crop_legendary_02', 'crop_legendary_03'],
    crops: ['crop_legendary_01', 'crop_legendary_02', 'crop_legendary_03'],
    machinesUnlocked: ['planter_t5', 'waterer_t5', 'harvester_t5', 'processor_t5', 'drone_t5'],
    workersIntroduced: ['worker_025', 'worker_026'],
    merchantTypes: ['celestial_exchange'],
    festival: 'great_harvest_festival',
    rewards: { peaceToken: 5, seedPack: 'legendary_pack', prestigeFragments: 5 },
    storyBeats: [
      { id: 'ch07_beat_01', description: 'The Celestial Farm materialises — legendary crops sprout at first light.' },
      { id: 'ch07_beat_02', description: 'The Void Blight seeps in; darkness drains colour from the outer plots.' },
      { id: 'ch07_beat_03', description: 'Legendary crop energy begins to push the Blight back.' },
      { id: 'ch07_beat_04', description: 'Starlight Sceptre assembled from concentrated legendary crop light.' },
      { id: 'ch07_beat_05', description: 'Void Blight sealed — the Great Harvest Prestige event unlocks.' },
    ],
    balanceTargets: { weaponCraftTargetMinutes: 1080, bossDefeatTargetMinutes: 1200 },
    // ─────────────────────────────────────────────────────────
    quests: [
      {
        id: 'ch07_q1',
        title: 'Celestial Harvest',
        description: 'Harvest 1,000 crops from the celestial farm.',
        objective: { type: 'harvest', amount: 1000 },
        reward: { coins: 500000 },
      },
      {
        id: 'ch07_q2',
        title: 'The Full Crew',
        description: 'Deploy 15 Garden Helpers in total.',
        objective: { type: 'deploy', amount: 15 },
        reward: { coins: 400000 },
      },
      {
        id: 'ch07_q3',
        title: 'Celestial Wealth',
        description: 'Earn 10,000,000 Gold Coins total.',
        objective: { type: 'earn', amount: 10000000 },
        reward: { coins: 1000000 },
      },
    ],
    boss: {
      id: 'boss_void_blight',
      name: 'The Void Blight',
      emoji: '🌑',
      flavor:
        'An ancient darkness that predates the first seed. It has no physical form — only an absence of growth. Legendary crops carrying the light of the sun, the rain, and the earth are the only things that can fill the void and seal it shut.',
      maxHp: 2000000,
      damagePerCrop: 50,
      weakCropIds: [], // All crops work equally — no specific weakness
      mechanics: ['void_spread', 'light_absorption', 'legendary_weakness'],
      recommendedWeaponCost: 120000,
      defeatReward: {
        coinsBonus: 5000000,
        unlocksRegionId: '',
        unlocksWeaponId: 'ucw_starlight_sceptre',
      },
    },
    cropWeaponId: 'ucw_starlight_sceptre',
  },
];

// ─── Per-chapter extra page definitions ──────────────────────────
// Merchant pages, worker stories and resolution text are chapter-specific.
// Keys match chapter.id.
const CHAPTER_MERCHANT_PAGES: Record<string, { title: string; body: string; art: string }> = {
  ch_01: {
    title: 'Kurei the Caravan — Meadow Visit',
    art: '🛒',
    body: 'Kurei has rolled his creaking wagon into Meadow Fields. He needs fresh wheat, crisp carrots and anything you can spare. "Fair weather means fair coin," he says — prices are up 24% until the rains return. Fulfil a Village Care Package and he\'ll pay double.',
  },
  ch_02: {
    title: 'Riverside Trading Post',
    art: '⚓',
    body: 'The flood has opened a new river trade route. Tess has arranged a deal with the city merchants — they\'ll take all the rice and kale you can grow. Fill a Caravan order to unlock the River Fortune bonus.',
  },
  ch_03: {
    title: 'Highland Market Fair',
    art: '🏔️',
    body: 'The mountain folk hold a seasonal fair. Potato bread and oat porridge are selling out by noon. Deliver a Highland Care Package to earn the Market Fair commendation and a Prestige fragment.',
  },
  ch_04: {
    title: 'Desert Spice Exchange',
    art: '🌶️',
    body: 'The Oasis nomads value pepper and mango above all else. "Spice keeps the locust cloud away," says the elder merchant. Fill a Spice Caravan to receive double-coin for your next pepper harvest.',
  },
  ch_05: {
    title: 'Canopy Fermentation Market',
    art: '🍫',
    body: 'The cacao and vanilla markets are at peak demand — city chocolatiers are paying a premium this season. A single Rainforest Crate earns three times the base price. Act before the season turns.',
  },
  ch_06: {
    title: 'Volcanic Rare Goods Bazaar',
    art: '🌋',
    body: 'The volcanic bazaar opens only when the crater is dormant. Saffron and dragon fruit are the rarest goods on the market — Kurei will pay five times base value this cycle. There is a limited window.',
  },
  ch_07: {
    title: 'Celestial Exchange',
    art: '✨',
    body: 'The last merchant stands at the edge of the known world. She trades only in legendary crops and Prestige Tokens. Fulfil the final Celestial Order to unlock the ultimate Crop Weapon.',
  },
};

const CHAPTER_WORKER_PAGES: Record<string, { workerId: string; title: string; body: string; art: string }[]> = {
  ch_01: [
    {
      workerId: 'wf_lina_01',
      title: 'Lina — The Herb Healer',
      art: '🌿',
      body: 'Lina grew up in Meadow Fields tending the healing herb beds her grandmother planted. She still knows every plant by name and can distil rare medicinal salves that boost crop growth speed. Hire her and she will restore the derelict herb garden near Plot 4 — completing her first personal quest unlocks the Seed Salve recipe.',
    },
    {
      workerId: 'wf_hired_hand',
      title: 'Hired Hand — Field Worker',
      art: '👷',
      body: 'A willing pair of hands ready to help wherever needed. No signature skill, no dramatic backstory — just honest work and a warm smile. Hire multiple Hired Hands to keep every plot running at full speed without burning through skilled staff.',
    },
  ],
  ch_02: [
    {
      workerId: 'wf_rook_01',
      title: 'Rook — The River Engineer',
      art: '⚙️',
      body: 'Rook came to the Riverlands to rebuild the old watermill and never left. He understands machines the way most people understand breathing. Assign him to any Garden Helper and it gains 25% speed and reduced wear. His first personal quest — rebuilding the River Mill — unlocks the Precision Joint module.',
    },
    {
      workerId: 'wf_tess_01',
      title: 'Tess — The River Trader',
      art: '💼',
      body: 'Tess has bartered her way across every river town in the region. She always seems to know when a merchant is about to overpay and positions herself perfectly. Hire her and she generates one extra merchant fragment offer each chapter — invaluable for players who want to maximise market earnings.',
    },
  ],
  ch_03: [
    {
      workerId: 'wf_maru_01',
      title: 'Maru — The Highland Scientist',
      art: '🔬',
      body: 'Maru arrived at the Highlands clutching notebooks full of fungal research. She has been studying the Frost Mite Queen\'s spore patterns for two seasons. Assign her to a processor and you gain a 25% chance to discover rare processing outcomes. Her personal quest chain unlocks the Spore Filter recipe and eventually an antifungal breakthrough.',
    },
  ],
};

const CHAPTER_RESOLUTION_PAGES: Record<string, { title: string; body: string; art: string }> = {
  ch_01: {
    title: 'The Meadow Healed',
    art: '🌸',
    body: 'Crumblewort has retreated into the deep soil, its grey rot driven back by the abundance of your harvest. Thistlewick Village erupts in celebration. The elders present you with the Wheat Flail and a sealed map — the Riverlands lie to the east, waiting to be discovered.',
  },
  ch_02: {
    title: 'The River Runs Clear',
    art: '🌊',
    body: 'The Swamp Mold has dissolved back into the flood mud. The river runs clear for the first time in three springs. Riverside villagers are rebuilding their farms and the Highland passes are opening. You have earned the Kale Staff and the gratitude of every fisherman on the river.',
  },
  ch_03: {
    title: 'The Mountain Pass Opens',
    art: '⛰️',
    body: 'The Frost Mite Queen has been shattered by a concentrated burst of potato and oat energy. The highland passes are clear and the caravans are rolling again. You receive the Potato Mortar and a desert compass — the dunes are calling.',
  },
  ch_04: {
    title: 'The Oasis at Peace',
    art: '🏜️',
    body: 'The Desert Locust cloud has broken apart, scattered by the pepper oil and mango acid. The oasis is safe once more and the nomads are celebrating around their first undisturbed fire in months. You have earned the Pepper Cannon and an invitation to the Rainforest Canopy.',
  },
  ch_05: {
    title: 'The Canopy Breathes Again',
    art: '🌿',
    body: 'The Vine Strangler has been dissolved by the fermented cacao and cured vanilla compounds coursing through the canopy. Ancient trees are straightening as the vines fall away. The Cacao Potion is yours — and the volcanic plains glow on the horizon.',
  },
  ch_06: {
    title: 'The Volcano Cools',
    art: '🌋',
    body: 'The Ember Blister Fungus has been extinguished by a torrential flood of saffron compounds and dragon fruit hydrating gel. The crater is cool and the volcanic soil is more fertile than ever. The Saffron Torch lights your way toward the Celestial Farm.',
  },
  ch_07: {
    title: 'The Void Sealed — Great Harvest Complete!',
    art: '🌟',
    body: 'The Void Blight has been sealed away by the combined light of every legendary crop in existence. The Celestial Farm glows with the warmth of a thousand harvests. You have reached the pinnacle of gardening mastery. The Great Harvest awaits — a Prestige event that resets the world in your name.',
  },
};

export const CHAPTERS: Chapter[] = CHAPTER_DEFINITIONS.map((chapter, idx) => {
  const workerPages = (CHAPTER_WORKER_PAGES[chapter.id] ?? []).map(wp => ({
    id: `${chapter.id}_worker_${wp.workerId}`,
    pageType: 'worker_story' as StoryPageType,
    chapterId: chapter.id,
    title: wp.title,
    body: wp.body,
    art: wp.art,
    workerId: wp.workerId,
  }));

  const merchantEntry = CHAPTER_MERCHANT_PAGES[chapter.id];
  const merchantPage: StoryPage | null = merchantEntry
    ? {
        id: `${chapter.id}_market`,
        pageType: 'merchant_page',
        chapterId: chapter.id,
        title: merchantEntry.title,
        body: merchantEntry.body,
        art: merchantEntry.art,
      }
    : null;

  const resolutionEntry = CHAPTER_RESOLUTION_PAGES[chapter.id];
  const resolutionPage: StoryPage | null = resolutionEntry
    ? {
        id: `${chapter.id}_resolution`,
        pageType: chapter.id === 'ch_07' ? 'festival_page' : 'resolution_page',
        chapterId: chapter.id,
        title: resolutionEntry.title,
        body: resolutionEntry.body,
        art: resolutionEntry.art,
      }
    : null;

  return {
    ...chapter,
    unlockMetadata: idx === 0 ? ALWAYS_UNLOCKED : chapterGated(chapter.number),
    pages: [
      {
        id: `${chapter.id}_intro`,
        pageType: 'chapter_intro' as StoryPageType,
        chapterId: chapter.id,
        title: `${chapter.title} — Field Notes`,
        body: chapter.synopsis,
        art: chapter.emoji,
      },
      {
        id: `${chapter.id}_quests`,
        pageType: 'exploration_quest' as StoryPageType,
        chapterId: chapter.id,
        title: 'Chapter Quests',
        body: 'Complete each task below to progress the chapter and earn coin rewards.',
        art: '📋',
      },
      ...(merchantPage ? [merchantPage] : []),
      ...workerPages,
      {
        id: `${chapter.id}_boss_prep`,
        pageType: 'boss_prelude' as StoryPageType,
        chapterId: chapter.id,
        title: `Threat Report: ${chapter.boss.name}`,
        body: chapter.boss.flavor,
        art: '⚠️',
        weaponId: chapter.cropWeaponId,
      },
      {
        id: `${chapter.id}_boss`,
        pageType: 'boss_page' as StoryPageType,
        chapterId: chapter.id,
        title: `Boss Battle: ${chapter.boss.name}`,
        body: chapter.boss.flavor,
        art: chapter.boss.emoji,
        weaponId: chapter.cropWeaponId,
      },
      ...(resolutionPage ? [resolutionPage] : []),
    ] as StoryPage[],
  };
});

/** Helper: get a chapter by ID */
export const getChapter = (id: string): Chapter | undefined =>
  CHAPTERS.find(c => c.id === id);

/** Helper: get the chapter for a given region */
export const getChapterForRegion = (regionId: string): Chapter | undefined =>
  CHAPTERS.find(c => c.regionId === regionId);

// ============================================================
// UNLOCK METADATA — Story Book owns all unlock conditions
// ============================================================

/**
 * Chapter unlock metadata.
 * Defines when each chapter becomes available.
 */
export const CHAPTER_UNLOCK_METADATA: Record<string, UnlockMetadata> = {
  ch_01: ALWAYS_UNLOCKED,
  ch_02: chapterGated(1, 'preview', 'Chapter 2: The Riverlands awaits!'),
  ch_03: chapterGated(2, 'preview', 'Chapter 3: Climb to the Highlands!'),
  ch_04: chapterGated(3, 'preview', 'Chapter 4: The Desert Oasis beckons!'),
  ch_05: chapterGated(4, 'preview', 'Chapter 5: Enter the Rainforest Depths!'),
  ch_06: chapterGated(5, 'preview', 'Chapter 6: Brave the Volcanic Plains!'),
  ch_07: chapterGated(6, 'preview', 'Chapter 7: The Final Chapter awaits!'),
};

/**
 * Content unlocked by completing each chapter.
 * Story Book pages reference these for gating.
 */
export const CHAPTER_CONTENT_UNLOCKS: Record<string, {
  crops: string[];
  machines: string[];
  workers: string[];
  skills: string[];
}> = {
  ch_01: {
    crops: ['crop_001', 'crop_002', 'crop_003', 'crop_004', 'crop_005'],
    machines: ['planter_t1', 'waterer_t1', 'harvester_t1'],
    workers: ['worker_001', 'worker_002', 'worker_003', 'worker_004'],
    skills: ['gt_01', 'at_01', 'mt_01'],
  },
  ch_02: {
    crops: ['crop_unl_rice', 'crop_unl_kale', 'crop_006', 'crop_007', 'crop_008'],
    machines: ['planter_t2', 'waterer_t2', 'harvester_t2'],
    workers: ['worker_005', 'worker_006', 'worker_007', 'worker_008'],
    skills: ['gt_02', 'at_02', 'mt_02'],
  },
  ch_03: {
    crops: ['crop_unl_oats', 'crop_009', 'crop_010', 'crop_011', 'crop_012'],
    machines: ['processor_t2', 'drone_t3'],
    workers: ['worker_009', 'worker_010', 'worker_011', 'worker_012'],
    skills: ['gt_03a', 'gt_03b', 'at_03a', 'at_03b', 'mt_03a', 'mt_03b', 'al_01', 'pi_01'],
  },
  ch_04: {
    crops: ['crop_unl_pepper', 'crop_unl_mango', 'crop_013', 'crop_014', 'crop_015'],
    machines: ['planter_t3', 'waterer_t3', 'harvester_t3'],
    workers: ['worker_013', 'worker_014', 'worker_015', 'worker_016'],
    skills: ['al_02', 'pi_02'],
  },
  ch_05: {
    crops: ['crop_unl_cacao', 'crop_unl_vanilla', 'crop_016', 'crop_017', 'crop_018'],
    machines: ['processor_t3', 'drone_t4'],
    workers: ['worker_017', 'worker_018', 'worker_019', 'worker_020'],
    skills: ['gt_04', 'at_04', 'mt_04', 'al_03a', 'al_03b', 'pi_03a', 'pi_03b'],
  },
  ch_06: {
    crops: ['crop_unl_saffron', 'crop_unl_dragonfruit', 'crop_019', 'crop_020'],
    machines: ['planter_t4', 'waterer_t4', 'harvester_t4'],
    workers: ['worker_021', 'worker_022', 'worker_023', 'worker_024'],
    skills: ['al_04', 'pi_04'],
  },
  ch_07: {
    crops: ['crop_legendary_01', 'crop_legendary_02', 'crop_legendary_03'],
    machines: ['planter_t5', 'waterer_t5', 'harvester_t5', 'processor_t5', 'drone_t5'],
    workers: ['worker_025', 'worker_026', 'worker_027', 'worker_028'],
    skills: ['gt_05', 'at_05', 'mt_05', 'al_05', 'pi_05'],
  },
};

/**
 * Get unlock metadata for a crop.
 */
export function getCropUnlockMetadata(cropId: string): UnlockMetadata {
  for (const [chapterId, content] of Object.entries(CHAPTER_CONTENT_UNLOCKS)) {
    if (content.crops.includes(cropId)) {
      const chapterNum = parseInt(chapterId.replace('ch_0', ''), 10);
      return chapterGated(
        chapterNum - 1 || 1,
        chapterNum === 1 ? 'unlocked' : 'preview',
        `New crop from Chapter ${chapterNum}!`
      );
    }
  }
  return ALWAYS_UNLOCKED;
}

/**
 * Get unlock metadata for a machine.
 */
export function getMachineUnlockMetadata(machineId: string): UnlockMetadata {
  for (const [chapterId, content] of Object.entries(CHAPTER_CONTENT_UNLOCKS)) {
    if (content.machines.includes(machineId)) {
      const chapterNum = parseInt(chapterId.replace('ch_0', ''), 10);
      return chapterGated(
        chapterNum - 1 || 1,
        chapterNum === 1 ? 'unlocked' : 'preview',
        `New machine from Chapter ${chapterNum}!`
      );
    }
  }
  return ALWAYS_UNLOCKED;
}

/**
 * Get unlock metadata for a worker.
 */
export function getWorkerUnlockMetadata(workerId: string): UnlockMetadata {
  for (const [chapterId, content] of Object.entries(CHAPTER_CONTENT_UNLOCKS)) {
    if (content.workers.includes(workerId)) {
      const chapterNum = parseInt(chapterId.replace('ch_0', ''), 10);
      return chapterGated(
        chapterNum - 1 || 1,
        chapterNum === 1 ? 'unlocked' : 'preview',
        `New worker from Chapter ${chapterNum}!`
      );
    }
  }
  return ALWAYS_UNLOCKED;
}

/**
 * Get unlock metadata for a skill.
 */
export function getSkillUnlockMetadata(skillId: string): UnlockMetadata {
  for (const [chapterId, content] of Object.entries(CHAPTER_CONTENT_UNLOCKS)) {
    if (content.skills.includes(skillId)) {
      const chapterNum = parseInt(chapterId.replace('ch_0', ''), 10);
      return chapterGated(
        chapterNum - 1 || 1,
        chapterNum === 1 ? 'unlocked' : 'available',
        `New skill available!`
      );
    }
  }
  return ALWAYS_UNLOCKED;
}

/**
 * Check if content is unlocked for a given chapter.
 */
export function isChapterContentUnlocked(
  chapterId: string,
  contentId: string,
  contentType: 'crops' | 'machines' | 'workers' | 'skills'
): boolean {
  const content = CHAPTER_CONTENT_UNLOCKS[chapterId];
  if (!content) return false;
  return content[contentType].includes(contentId);
}

// ============================================================
// Phase 3 — Region Chapter Template helpers
// ============================================================

/**
 * Convert a runtime Chapter to the canonical RegionChapterTemplate.
 *
 * Bridges the runtime representation (which carries render-time fields
 * like `pages`, `emoji`, `unlockMetadata`) to the normalised schema
 * consumed by content tooling, boss engines and balance validators.
 */
export function toRegionChapterTemplate(chapter: Chapter): RegionChapterTemplate {
  return {
    regionId: chapter.regionId,
    chapterNumber: chapter.number,
    title: chapter.title,
    introText: chapter.synopsis,
    theme: chapter.theme ?? [],
    recommendedPlaytimeHours: chapter.recommendedPlaytimeHours ?? 0,
    initialUnlocks: chapter.initialUnlocks ?? [],
    crops: chapter.crops ?? [],
    machinesUnlocked: chapter.machinesUnlocked ?? [],
    workersIntroduced: chapter.workersIntroduced ?? [],
    merchantTypes: chapter.merchantTypes ?? [],
    explorationQuests: chapter.quests.map(q => q.id),
    boss: {
      id: chapter.boss.id,
      name: chapter.boss.name,
      hp: chapter.boss.maxHp,
      weakCrops: chapter.boss.weakCropIds,
      weaknessItemId: chapter.boss.defeatReward.unlocksWeaponId,
      mechanics: chapter.boss.mechanics ?? [],
      recommendedWeaponCost: chapter.boss.recommendedWeaponCost ?? 0,
    },
    ucwBlueprint: chapter.cropWeaponId,
    festival: chapter.festival ?? '',
    rewards: chapter.rewards ?? { peaceToken: 0, seedPack: '', prestigeFragments: 0 },
    unlockCondition: chapter.unlockMetadata,
    storyBeats: chapter.storyBeats ?? [],
    balanceTargets: chapter.balanceTargets ?? {
      weaponCraftTargetMinutes: 0,
      bossDefeatTargetMinutes: 0,
    },
  };
}

/**
 * Get the canonical RegionChapterTemplate for a chapter by ID.
 * Returns undefined if the chapter is not found.
 */
export function getRegionChapterTemplate(chapterId: string): RegionChapterTemplate | undefined {
  const chapter = getChapter(chapterId);
  return chapter ? toRegionChapterTemplate(chapter) : undefined;
}

/** All chapters as canonical RegionChapterTemplates (ordered by chapter number). */
export const REGION_CHAPTER_TEMPLATES: RegionChapterTemplate[] =
  CHAPTERS.map(toRegionChapterTemplate);

