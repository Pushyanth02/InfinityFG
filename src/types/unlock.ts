// ============================================================
// COZY GARDEN — Unified Unlock System Types
// Single source of truth for all content gating and visibility.
// ============================================================

/**
 * All possible unlock condition types.
 * Every mechanical unlock in the game uses one of these.
 */
export type UnlockConditionType =
  | 'chapter_started'     // Chapter N must be started (currentChapter >= N)
  | 'chapter_completed'   // Chapter N boss must be defeated
  | 'quest_completed'     // Specific quest ID must be completed
  | 'crop_harvested'      // Harvested X total of cropId (lifetime)
  | 'machine_deployed'    // Deployed X machines of machineId
  | 'worker_hired'        // Hired X workers (total or of specific role)
  | 'region_reputation'   // Region reputation >= X
  | 'skill_unlocked'      // Specific skill ID must be unlocked
  | 'coins_lifetime'      // Lifetime coins >= X
  | 'boss_damaged'        // Dealt X damage to bossId (total)
  | 'recipe_crafted'      // Crafted X of recipeId
  | 'always';             // Always available (no condition)

/**
 * A single unlock condition.
 * Represents one requirement that must be met.
 */
export interface UnlockCondition {
  type: UnlockConditionType;
  target?: string;        // cropId, machineId, workerId, questId, skillId, recipeId
  amount?: number;        // Threshold amount (defaults to 1)
  chapter?: number;       // Chapter number for chapter_started/chapter_completed
  regionId?: string;      // Region ID for region_reputation
}

/**
 * Compound unlock requirement supporting AND/OR/NOT logic.
 * At least one of `all`, `any`, or `none` must be provided.
 */
export interface UnlockRequirement {
  all?: UnlockCondition[];  // ALL conditions must be met (AND)
  any?: UnlockCondition[];  // ANY condition must be met (OR)
  none?: UnlockCondition[]; // NONE of these conditions can be met (NOT)
}

/**
 * Visibility state for locked content.
 * Controls how locked items appear in UI.
 *
 * State machine: hidden → preview → available → unlocked
 *   HIDDEN    — not listed anywhere
 *   PREVIEW   — greyed teaser in "Future (Locked)" column; short description, no cost shown
 *   AVAILABLE — shown in "Available Now" with exact requirements + Unlock button
 *   UNLOCKED  — active and shown in Unlocked column; Village News announcement posted
 */
export type VisibilityState =
  | 'hidden'     // Not shown at all in UI
  | 'preview'    // Greyed teaser; short description, no cost shown
  | 'available'  // Requirements met; player can spend resource or accept to unlock
  | 'unlocked';  // Fully accessible

/**
 * Complete unlock metadata for any game content.
 * Attached to crops, machines, workers, skills, recipes, chapters, etc.
 */
export interface UnlockMetadata {
  /** The requirement that must be met to unlock this content */
  requirement: UnlockRequirement;

  /** How this content appears when locked */
  visibility: VisibilityState;

  /** Story Book page ID associated with this unlock */
  storyPageId?: string;

  /** Village News announcement text when unlocked */
  announcementText?: string;

  /** Category for grouping in Story Book */
  category?: 'narrative' | 'encyclopedia' | 'blueprint' | 'merchant' | 'achievement';
}

/**
 * Helper to create a simple "always unlocked" metadata.
 */
export const ALWAYS_UNLOCKED: UnlockMetadata = {
  requirement: { all: [{ type: 'always' }] },
  visibility: 'unlocked',
};

/**
 * Helper to create chapter-gated unlock metadata.
 */
export function chapterGated(
  chapter: number,
  visibility: VisibilityState = 'preview',
  announcementText?: string
): UnlockMetadata {
  return {
    requirement: { all: [{ type: 'chapter_completed', chapter: chapter - 1 }] },
    visibility,
    announcementText,
  };
}

/**
 * Helper to create quest-gated unlock metadata.
 */
export function questGated(
  questId: string,
  visibility: VisibilityState = 'preview',
  announcementText?: string
): UnlockMetadata {
  return {
    requirement: { all: [{ type: 'quest_completed', target: questId }] },
    visibility,
    announcementText,
  };
}

/**
 * Helper to create lifetime coins threshold unlock metadata.
 */
export function coinsGated(
  amount: number,
  visibility: VisibilityState = 'available',
  announcementText?: string
): UnlockMetadata {
  return {
    requirement: { all: [{ type: 'coins_lifetime', amount }] },
    visibility,
    announcementText,
  };
}

/**
 * Helper to create region reputation threshold unlock metadata.
 */
export function reputationGated(
  regionId: string,
  amount: number,
  visibility: VisibilityState = 'preview',
  announcementText?: string
): UnlockMetadata {
  return {
    requirement: { all: [{ type: 'region_reputation', regionId, amount }] },
    visibility,
    announcementText,
  };
}
