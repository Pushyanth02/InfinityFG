// AgriEmpire — Automation Slice
import type { StateCreator } from 'zustand';
import type { GameState, AutomationSlice } from '../../types/game';
import { AUGMENTED_MACHINES } from '../../data/machine_upgrades';
import { WORKERS } from '../../data/world';
import { getMachineCost, getUpgradeCost, getWorkerCost } from '../../engine/mechanics';

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
            id: `pm_${Date.now()}`,
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
    const def = WORKERS.find(w => w.id === workerId);
    if (!def) return;

    const { workers, coins } = get();
    const currentCount = workers[workerId] || 0;
    const cost = getWorkerCost(def.hire_cost, currentCount);
    if (coins < cost) return;

    set((state) => ({
      coins: state.coins - cost,
      workers: {
        ...state.workers,
        [workerId]: currentCount + 1
      }
    }));
  }
});
