// ============================================================
// COZY GARDEN — Tracking Slice
// Tracks lifetime statistics for unlock conditions.
// Harvest counts, boss damage, region reputation, etc.
// ============================================================

import type { StateCreator } from 'zustand';
import type { GameState } from '../../types/game';
import { eventBus } from '../../services/eventBus';
import { GAME_CONFIG } from '../../config/gameConfig';

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
  DECAY_RATE_PER_HOUR: GAME_CONFIG.REPUTATION_DECAY_RATE_PER_HOUR,

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

  // ── Balance Telemetry ───────────────────────────────
  /** Timestamp when current region/chapter timing started */
  regionStartedAt: number;
  /** Accumulated active time per region/chapter ID in seconds */
  timeInRegionSec: Record<string, number>;
  /** Number of prestige resets performed */
  prestigeCount: number;
  /** Deterministic cumulative playtime in seconds from tick deltas */
  totalPlayTimeSec: number;
  /** Rolling coins-per-minute telemetry samples */
  coinsPerMinuteSamples: number[];
  /** Worker purchases by workerId */
  workerPurchases: Record<string, number>;

  // ── Actions ──────────────────────────────────────────
  trackHarvest: (cropId: string, amount: number, regionId?: string) => void;
  trackBossDamage: (bossId: string, damage: number) => void;
  updateReputation: (regionId: string, delta: number) => void;
  decayReputation: (deltaSeconds: number) => void;
  trackCrafting: (recipeId: string, amount: number) => void;
  checkMilestone: (milestoneId: string, value: number, threshold: number) => void;
  trackCoinFlow: (coinDelta: number, deltaSeconds: number) => void;
  trackRegionTransition: (fromRegionId: string, toRegionId: string) => void;
  trackPrestige: () => void;
  trackWorkerPurchase: (workerId: string) => void;

  // ── Getters ──────────────────────────────────────────
  getHarvestCount: (cropId: string) => number;
  getTotalHarvests: () => number;
  getRegionReputation: (regionId: string) => number;
  getMostUsedCrops: (limit?: number) => Array<{ cropId: string; count: number }>;
  getWorkerPurchaseRatePerHour: () => number;
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
  regionStartedAt: Date.now(),
  timeInRegionSec: {},
  prestigeCount: 0,
  totalPlayTimeSec: 0,
  coinsPerMinuteSamples: [],
  workerPurchases: {},

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

  // ── trackCoinFlow ───────────────────────────────────────
  trackCoinFlow: (coinDelta, deltaSeconds) => {
    if (!Number.isFinite(coinDelta) || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;
    const coinsPerMinute = (coinDelta / deltaSeconds) * 60;
    set((state) => ({
      totalPlayTimeSec: state.totalPlayTimeSec + deltaSeconds,
      coinsPerMinuteSamples: [...state.coinsPerMinuteSamples, coinsPerMinute].slice(-240),
    }));
  },

  // ── trackRegionTransition ───────────────────────────────
  trackRegionTransition: (fromRegionId, toRegionId) => {
    if (!fromRegionId || !toRegionId || fromRegionId === toRegionId) return;
    const now = Date.now();
    const elapsedSec = Math.max(0, (now - get().regionStartedAt) / 1000);
    set((state) => ({
      regionStartedAt: now,
      timeInRegionSec: {
        ...state.timeInRegionSec,
        [fromRegionId]: (state.timeInRegionSec[fromRegionId] ?? 0) + elapsedSec,
      },
    }));
  },

  // ── trackPrestige ────────────────────────────────────────
  trackPrestige: () => {
    set((state) => ({
      prestigeCount: state.prestigeCount + 1,
    }));
  },

  // ── trackWorkerPurchase ──────────────────────────────────
  trackWorkerPurchase: (workerId) => {
    set((state) => ({
      workerPurchases: {
        ...state.workerPurchases,
        [workerId]: (state.workerPurchases[workerId] ?? 0) + 1,
      },
    }));
  },

  // ── getMostUsedCrops ─────────────────────────────────────
  getMostUsedCrops: (limit = 5) => {
    return Object.entries(get().harvestTracking)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([cropId, count]) => ({ cropId, count }));
  },

  // ── getWorkerPurchaseRatePerHour ─────────────────────────
  getWorkerPurchaseRatePerHour: () => {
    const totalPurchases = Object.values(get().workerPurchases).reduce((sum, value) => sum + value, 0);
    const elapsedHours = Math.max(1 / 60, get().totalPlayTimeSec / 3600);
    return totalPurchases / elapsedHours;
  },
});
