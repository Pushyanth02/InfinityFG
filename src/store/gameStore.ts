import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState } from '../types/game';
import { createResourceSlice } from './slices/resourceSlice';
import { createFarmSlice } from './slices/farmSlice';
import { createAutomationSlice } from './slices/automationSlice';
import { createMetaSlice } from './slices/metaSlice';
import { createStorySlice } from './slices/storySlice';
import { createTrackingSlice } from './slices/trackingSlice';
import { createWorkerAssignmentSlice } from './slices/workerAssignmentSlice';
import { createCraftingSlice } from './slices/craftingSlice';
import { calculatePlotGrowth, calculateMachineProduction } from '../engine/mechanics';
import { calculateDPS } from '../engine/combatEngine';
import { getInfinityMultiplier } from '../engine/infinityEngine';
import { marketService } from '../services/marketService';
import { emitCoinsChanged } from '../services/gameEvents';
import { nowMs } from '../systems/time';

export const useGameStore = create<GameState>()(
  persist(
    (set, get, ...args) => ({
      ...createResourceSlice(set, get, ...args),
      ...createFarmSlice(set, get, ...args),
      ...createAutomationSlice(set, get, ...args),
      ...createMetaSlice(set, get, ...args),
      ...createStorySlice(set, get, ...args),
      ...createTrackingSlice(set, get, ...args),
      ...createWorkerAssignmentSlice(set, get, ...args),
      ...createCraftingSlice(set, get, ...args),

      lastTick: nowMs(),

      tick: (timestamp: number) => {
        const {
          lastTick,
          plots,
          machines,
          workers,
          unlockedSkills,
          getGlobalAuraBonus,
          getMachineBonuses,
          getRoleCounts,
          trackCoinFlow,
          tickBossCombatState,
          getBossProductionMultiplier,
        } = get();
        const deltaRaw = (timestamp - lastTick) / 1000;
        const delta = Number.isFinite(deltaRaw) ? Math.max(0, Math.min(5, deltaRaw)) : 0;
        tickBossCombatState(delta);

        // 1. Calculate Growth
        const nextPlots = plots.map(plot => {
          if (!plot.cropId || plot.isReady) return plot;
          const { nextProgress, isReady } = calculatePlotGrowth(
            plot.growthProgress, 
            plot.cropId, 
            delta,
            unlockedSkills
          );
          return { ...plot, growthProgress: nextProgress, isReady };
        });

        // 2. Calculate Automation Production
        const { prestigePoints } = get();
        const rawCoinGain = calculateMachineProduction(
          machines,
          workers,
          delta,
          unlockedSkills,
          prestigePoints,
          {
            getGlobalAuraBonus,
            getMachineBonuses,
            getRoleCounts,
          }
        );
        const bossProductionMult = getBossProductionMultiplier();
        const infinityBoost = getInfinityMultiplier(get().lifetimeCoins);
        const coinGain = rawCoinGain * infinityBoost * bossProductionMult;

        // Update market prices at most once per minute.
        if (marketService.getTimeSinceUpdate() >= 60_000) {
          marketService.updatePrices();
        }

        set((state) => ({
          lastTick: timestamp,
          plots: nextPlots,
          coins: state.coins + coinGain,
          lifetimeCoins: state.lifetimeCoins + coinGain
        }));

        // Phase 2: emit COINS_CHANGED so unlock pipeline can re-evaluate
        const { coins, lifetimeCoins } = get();
        trackCoinFlow(coinGain, delta);
        emitCoinsChanged({ coins, delta: coinGain, lifetimeCoins });

        // 3. Check quest progress on every tick (for earn/deploy quests)
          get().checkQuestProgress();
          const workerCount = Object.values(workers).reduce((sum, count) => sum + count, 0);
          const machineCount = machines.reduce((sum, m) => sum + m.count, 0);
          const uniquePlanted = new Set(
            nextPlots
              .map((p) => p.cropId)
              .filter((id): id is string => Boolean(id))
          ).size;

          const productionPerSec = delta > 0 ? coinGain / delta : 0;
          const diversityMult = 1 + Math.min(1, uniquePlanted * 0.1);
          const workerMult = 1 + Math.min(1, workerCount * 0.02);
          const machineMult = 1 + Math.min(2, machineCount * 0.03);
          const bossDps = calculateDPS(productionPerSec, diversityMult, workerMult, machineMult);
          get().tickChapterBoss(delta, bossDps * 0.05);

          get().processCraftingQueue(timestamp);
      }
    }),
    {
      name: 'cozy-garden-save',
    }
  )
);

export { fmt } from '../engine/mechanics';
