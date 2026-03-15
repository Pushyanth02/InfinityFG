// ============================================================
// COZY GARDEN — CHAPTERS, QUESTS & BOSS DEFINITIONS
// Each chapter maps to one region and tells one story arc.
// Story Book is the single source of truth for all unlocks.
// ============================================================

import type { UnlockMetadata } from '../types/unlock';
import { ALWAYS_UNLOCKED, chapterGated } from '../types/unlock';

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
}

export interface StoryPage {
  id: string;
  title: string;
  content: string;
  unlocks: {
    crops?: string[];
    machines?: string[];
    workers?: string[];
    skills?: string[];
  };
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
      defeatReward: {
        coinsBonus: 5000000,
        unlocksRegionId: '',
        unlocksWeaponId: 'ucw_starlight_sceptre',
      },
    },
    cropWeaponId: 'ucw_starlight_sceptre',
  },
];

export const CHAPTERS: Chapter[] = CHAPTER_DEFINITIONS.map((chapter, idx) => ({
  ...chapter,
  unlockMetadata: idx === 0 ? ALWAYS_UNLOCKED : chapterGated(chapter.number),
  pages: [
    {
      id: `${chapter.id}_overview`,
      title: `${chapter.title} Field Notes`,
      content: chapter.synopsis,
      unlocks: {},
    },
    {
      id: `${chapter.id}_boss_dossier`,
      title: `${chapter.boss.name} Dossier`,
      content: chapter.boss.flavor,
      unlocks: {
        crops: chapter.boss.weakCropIds,
      },
    },
  ],
}));

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
  ch_02: chapterGated(1, 'teased', 'Chapter 2: The Riverlands awaits!'),
  ch_03: chapterGated(2, 'teased', 'Chapter 3: Climb to the Highlands!'),
  ch_04: chapterGated(3, 'teased', 'Chapter 4: The Desert Oasis beckons!'),
  ch_05: chapterGated(4, 'teased', 'Chapter 5: Enter the Rainforest Depths!'),
  ch_06: chapterGated(5, 'teased', 'Chapter 6: Brave the Volcanic Plains!'),
  ch_07: chapterGated(6, 'teased', 'Chapter 7: The Final Chapter awaits!'),
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
        chapterNum === 1 ? 'unlocked' : 'teased',
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
        chapterNum === 1 ? 'unlocked' : 'teased',
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
        chapterNum === 1 ? 'unlocked' : 'teased',
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
        chapterNum === 1 ? 'unlocked' : 'revealed',
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

