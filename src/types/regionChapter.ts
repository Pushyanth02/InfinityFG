// ============================================================
// COZY GARDEN — Region Chapter Template (Phase 3)
// Canonical data schema for every region chapter.
//
// Every chapter is an instance of this template.
// Content creators fill the fields; all consuming systems —
// Story Book UI, unlock pipeline, boss engine, festival
// rewards, and engine balance — derive their behaviour
// from these declarations.
//
// Mapping to the runtime Chapter type in src/data/chapters.ts:
//   chapterNumber       ↔  Chapter.number
//   introText           ↔  Chapter.synopsis
//   explorationQuests   ↔  Chapter.quests[*].id
//   boss.hp             ↔  ChapterBoss.maxHp
//   boss.weakCrops      ↔  ChapterBoss.weakCropIds
//   boss.weaknessItemId ↔  ChapterBoss.defeatReward.unlocksWeaponId
//   ucwBlueprint        ↔  Chapter.cropWeaponId
//   unlockCondition     ↔  Chapter.unlockMetadata
// ============================================================

import type { UnlockMetadata } from './unlock';

// ── Sub-types ────────────────────────────────────────────────

/**
 * Boss descriptor in the canonical chapter template.
 * A normalised view of boss data that engines consume directly.
 */
export interface BossTemplate {
  /** Stable machine ID (e.g. "boss_crumblewort") */
  id: string;
  /** Display name */
  name: string;
  /** Total damage needed to defeat the boss */
  hp: number;
  /**
   * Human-readable crop names that deal 3× damage
   * (e.g. ["wheat", "carrot"]).
   */
  weakCrops: string[];
  /** Item ID of the UCW that delivers the final strike */
  weaknessItemId: string;
  /**
   * Machine-readable boss mechanic tags.
   * Used by the boss engine to choose attack patterns.
   * Examples: "spread_patches", "hardened_cores", "frost_spores"
   */
  mechanics: string[];
  /**
   * Recommended total coin cost to fully craft and equip the UCW.
   * Displayed to the player as a "weapon budget" hint in the Story Book.
   */
  recommendedWeaponCost: number;
}

/**
 * Chapter completion rewards granted when the boss is defeated.
 */
export interface ChapterRewards {
  /** Number of Peace Tokens granted to the player */
  peaceToken: number;
  /** ID of the seed pack reward (rendered on the resolution page) */
  seedPack: string;
  /** Number of Prestige Fragments granted */
  prestigeFragments: number;
}

/**
 * A single narrative milestone in a chapter's story arc.
 * Story beats are ordered key moments shown in the Story Book
 * chapter timeline and in Village News as the player progresses.
 */
export interface StoryBeat {
  /** Stable machine ID for the beat (e.g. "ch01_beat_01") */
  id: string;
  /** Short description shown in the Story Book timeline */
  description: string;
}

/**
 * Design-time balance targets for a region chapter.
 * Used by the engine and QA to validate playtime within the
 * intended window.
 */
export interface BalanceTargets {
  /** Expected minutes from chapter start to first UCW craft */
  weaponCraftTargetMinutes: number;
  /** Expected minutes from chapter start to boss defeat */
  bossDefeatTargetMinutes: number;
}

// ── Canonical template ───────────────────────────────────────

/**
 * Canonical Region Chapter Template.
 *
 * Every region chapter must be an instance of this template.
 * Content creators fill these fields; the Story Book UI,
 * unlock pipeline, boss engine and festival systems all consume them.
 */
export interface RegionChapterTemplate {
  /** Stable region ID (e.g. "region_01_meadow") */
  regionId: string;
  /** Chapter ordinal (1-based) */
  chapterNumber: number;
  /** Display title */
  title: string;
  /** Full narrative introduction shown at chapter open */
  introText: string;
  /**
   * Thematic tags for UI theming, asset selection and analytics.
   * Examples: ["meadow", "sunny", "fertile"]
   */
  theme: string[];
  /**
   * Designer estimate of playtime in hours.
   * Displayed to players as a pacing hint.
   */
  recommendedPlaytimeHours: number;
  /**
   * Item IDs immediately available when the chapter starts,
   * before any quests or purchases are required.
   */
  initialUnlocks: string[];
  /** All crop IDs available or unlockable during this chapter */
  crops: string[];
  /** Machine IDs unlocked during this chapter */
  machinesUnlocked: string[];
  /** Key Village Folk worker IDs introduced in this chapter */
  workersIntroduced: string[];
  /** Merchant archetype IDs that visit during this chapter */
  merchantTypes: string[];
  /** Ordered list of exploration quest IDs */
  explorationQuests: string[];
  /** Canonical boss descriptor */
  boss: BossTemplate;
  /** Ultimate Crop Weapon blueprint ID crafted in this chapter */
  ucwBlueprint: string;
  /** Festival ID triggered on boss defeat */
  festival: string;
  /** Rewards granted on chapter completion */
  rewards: ChapterRewards;
  /** When this chapter becomes visible/available in the unlock pipeline */
  unlockCondition: UnlockMetadata;
  /** Ordered narrative milestones for this chapter */
  storyBeats: StoryBeat[];
  /** Balance targets for QA and engine calibration */
  balanceTargets: BalanceTargets;
}
