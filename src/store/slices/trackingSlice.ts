// ============================================================
// COZY GARDEN — Tracking Slice
// Tracks lifetime statistics for unlock conditions.
// Harvest counts, boss damage, region reputation, etc.
// ============================================================

import type { StateCreator } from 'zustand';
import type { GameState } from '../../types/game';
import { eventBus } from '../../services/eventBus';

/**
 * Tunables for reputation system.
 * These control how reputation is earned and decays.
 */
export const REPUTATION_TUNABLES = {
  /** Base reputation earned per harvest in a region */
  HARVEST_REP_BASE: 1,

  /** Reputation multiplier for rare crops */
  RARE_CROP_REP_MULT: 3,

  /** Reputation decay rate per hour when idle (fraction) */
  DECAY_RATE_PER_HOUR: 0.05,

  /** Minimum reputation (never goes below this) */
  MIN_REPUTATION: 0,

  /** Maximum reputation per region */
  MAX_REPUTATION: 1000,
};

export interface TrackingSlice {
  // ── Harvest Tracking ─────────────────────────────────
  /** Lifetime count of each crop harvested (cropId -> count) */
  harvestTracking: Record<string, number>;

  // ── Boss Damage Tracking ─────────────────────────────
  /** Total damage dealt to each boss (bossId -> damage) */
  bossDamageTracking: Record<string, number>;

  // ── Region Reputation ────────────────────────────────
  /** Reputation points per region (regionId -> points) */
  regionReputation: Record<string, number>;

  /** Last time reputation was updated (for decay calculation) */
  lastReputationUpdate: number;

  // ── Crafting Tracking ────────────────────────────────
  /** Count of each recipe crafted (recipeId -> count) */
  craftingTracking: Record<string, number>;

  // ── Milestone Tracking ───────────────────────────────
  /** Milestones that have been reached (milestoneId -> timestamp) */
  milestonesReached: Record<string, number>;

  // ── Actions ──────────────────────────────────────────
  trackHarvest: (cropId: string, amount: number, regionId?: string) => void;
  trackBossDamage: (bossId: string, damage: number) => void;
  updateReputation: (regionId: string, delta: number) => void;
  decayReputation: (deltaSeconds: number) => void;
  trackCrafting: (recipeId: string, amount: number) => void;
  checkMilestone: (milestoneId: string, value: number, threshold: number) => void;

  // ── Getters ──────────────────────────────────────────
  getHarvestCount: (cropId: string) => number;
  getTotalHarvests: () => number;
  getRegionReputation: (regionId: string) => number;
}

export const createTrackingSlice: StateCreator<
  GameState,
  [],
  [],
  TrackingSlice
