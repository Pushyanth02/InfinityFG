// AgriEmpire — Meta Slice
import type { StateCreator } from 'zustand';
import type { GameState, MetaSlice } from '../../types/game';
import { SKILL_TREE } from '../../data/skills';

export const createMetaSlice: StateCreator<
  GameState,
  [],
  [],
  MetaSlice
> = (set, get) => ({
  unlockedCrops: ['crop_001'],
  unlockedRegions: ['region_01'],
  unlockedSkills: [],
  currentRegion: 'region_01',
  prestigePoints: 0,
  activePanel: 'farm',

  setPanel: (panel) => set({ activePanel: panel }),

  buySkill: (skillId) => {
    const { coins, unlockedSkills } = get();
    const skill = SKILL_TREE.find(s => s.id === skillId);
    
    if (!skill || unlockedSkills.includes(skillId) || coins < skill.cost) return;
    
    set((state) => ({
      coins: state.coins - skill.cost,
      unlockedSkills: [...state.unlockedSkills, skillId]
    }));
  },

  ascend: () => {
    const { lifetimeCoins, prestigePoints } = get();
    const potentialPoints = Math.floor(Math.sqrt(lifetimeCoins / 1e6));
    const gained = Math.max(0, potentialPoints - prestigePoints);
    
    if (gained <= 0) return;

    set(() => ({
      coins: 10,
      gems: 0,
      plots: Array.from({ length: 4 }, (_, i) => ({
        id: `plot_${i}`,
        cropId: null,
        plantedAt: null,
        growthProgress: 0,
        isReady: false
      })),
      machines: [],
      workers: {},
      unlockedCrops: ['crop_001'],
      unlockedRegions: ['region_01'],
      unlockedSkills: [],
      currentRegion: 'region_01',
      prestigePoints: prestigePoints + gained,
      activePanel: 'farm'
    }));
  }
});
