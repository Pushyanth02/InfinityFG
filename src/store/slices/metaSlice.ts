// AgriEmpire — Meta Slice
import type { StateCreator } from 'zustand';
import type { GameState, MetaSlice } from '../../types/game';
import {
  SKILL_TREE,
  getSkill,
  canPurchaseSkill,
  SKILL_POINT_CONFIG,
} from '../../data/skills';
import { evaluateRequirement } from '../../services/unlockService';
import { eventBus } from '../../services/eventBus';

export const createMetaSlice: StateCreator<
  GameState,
  [],
  [],
  MetaSlice
> = (set, get) => ({
  unlockedCrops: ['crop_001'],
  unlockedRegions: ['meadow'],
  unlockedSkills: [],
  chapterTokens: ['meadow_token'],
  skillPoints: {
    total: SKILL_POINT_CONFIG.POINTS_PER_CHAPTER,
    spent: 0,
    byTree: {},
  },
  currentRegion: 'meadow',
  prestigePoints: 0,
  activePanel: 'farm',

  setPanel: (panel) => set({ activePanel: panel }),

  grantChapterToken: (tokenId) => {
    if (get().chapterTokens.includes(tokenId)) return;
    set((state) => ({
      chapterTokens: [...state.chapterTokens, tokenId],
    }));
  },

  buySkill: (skillId) => {
    const { coins, unlockedSkills, skillPoints, chapterTokens } = get();
    const skill = SKILL_TREE.find(s => s.id === skillId);

    if (!skill || unlockedSkills.includes(skillId) || coins < skill.cost) return;

    const extendedSkill = getSkill(skillId);
    if (!extendedSkill) return;

    const purchaseCheck = canPurchaseSkill(skillId, unlockedSkills);
    if (!purchaseCheck.canPurchase) return;

    if (extendedSkill.chapterTokenRequired && !chapterTokens.includes(extendedSkill.chapterTokenRequired)) {
      return;
    }

    const unlockedByChapter = evaluateRequirement(
      extendedSkill.unlockMetadata.requirement,
      {
        currentChapterId: get().currentChapterId,
        chapterProgress: get().chapterProgress,
        lifetimeCoins: get().lifetimeCoins,
        unlockedSkills,
        unlockedRegions: get().unlockedRegions,
        machines: get().machines,
        workers: get().workers,
        harvestTracking: get().harvestTracking,
        bossDamageTracking: get().bossDamageTracking,
        regionReputation: get().regionReputation,
        craftingTracking: get().craftingTracking,
      }
    );
    if (!unlockedByChapter) return;

    const currentTreeSpend = skillPoints.byTree[extendedSkill.tree] ?? 0;
    if (skillPoints.spent + extendedSkill.pointCost > skillPoints.total) return;
    if (currentTreeSpend + extendedSkill.pointCost > SKILL_POINT_CONFIG.MAX_POINTS_PER_TREE) return;

    set((state) => ({
      coins: state.coins - skill.cost,
      unlockedSkills: [...state.unlockedSkills, skillId],
      skillPoints: {
        total: state.skillPoints.total,
        spent: state.skillPoints.spent + extendedSkill.pointCost,
        byTree: {
          ...state.skillPoints.byTree,
          [extendedSkill.tree]: (state.skillPoints.byTree[extendedSkill.tree] ?? 0) + extendedSkill.pointCost,
        },
      },
    }));

    eventBus.emit('SKILL_UNLOCKED', {
      skillId: extendedSkill.id,
      skillName: extendedSkill.name,
    });
  },

  ascend: () => {
    const { lifetimeCoins, prestigePoints, currentRegion } = get();
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
      unlockedRegions: ['meadow'],
      unlockedSkills: [],
      chapterTokens: ['meadow_token'],
      skillPoints: {
        total: SKILL_POINT_CONFIG.POINTS_PER_CHAPTER,
        spent: 0,
        byTree: {},
      },
      currentRegion: 'meadow',
      prestigePoints: prestigePoints + gained,
      activePanel: 'farm'
    }));
    get().trackPrestige();
    get().trackRegionTransition(currentRegion, 'meadow');
  }
});
