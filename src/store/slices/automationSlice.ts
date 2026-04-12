// AgriEmpire — Automation Slice
import type { StateCreator } from 'zustand';
import type { GameState, AutomationSlice } from '../../types/game';
import { AUGMENTED_MACHINES } from '../../data/machine_upgrades';
import { WORKERS } from '../../data/world';
import { getVillageFolkById } from '../../data/villageFolk';
import { getMachineCost, getUpgradeCost, getWorkerCost } from '../../engine/mechanics';
import { evaluateRequirement } from '../../services/unlockService';
import { createStableId } from '../../systems/time';

export const createAutomationSlice: StateCreator<
  GameState,
  [],
  [],
  AutomationSlice
> = (set, get) => ({
  machines: [],
  workers: {},

  buyMachine: (machineId) => {
    const def = AUGMENTED_MACHINES.find(m => m.id === machineId);
    if (!def) return;

    const { machines, coins } = get();
    const currentCount = machines.find(m => m.machineId === machineId)?.count || 0;
    const cost = getMachineCost(def.baseCost, currentCount);
    
    if (coins < cost) return;

    set((state) => {
      const existing = state.machines.find(m => m.machineId === machineId);
      if (existing) {
        return {
          coins: state.coins - cost,
          machines: state.machines.map(m => m.machineId === machineId ? { ...m, count: m.count + 1 } : m)
        };
      } else {
          return {
            coins: state.coins - cost,
            machines: [...state.machines, {
            id: createStableId('pm'),
            machineId,
            count: 1,
            level: { speed: 0, yield: 0, durability: 0 },
            wear: 0,
            isBroken: false
          }]
        };
      }
    });
  },

  buyMachineUpgrade: (instanceId, branch) => {
    const { machines, coins } = get();
    const pm = machines.find(m => m.id === instanceId);
    if (!pm) return;
    const def = AUGMENTED_MACHINES.find(d => d.id === pm.machineId);
    if (!def) return;

    const level = pm.level[branch];
    const cost = getUpgradeCost(def.baseCost, level);
    if (coins < cost) return;

    set((state) => ({
      coins: state.coins - cost,
      machines: state.machines.map(m => m.id === instanceId ? {
        ...m,
        level: { ...m.level, [branch]: level + 1 }
      } : m)
    }));
  },

  buyWorker: (workerId) => {
    const folk = getVillageFolkById(workerId);
    const def = WORKERS.find(w => w.id === workerId);
    if (!def && !folk) return;

    const { workers, coins } = get();
    const currentCount = workers[workerId] || 0;

    if (folk) {
      const isUnlocked = evaluateRequirement(folk.unlockRequirement, {
        currentChapterId: get().currentChapterId,
        chapterProgress: get().chapterProgress,
        lifetimeCoins: get().lifetimeCoins,
        unlockedSkills: get().unlockedSkills,
        unlockedRegions: get().unlockedRegions,
        machines: get().machines,
        workers: get().workers,
        harvestTracking: get().harvestTracking,
        bossDamageTracking: get().bossDamageTracking,
        regionReputation: get().regionReputation,
        craftingTracking: get().craftingTracking,
      });
      if (!isUnlocked) return;

      if (!folk.repeatable && currentCount > 0) return;
    }

    const cost = folk
      ? Math.floor(folk.hireCost * Math.pow(2.2, currentCount))
      : getWorkerCost(def!.hire_cost, currentCount);
    if (coins < cost) return;

    set((state) => ({
      coins: state.coins - cost,
      workers: {
        ...state.workers,
        [workerId]: currentCount + 1
      }
    }));

    get().trackWorkerPurchase(workerId);
    // Also create an instance so role/assignment mechanics are active.
    get().createWorkerInstance(workerId);
  }
});
