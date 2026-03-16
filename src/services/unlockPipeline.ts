// ============================================================
// COZY GARDEN — Unlock Pipeline (Phase 2)
// Centralized visibility-state machine for all gated content.
//
// State machine per item:
//   HIDDEN → PREVIEW → AVAILABLE → UNLOCKED
//
// The pipeline:
//   1. Registers content items (from chapters, crops, workers, etc.)
//   2. Subscribes to relevant EventBus triggers
//   3. On each trigger, runs evaluateUnlockTree over all registered items
//   4. When an item first satisfies its requirements:
//        • advances its visibilityState to 'available'
//        • emits CONTENT_AVAILABLE → VillageNews posts an announcement
//   5. When the player explicitly confirms the unlock:
//        • call pipeline.markUnlocked(id) to advance to 'unlocked'
//        • emits CONTENT_UNLOCKED → VillageNews posts the full unlock entry
//
// Usage (call once at app boot, e.g. in main.tsx or a provider):
//   unlockPipeline.registerBatch(storyPages, getEvalState);
//   unlockPipeline.registerBatch(CROPS, getEvalState);
// ============================================================

import type { UnlockMetadata, VisibilityState } from '../types/unlock';
import { evaluateUnlockTree, checkItem } from './unlockService';
import type { CheckItemResult, TrackedItem } from './unlockService';
import { eventBus } from './eventBus';
import type { UnlockEvaluationState } from './unlockService';

/** A registered content item tracked by the pipeline. */
interface PipelineEntry extends TrackedItem {
  /** Stable display name for announcements */
  displayName?: string;
  /** Content category for granular CONTENT_AVAILABLE payloads */
  contentType?: string;
}

/**
 * UnlockPipeline — singleton that wires EventBus triggers to the
 * evaluateUnlockTree algorithm, advancing items from preview → available
 * and emitting CONTENT_AVAILABLE when they first become ready.
 */
class UnlockPipeline {
  private registry: Map<string, PipelineEntry> = new Map();
  private getState: (() => UnlockEvaluationState) | null = null;
  private readonly unsubscribers: Array<() => void> = [];

  constructor() {
    this.subscribeToTriggers();
  }

  // ── Setup ────────────────────────────────────────────────────

  /**
   * Provide the state accessor.  Must be called before any evaluation runs.
   * Typically called once in a React provider or app boot file.
   */
  setStateAccessor(getState: () => UnlockEvaluationState): void {
    this.getState = getState;
  }

  /**
   * Register a single content item for unlock tracking.
   * If the item has no unlockMetadata it is treated as immediately unlocked
   * and is not added to the registry (nothing to track).
   */
  register(
    item: { id: string; unlockMetadata?: UnlockMetadata; name?: string },
    contentType = 'generic'
  ): void {
    if (!item.unlockMetadata) return;

    if (!this.registry.has(item.id)) {
      this.registry.set(item.id, {
        id: item.id,
        unlockMetadata: item.unlockMetadata,
        visibilityState: item.unlockMetadata.visibility,
        displayName: item.name,
        contentType,
      });
    }
  }

  /**
   * Batch-register an array of items.
   */
  registerBatch(
    items: Array<{ id: string; unlockMetadata?: UnlockMetadata; name?: string }>,
    contentType = 'generic'
  ): void {
    for (const item of items) {
      this.register(item, contentType);
    }
  }

  // ── Evaluation ───────────────────────────────────────────────

  /**
   * Run the unlock tree evaluation against current state.
   * Called automatically on every registered EventBus trigger.
   * Can also be called manually (e.g. after loading a save).
   */
  evaluate(): void {
    if (!this.getState) return;
    const state = this.getState();

    const entries = Array.from(this.registry.values());

    evaluateUnlockTree(entries, state, (item) => {
      // Item just transitioned to 'available' — emit CONTENT_AVAILABLE
      const entry = item as PipelineEntry;
      eventBus.emit('CONTENT_AVAILABLE', {
        contentType: entry.contentType ?? 'generic',
        itemId: entry.id,
        announcementText:
          entry.unlockMetadata.announcementText ??
          (entry.displayName ? `${entry.displayName} is now available!` : 'New content is available!'),
      });
    });

    // Sync updated visibilityStates back into the registry
    for (const entry of entries) {
      this.registry.set(entry.id, entry as PipelineEntry);
    }
  }

  // ── Explicit unlock (player confirms) ────────────────────────

  /**
   * Call when the player explicitly accepts/buys an 'available' item.
   * Advances its state to 'unlocked' and emits CONTENT_UNLOCKED.
   */
  markUnlocked(itemId: string): void {
    const entry = this.registry.get(itemId);
    if (!entry) return;
    if (entry.visibilityState === 'unlocked') return;

    entry.visibilityState = 'unlocked';

    eventBus.emit('CONTENT_UNLOCKED', {
      contentType: entry.contentType ?? 'generic',
      itemId: entry.id,
      announcementText:
        entry.unlockMetadata.announcementText ??
        (entry.displayName ? `${entry.displayName} unlocked!` : 'New content unlocked!'),
    });
  }

  // ── Queries ──────────────────────────────────────────────────

  /**
   * Returns the current visibility state of a registered item.
   * Falls back to evaluating from scratch if the item hasn't been registered.
   */
  getVisibilityState(itemId: string): VisibilityState {
    return this.registry.get(itemId)?.visibilityState ?? 'hidden';
  }

  /**
   * Deterministic check for a single item.
   * Returns whether it can be unlocked now and an ETA hint if not.
   */
  checkItem(item: { id: string; unlockMetadata?: UnlockMetadata }): CheckItemResult {
    if (!item.unlockMetadata) return { canUnlock: true, eta: '' };
    if (!this.getState) return { canUnlock: false, eta: 'Not initialised' };
    return checkItem({ unlockMetadata: item.unlockMetadata }, this.getState());
  }

  /**
   * Returns all registered items grouped by current visibilityState.
   */
  getGrouped(): Record<VisibilityState, PipelineEntry[]> {
    const result: Record<VisibilityState, PipelineEntry[]> = {
      hidden: [],
      preview: [],
      available: [],
      unlocked: [],
    };
    for (const entry of this.registry.values()) {
      result[entry.visibilityState].push(entry);
    }
    return result;
  }

  // ── EventBus subscriptions ────────────────────────────────────

  /**
   * Subscribe to all Phase 2 trigger events.
   * Each trigger re-runs the full evaluation tree (cheap — pure comparisons).
   */
  private subscribeToTriggers(): void {
    const triggers = [
      'COINS_CHANGED',
      'CHAPTER_STARTED',
      'QUEST_COMPLETED',
      'WORKER_TRUST_UPDATED',
      'REGION_REPUTATION_CHANGED',
      'CRAFT_COMPLETED',
    ] as const;

    for (const type of triggers) {
      this.unsubscribers.push(
        eventBus.subscribe(type, () => this.evaluate())
      );
    }
  }

  /** Tear down all subscriptions (useful in tests). */
  destroy(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers.length = 0;
    this.registry.clear();
  }
}

/** Singleton instance — import and use everywhere. */
export const unlockPipeline = new UnlockPipeline();
