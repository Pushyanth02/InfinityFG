import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState } from '../types/game';
import { createResourceSlice } from './slices/resourceSlice';
import { createFarmSlice } from './slices/farmSlice';
import { createAutomationSlice } from './slices/automationSlice';
import { createMetaSlice } from './slices/metaSlice';
import { createStorySlice } from './slices/storySlice';
import { calculatePlotGrowth, calculateMachineProduction } from '../engine/mechanics';

export const useGameStore = create<GameState>()(
  persist(
    (set, get, ...args) => ({
      ...createResourceSlice(set, get, ...args),
      ...createFarmSlice(set, get, ...args),
      ...createAutomationSlice(set, get, ...args),
      ...createMetaSlice(set, get, ...args),
      ...createStorySlice(set, get, ...args),

      lastTick: Date.now(),

      tick: (timestamp: number) => {
        const { lastTick, plots, machines, workers, unlockedSkills } = get();
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
        const coinGain = calculateMachineProduction(machines, workers, delta, unlockedSkills, prestigePoints);

        set((state) => ({
          lastTick: timestamp,
          plots: nextPlots,
          coins: state.coins + coinGain,
          lifetimeCoins: state.lifetimeCoins + coinGain
        }));

        // 3. Check quest progress on every tick (for earn/deploy quests)
        get().checkQuestProgress();
      }
    }),
    {
      name: 'cozy-garden-save',
    }
  )
);

export { fmt } from '../engine/mechanics';
