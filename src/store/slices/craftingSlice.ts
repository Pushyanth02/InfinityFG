import type { StateCreator } from 'zustand';
import type { GameState } from '../../types/game';
import { STORY_RECIPES } from '../../data/recipes';
import { CHAPTERS } from '../../data/chapters';
import { eventBus } from '../../services/eventBus';
import { AUGMENTED_MACHINES } from '../../data/machine_upgrades';
import { nowMs } from '../../systems/time';

export interface CraftQueueItem {
  recipeId: string;
  completeAt: number;
}

export interface CraftingSlice {
  craftedInventory: Record<string, number>;
  craftQueue: CraftQueueItem[];
  startCrafting: (recipeId: string) => void;
  claimCrafted: (itemId: string) => void;
  processCraftingQueue: (timestamp: number) => void;
  canCraftRecipe: (recipeId: string) => { ok: boolean; reason?: string };
}

function chapterNumberById(chapterId: string): number {
  return CHAPTERS.find((c) => c.id === chapterId)?.number ?? 1;
}

function hasRequiredStation(station: string, machines: GameState['machines']): boolean {
  const tierMatch = station.match(/tier(\d+)/i);
  const neededTier = tierMatch ? parseInt(tierMatch[1], 10) : 1;

  return machines.some((pm) => {
    const def = AUGMENTED_MACHINES.find((m) => m.id === pm.machineId);
    return !!def && def.tier >= neededTier;
  });
}

export const createCraftingSlice: StateCreator<GameState, [], [], CraftingSlice> = (
  set,
  get
) => ({
  craftedInventory: {},
  craftQueue: [],

  canCraftRecipe: (recipeId) => {
    const recipe = STORY_RECIPES.find((r) => r.recipe_id === recipeId);
    if (!recipe) return { ok: false, reason: 'Recipe not found' };

    const state = get();
    const chapterNumber = chapterNumberById(state.currentChapterId);

    if (recipe.unlockCondition.chapterMin && chapterNumber < recipe.unlockCondition.chapterMin) {
      return { ok: false, reason: `Reach Chapter ${recipe.unlockCondition.chapterMin}` };
    }

    if (recipe.unlockCondition.workerId) {
      const owned = (state.workers[recipe.unlockCondition.workerId] ?? 0) > 0;
      if (!owned) return { ok: false, reason: `Invite ${recipe.unlockCondition.workerId}` };

      const trustReq = recipe.unlockCondition.workerTrust ?? 0;
      const trustNow = state.getWorkerTrust(recipe.unlockCondition.workerId);
      if (trustNow < trustReq) {
        return { ok: false, reason: `Trust ${trustReq} required` };
      }
    }

    if (recipe.unlockCondition.requiredSkillId) {
      if (!state.unlockedSkills.includes(recipe.unlockCondition.requiredSkillId)) {
        return { ok: false, reason: `Requires skill ${recipe.unlockCondition.requiredSkillId}` };
      }
    }

    if (!hasRequiredStation(recipe.craftStation, state.machines)) {
      return { ok: false, reason: `Requires ${recipe.craftStation}` };
    }

    if (state.coins < recipe.costCoins) {
      return { ok: false, reason: 'Not enough coins' };
    }

    return { ok: true };
  },

  startCrafting: (recipeId) => {
    const recipe = STORY_RECIPES.find((r) => r.recipe_id === recipeId);
    if (!recipe) return;

    const can = get().canCraftRecipe(recipeId);
    if (!can.ok) return;

    const completeAt = nowMs() + recipe.craftTime_s * 1000;

    set((state) => ({
      coins: state.coins - recipe.costCoins,
      craftQueue: [...state.craftQueue, { recipeId, completeAt }],
    }));
  },

  processCraftingQueue: (timestamp) => {
    const queue = get().craftQueue;
    if (!queue.length) return;

    const done = queue.filter((q) => q.completeAt <= timestamp);
    if (!done.length) return;

    set((state) => {
      const nextInventory = { ...state.craftedInventory };
      for (const q of done) {
        const recipe = STORY_RECIPES.find((r) => r.recipe_id === q.recipeId);
        if (!recipe) continue;
        nextInventory[recipe.output.item] = (nextInventory[recipe.output.item] ?? 0) + 1;
      }

      return {
        craftedInventory: nextInventory,
        craftQueue: state.craftQueue.filter((q) => q.completeAt > timestamp),
      };
    });

    for (const q of done) {
      const recipe = STORY_RECIPES.find((r) => r.recipe_id === q.recipeId);
      if (!recipe) continue;

      // Phase 2: emit CRAFT_COMPLETED — triggers unlock pipeline evaluation
      eventBus.emit('CRAFT_COMPLETED', {
        recipeId: recipe.recipe_id,
        recipeName: recipe.name,
        outputItem: recipe.output.item,
      });

      eventBus.emit('CONTENT_UNLOCKED', {
        contentType: 'crafted_item',
        itemId: recipe.output.item,
        announcementText: `${recipe.name} is ready to deploy.`,
      });
    }
  },

  claimCrafted: (itemId) => {
    const count = get().craftedInventory[itemId] ?? 0;
    if (count <= 0) return;

    set((state) => ({
      craftedInventory: {
        ...state.craftedInventory,
        [itemId]: Math.max(0, (state.craftedInventory[itemId] ?? 0) - 1),
      },
    }));
  },
});