> = (set, get) => ({
  harvestTracking: {},
  bossDamageTracking: {},
  regionReputation: {},
  lastReputationUpdate: Date.now(),
  craftingTracking: {},
  milestonesReached: {},

  // ── trackHarvest ─────────────────────────────────────────
  trackHarvest: (cropId, amount, regionId) => {
    set((state) => ({
      harvestTracking: {
        ...state.harvestTracking,
        [cropId]: (state.harvestTracking[cropId] ?? 0) + amount,
      },
    }));

    // Also update region reputation if regionId provided
    if (regionId) {
      get().updateReputation(regionId, REPUTATION_TUNABLES.HARVEST_REP_BASE * amount);
    }

    // Check harvest milestones
    const newCount = get().harvestTracking[cropId] ?? 0;
    const totalHarvests = get().getTotalHarvests();

    // Crop-specific milestones
    [10, 50, 100, 500, 1000].forEach((threshold) => {
      get().checkMilestone(`harvest_${cropId}_${threshold}`, newCount, threshold);
    });

    // Total harvest milestones
    [100, 1000, 10000, 100000].forEach((threshold) => {
      get().checkMilestone(`total_harvests_${threshold}`, totalHarvests, threshold);
    });
  },

  // ── trackBossDamage ──────────────────────────────────────
  trackBossDamage: (bossId, damage) => {
    set((state) => ({
      bossDamageTracking: {
        ...state.bossDamageTracking,
        [bossId]: (state.bossDamageTracking[bossId] ?? 0) + damage,
      },
    }));

    const totalDamage = get().bossDamageTracking[bossId] ?? 0;
    eventBus.emit('BOSS_DAMAGED', {
      bossId,
      damage,
      remainingHp: 0, // Will be calculated by caller
    });

    // Boss damage milestones
    [100, 1000, 10000, 100000].forEach((threshold) => {
      get().checkMilestone(`boss_damage_${bossId}_${threshold}`, totalDamage, threshold);
    });
  },

  // ── updateReputation ─────────────────────────────────────
  updateReputation: (regionId, delta) => {
    const prevRep = get().regionReputation[regionId] ?? 0;

    set((state) => {
      const current = state.regionReputation[regionId] ?? 0;
      const newRep = Math.max(
        REPUTATION_TUNABLES.MIN_REPUTATION,
        Math.min(REPUTATION_TUNABLES.MAX_REPUTATION, current + delta)
      );

      return {
        regionReputation: {
          ...state.regionReputation,
          [regionId]: newRep,
        },
        lastReputationUpdate: Date.now(),
      };
    });

    // Check reputation milestones
    const newRep = get().regionReputation[regionId] ?? 0;
    [50, 100, 250, 500, 1000].forEach((threshold) => {
      get().checkMilestone(`reputation_${regionId}_${threshold}`, newRep, threshold);
    });

    // Phase 2: trigger unlock pipeline evaluation (use actual applied delta)
    const appliedDelta = newRep - prevRep;
    eventBus.emit('REGION_REPUTATION_CHANGED', { regionId, reputation: newRep, delta: appliedDelta });
  },

  // ── decayReputation ──────────────────────────────────────
  decayReputation: (deltaSeconds) => {
    const hoursElapsed = deltaSeconds / 3600;
    const decayFactor = 1 - REPUTATION_TUNABLES.DECAY_RATE_PER_HOUR * hoursElapsed;

    if (decayFactor >= 1) return; // No decay needed

    set((state) => {
      const newReputation: Record<string, number> = {};
      for (const [regionId, rep] of Object.entries(state.regionReputation)) {
        newReputation[regionId] = Math.max(
          REPUTATION_TUNABLES.MIN_REPUTATION,
          rep * decayFactor
        );
      }
      return {
        regionReputation: newReputation,
        lastReputationUpdate: Date.now(),
      };
    });
  },

  // ── trackCrafting ────────────────────────────────────────
  trackCrafting: (recipeId, amount) => {
    set((state) => ({
      craftingTracking: {
        ...state.craftingTracking,
        [recipeId]: (state.craftingTracking[recipeId] ?? 0) + amount,
      },
    }));

    const newCount = get().craftingTracking[recipeId] ?? 0;
    [1, 10, 50, 100].forEach((threshold) => {
      get().checkMilestone(`craft_${recipeId}_${threshold}`, newCount, threshold);
    });
  },

  // ── checkMilestone ───────────────────────────────────────
  checkMilestone: (milestoneId, value, threshold) => {
    const { milestonesReached } = get();

    // Already reached
    if (milestonesReached[milestoneId]) return;

    // Not yet reached
    if (value < threshold) return;

    // Reached!
    set((state) => ({
      milestonesReached: {
        ...state.milestonesReached,
        [milestoneId]: Date.now(),
      },
    }));

    eventBus.emit('MILESTONE_REACHED', {
      milestoneType: milestoneId,
      value: threshold,
    });
  },

  // ── getHarvestCount ──────────────────────────────────────
  getHarvestCount: (cropId) => {
    return get().harvestTracking[cropId] ?? 0;
  },

  // ── getTotalHarvests ─────────────────────────────────────
  getTotalHarvests: () => {
    return Object.values(get().harvestTracking).reduce((a, b) => a + b, 0);
  },

  // ── getRegionReputation ──────────────────────────────────
  getRegionReputation: (regionId) => {
    return get().regionReputation[regionId] ?? 0;
  },
});
