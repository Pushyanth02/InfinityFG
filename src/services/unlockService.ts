// ============================================================
// COZY GARDEN — Unlock Service
// Central service for evaluating unlock conditions.
// Story Book uses this to gate all content visibility.
// ============================================================

import type {
  UnlockCondition,
  UnlockRequirement,
  UnlockMetadata,
  VisibilityState,
} from '../types/unlock';
import { CHAPTERS } from '../data/chapters';

/**
 * State subset required for unlock evaluation.
 * This is the minimal state needed to check unlock conditions.
 */
export interface UnlockEvaluationState {
  // Core progression
  currentChapterId: string;
  chapterProgress: Record<string, { isDefeated: boolean; questsComplete: string[] }>;
  lifetimeCoins: number;

  // Unlocked content
  unlockedSkills: string[];
  unlockedRegions: string[];

  // Automation
  machines: { machineId: string; count: number }[];
  workers: Record<string, number>;

  // Tracking (new fields - optional for backwards compat)
  harvestTracking?: Record<string, number>;
  bossDamageTracking?: Record<string, number>;
  regionReputation?: Record<string, number>;
  craftingTracking?: Record<string, number>;
}

/**
 * Extracts chapter number from chapter ID (e.g., 'ch_01' -> 1)
 */
function getChapterNumber(chapterId: string): number {
  const match = chapterId.match(/ch_0?(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Evaluates a single unlock condition against game state.
 * Returns true if the condition is met.
 */
export function evaluateCondition(
  condition: UnlockCondition,
  state: UnlockEvaluationState
): boolean {
  const amount = condition.amount ?? 1;

  switch (condition.type) {
    case 'always':
      return true;

    case 'chapter_started': {
      const currentNum = getChapterNumber(state.currentChapterId);
      const requiredNum = condition.chapter ?? 1;
      return currentNum >= requiredNum;
    }

    case 'chapter_completed': {
      const requiredChapter = condition.chapter ?? 1;
      // Find the chapter ID for this number
      const chapter = CHAPTERS.find((c) => c.number === requiredChapter);
      if (!chapter) return false;
      return state.chapterProgress[chapter.id]?.isDefeated ?? false;
    }

    case 'quest_completed': {
      if (!condition.target) return false;
      return Object.values(state.chapterProgress).some((cp) =>
        cp.questsComplete.includes(condition.target!)
      );
    }

    case 'crop_harvested': {
      if (!condition.target) return false;
      const harvested = state.harvestTracking?.[condition.target] ?? 0;
      return harvested >= amount;
    }

    case 'machine_deployed': {
      if (condition.target) {
        // Specific machine type
        const machine = state.machines.find((m) => m.machineId === condition.target);
        return (machine?.count ?? 0) >= amount;
      } else {
        // Any machines
        const total = state.machines.reduce((sum, m) => sum + m.count, 0);
        return total >= amount;
      }
    }

    case 'worker_hired': {
      if (condition.target) {
        // Specific worker type
        return (state.workers[condition.target] ?? 0) >= amount;
      } else {
        // Any workers
        const total = Object.values(state.workers).reduce((a, b) => a + b, 0);
        return total >= amount;
      }
    }

    case 'region_reputation': {
      if (!condition.regionId) return false;
      const rep = state.regionReputation?.[condition.regionId] ?? 0;
      return rep >= amount;
    }

    case 'skill_unlocked': {
      if (!condition.target) return false;
      return state.unlockedSkills.includes(condition.target);
    }

    case 'coins_lifetime': {
      return state.lifetimeCoins >= amount;
    }

    case 'boss_damaged': {
      if (!condition.target) return false;
      const damage = state.bossDamageTracking?.[condition.target] ?? 0;
      return damage >= amount;
    }

    case 'recipe_crafted': {
      if (!condition.target) return false;
      const crafted = state.craftingTracking?.[condition.target] ?? 0;
      return crafted >= amount;
    }

    default:
      return false;
  }
}

/**
 * Evaluates a compound unlock requirement.
 * Supports AND (all), OR (any), and NOT (none) logic.
 */
export function evaluateRequirement(
  requirement: UnlockRequirement,
  state: UnlockEvaluationState
): boolean {
  // All conditions in 'all' must be met (AND)
  const allMet =
    !requirement.all || requirement.all.every((c) => evaluateCondition(c, state));

  // At least one condition in 'any' must be met (OR)
  const anyMet =
    !requirement.any || requirement.any.some((c) => evaluateCondition(c, state));

  // None of the conditions in 'none' can be met (NOT)
  const noneMet =
    !requirement.none || requirement.none.every((c) => !evaluateCondition(c, state));

  return allMet && anyMet && noneMet;
}

/**
 * Gets the effective visibility state for content based on unlock metadata.
 * Returns 'unlocked' if requirements are met, otherwise returns the configured visibility.
 */
export function getVisibility(
  metadata: UnlockMetadata,
  state: UnlockEvaluationState
): VisibilityState {
  if (evaluateRequirement(metadata.requirement, state)) {
    return 'unlocked';
  }
  return metadata.visibility;
}

/**
 * Checks if content is unlocked (shorthand for getVisibility === 'unlocked').
 */
export function isUnlocked(
  metadata: UnlockMetadata,
  state: UnlockEvaluationState
): boolean {
  return evaluateRequirement(metadata.requirement, state);
}

/**
 * Finds all items that transitioned to 'unlocked' between two states.
 * Used to detect new unlocks and trigger announcements.
 */
export function getNewUnlocks<T extends { id: string; unlockMetadata?: UnlockMetadata }>(
  items: T[],
  previousState: UnlockEvaluationState,
  currentState: UnlockEvaluationState
): T[] {
  return items.filter((item) => {
    if (!item.unlockMetadata) return false;
    const wasUnlocked = evaluateRequirement(item.unlockMetadata.requirement, previousState);
    const isNowUnlocked = evaluateRequirement(item.unlockMetadata.requirement, currentState);
    return !wasUnlocked && isNowUnlocked;
  });
}

/**
 * Groups items by their visibility state.
 * Useful for UI rendering - show unlocked, then teased, hide hidden.
 */
export function groupByVisibility<T extends { id: string; unlockMetadata?: UnlockMetadata }>(
  items: T[],
  state: UnlockEvaluationState
): Record<VisibilityState, T[]> {
  const result: Record<VisibilityState, T[]> = {
    hidden: [],
    preview: [],
    available: [],
    unlocked: [],
  };

  for (const item of items) {
    if (!item.unlockMetadata) {
      result.unlocked.push(item);
    } else {
      const vis = getVisibility(item.unlockMetadata, state);
      result[vis].push(item);
    }
  }

  return result;
}

/**
 * Gets a human-readable description of what's needed to unlock content.
 * Used for UI tooltips on locked items.
 */
export function getUnlockRequirementText(
  metadata: UnlockMetadata,
  state: UnlockEvaluationState
): string {
  const unmetConditions: string[] = [];

  const checkConditions = (conditions: UnlockCondition[] | undefined) => {
    if (!conditions) return;
    for (const cond of conditions) {
      if (!evaluateCondition(cond, state)) {
        unmetConditions.push(conditionToText(cond, state));
      }
    }
  };

  checkConditions(metadata.requirement.all);
  checkConditions(metadata.requirement.any);

  if (unmetConditions.length === 0) {
    return 'Already unlocked!';
  }

  return unmetConditions.join(', ');
}

/**
 * Converts a single condition to human-readable text.
 */
function conditionToText(
  condition: UnlockCondition,
  state: UnlockEvaluationState
): string {
  const amount = condition.amount ?? 1;

  switch (condition.type) {
    case 'chapter_started':
      return `Start Chapter ${condition.chapter}`;
    case 'chapter_completed':
      return `Complete Chapter ${condition.chapter}`;
    case 'quest_completed':
      return `Complete quest: ${condition.target}`;
    case 'crop_harvested': {
      const current = state.harvestTracking?.[condition.target!] ?? 0;
      return `Harvest ${amount} ${condition.target} (${current}/${amount})`;
    }
    case 'machine_deployed': {
      const machineId = condition.target;
      const machine = state.machines.find((m) => m.machineId === machineId);
      const current = machine?.count ?? 0;
      return `Deploy ${amount} ${machineId || 'machines'} (${current}/${amount})`;
    }
    case 'worker_hired': {
      const current = condition.target
        ? state.workers[condition.target] ?? 0
        : Object.values(state.workers).reduce((a, b) => a + b, 0);
      return `Hire ${amount} ${condition.target || 'workers'} (${current}/${amount})`;
    }
    case 'region_reputation': {
      const current = state.regionReputation?.[condition.regionId!] ?? 0;
      return `${condition.regionId} reputation ${amount} (${current}/${amount})`;
    }
    case 'skill_unlocked':
      return `Unlock skill: ${condition.target}`;
    case 'coins_lifetime':
      return `Earn ${amount.toLocaleString()} lifetime coins`;
    default:
      return 'Unknown requirement';
  }
}

// ============================================================
// Phase 2: Unlock Pipeline helpers
// ============================================================

/**
 * Mutable tracked item for the unlock pipeline.
 * Holds the last-known visibility state so transitions can be detected.
 */
export interface TrackedItem {
  id: string;
  unlockMetadata: UnlockMetadata;
  /** Resolved visibility at last evaluation — mutated by evaluateUnlockTree */
  visibilityState: VisibilityState;
}

/**
 * Result of a single checkItem call.
 * canUnlock: true when all conditions are currently satisfied.
 * eta: human-readable estimate of what's still needed (empty when canUnlock is true).
 */
export interface CheckItemResult {
  canUnlock: boolean;
  eta: string;
}

/**
 * Deterministic unlock evaluation matching the Phase 2 pseudocode.
 *
 * For every item that is not yet 'unlocked', checks whether its conditions
 * are now satisfied. When they are and the item is not already 'available',
 * the item's visibilityState is advanced to 'available' and a callback is
 * invoked so the caller (UnlockPipeline) can emit CONTENT_AVAILABLE.
 *
 * Items already at 'unlocked' are skipped (they are managed externally).
 *
 * @param items   Mutable array of tracked items (visibilityState is updated in place)
 * @param state   Current evaluation state
 * @param onAvailable  Called for each item that transitions to 'available'
 */
export function evaluateUnlockTree(
  items: TrackedItem[],
  state: UnlockEvaluationState,
  onAvailable: (item: TrackedItem) => void
): void {
  for (const item of items) {
    if (item.visibilityState === 'unlocked') continue;

    const ok = evaluateRequirement(item.unlockMetadata.requirement, state);
    if (ok && item.visibilityState !== 'available') {
      item.visibilityState = 'available';
      onAvailable(item);
    }
  }
}

/**
 * Checks a single item against current state and returns an unlock result
 * with a deterministic boolean and an ETA description for UI hints.
 */
export function checkItem(
  item: Pick<TrackedItem, 'unlockMetadata'>,
  state: UnlockEvaluationState
): CheckItemResult {
  const canUnlock = evaluateRequirement(item.unlockMetadata.requirement, state);
  const eta = canUnlock ? '' : getUnlockRequirementText(item.unlockMetadata, state);
  return { canUnlock, eta };
}
