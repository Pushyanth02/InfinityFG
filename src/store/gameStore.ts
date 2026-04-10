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
import { marketService } from '../services/marketService';
import { emitCoinsChanged } from '../services/gameEvents';

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

      lastTick: Date.now(),

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
        } = get();
        const delta = (timestamp - lastTick) / 1000;

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
        const coinGain = calculateMachineProduction(
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
        get().processCraftingQueue(timestamp);
      }
    }),
    {
      name: 'cozy-garden-save',
    }
  )
);

export { fmt } from '../engine/mechanics';
