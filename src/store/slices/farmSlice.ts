import type { StateCreator } from 'zustand';
import type { GameState, FarmSlice } from '../../types/game';
import { CROPS } from '../../data/crops';
import { getPlotCost, getSkillMultiplier } from '../../engine/mechanics';

export const createFarmSlice: StateCreator<
  GameState,
  [],
  [],
  FarmSlice
> = (set, get) => ({
  plots: Array.from({ length: 4 }, (_, i) => ({
    id: `plot_${i}`,
    cropId: null,
    plantedAt: null,
    growthProgress: 0,
    isReady: false
  })),

  plantCrop: (plotId, cropId) => {
    const { coins } = get();
    const crop = CROPS.find(c => c.id === cropId);
    if (!crop || coins < crop.seedCost) return;

    set((state) => ({
      coins: state.coins - crop.seedCost,
      plots: state.plots.map(p => p.id === plotId ? {
        ...p,
        cropId,
        plantedAt: Date.now(),
        growthProgress: 0,
        isReady: false
      } : p)
    }));
  },

  harvestCrop: (plotId) => {
    const { plots, unlockedSkills } = get();
    const plot = plots.find(p => p.id === plotId);
    if (!plot || !plot.isReady || !plot.cropId) return;

    const crop = CROPS.find(c => c.id === plot.cropId);
    if (!crop) return;

    const sellMultiplier = getSkillMultiplier(unlockedSkills, 'sell_multiplier');
    const manualYieldBonus = getSkillMultiplier(unlockedSkills, 'manual_yield');
    const totalReward = crop.baseValue * sellMultiplier * manualYieldBonus;

    const harvestedCropId = plot.cropId;

    set((state) => ({
      coins: state.coins + totalReward,
      lifetimeCoins: state.lifetimeCoins + totalReward,
      plots: state.plots.map(p => p.id === plotId ? {
        ...p,
        cropId: null,
        plantedAt: null,
        growthProgress: 0,
        isReady: false
      } : p)
    }));

    // 🗡️ Deal damage to the current chapter boss
    get().damageChapterBoss(harvestedCropId, crop.yield ?? 1);
    // ✅ Re-check narrative quest progress
    get().checkQuestProgress();
  },

  buyPlot: () => {
    const { plots, coins } = get();
    const cost = getPlotCost(plots.length);
    if (coins < cost) return;

    set((state) => ({
      coins: state.coins - cost,
      plots: [...state.plots, {
        id: `plot_${state.plots.length}`,
        cropId: null,
        plantedAt: null,
        growthProgress: 0,
        isReady: false
      }]
    }));
  }
});
