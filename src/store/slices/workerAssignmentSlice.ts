// ============================================================
// COZY GARDEN — Worker Assignment Slice
// Manages worker instances and their assignments.
// Provides computed bonuses for machines, regions, and plots.
// ============================================================

import type { StateCreator } from 'zustand';
import type { GameState } from '../../types/game';
import type {
  WorkerInstance,
  WorkerAssignment,
  MachineWorkerBonus,
  RegionWorkerBonus,
  PlotWorkerBonus,
  WorkerRole,
  WorkerTier,
} from '../../types/worker';
import {
  ROLE_BONUS_TEMPLATES,
  TIER_MULTIPLIERS,
  TIER_BASE_AURA,
  LEVEL_XP_REQUIREMENTS,
  getLevelMultiplier,
} from '../../types/worker';
import { getWorker } from '../../data/world';
import { getVillageFolkById } from '../../data/villageFolk';
import { eventBus } from '../../services/eventBus';

/**
 * Default empty bonuses.
 */
const EMPTY_MACHINE_BONUS: MachineWorkerBonus = {
  speedMultiplier: 0,
  yieldMultiplier: 0,
  maintenanceReduction: 0,
  wearReduction: 0,
  overclockBonus: 0,
};

const EMPTY_REGION_BONUS: RegionWorkerBonus = {
  productivityMultiplier: 0,
  rareCropChance: 0,
  weatherResistance: 0,
  reputationGain: 0,
};

const EMPTY_PLOT_BONUS: PlotWorkerBonus = {
  growthSpeed: 0,
  yieldBonus: 0,
  qualityChance: 0,
};

export interface WorkerAssignmentSlice {
  // ── State ────────────────────────────────────────────
  /** All worker instances owned by the player */
  workerInstances: WorkerInstance[];
  /** Trust meter per worker definition ID */
  workerTrust: Record<string, number>;
  /** Completed personal quests per worker */
  completedPersonalQuests: Record<string, string[]>;

  // ── Actions ──────────────────────────────────────────
  /** Create a new worker instance when hiring */
  createWorkerInstance: (workerId: string) => WorkerInstance | null;

  /** Assign a worker to a target */
  assignWorker: (instanceId: string, assignment: WorkerAssignment) => boolean;

  /** Unassign a worker (return to global aura) */
  unassignWorker: (instanceId: string) => void;

  /** Add experience to a worker */
  addWorkerExperience: (instanceId: string, xp: number) => void;
  /** Complete a personal quest and grant trust */
  completePersonalQuest: (workerId: string, questId: string) => void;

  /** Update worker mood */
  updateWorkerMood: (instanceId: string, delta: number) => void;

  // ── Computed Getters ─────────────────────────────────
  /** Get total global aura bonus from all workers */
  getGlobalAuraBonus: () => number;

  /** Get combined bonuses for a specific machine */
  getMachineBonuses: (machineId: string) => MachineWorkerBonus;

  /** Get combined bonuses for a specific region */
  getRegionBonuses: (regionId: string) => RegionWorkerBonus;

  /** Get combined bonuses for a specific plot */
  getPlotBonuses: (plotId: string) => PlotWorkerBonus;

  /** Get workers assigned to a specific machine */
  getWorkersOnMachine: (machineId: string) => WorkerInstance[];

  /** Get workers assigned to a specific region */
  getWorkersInRegion: (regionId: string) => WorkerInstance[];

  /** Get all unassigned workers */
  getUnassignedWorkers: () => WorkerInstance[];

  /** Get manager bonus multiplier (boosts other workers) */
  getManagerBonus: () => number;

  /** Get analyst bonus (sell price boost) */
  getAnalystBonus: () => number;
  /** Get trust value for a worker */
  getWorkerTrust: (workerId: string) => number;
  /** Get count of active workers by role */
  getRoleCounts: () => Partial<Record<WorkerRole, number>>;
}

/**
 * Generate unique instance ID.
 */
function generateInstanceId(): string {
  return `worker_inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get worker role from definition.
 */
function getWorkerRole(workerId: string): WorkerRole {
  const folk = getVillageFolkById(workerId);
  if (folk) {
    const roleMap: Record<string, WorkerRole> = {
      gardener: 'farmhand',
      engineer: 'engineer',
      scientist: 'scientist',
      trader: 'analyst',
      manager: 'manager',
      'biohacker': 'biohacker',
      'bio-hacker': 'biohacker',
    };
    return roleMap[folk.role.replace(/-/g, '').toLowerCase()] ?? 'intern';
  }

  const worker = getWorker(workerId);
  if (!worker) return 'intern';
  // Map existing role strings to WorkerRole type
  const roleMap: Record<string, WorkerRole> = {
    intern: 'intern',
    farmhand: 'farmhand',
    harvester: 'harvester',
    planter: 'planter',
    waterer: 'waterer',
    mechanic: 'mechanic',
    engineer: 'engineer',
    scientist: 'scientist',
    geneticist: 'geneticist',
    manager: 'manager',
    supervisor: 'supervisor',
    logistics: 'logistics',
    analyst: 'analyst',
    drone_pilot: 'drone_pilot',
    biohacker: 'biohacker',
    botanist: 'botanist',
  };
  return roleMap[worker.role.replace(/-/g, '').toLowerCase()] ?? 'intern';
}

/**
 * Get worker tier from definition.
 */
function getWorkerTier(workerId: string): WorkerTier {
  const folk = getVillageFolkById(workerId);
  if (folk) {
    if (folk.tier <= 1) return 'trainee';
    if (folk.tier === 2) return 'junior';
    if (folk.tier === 3) return 'senior';
    if (folk.tier === 4) return 'expert';
    return 'master';
  }

  const worker = getWorker(workerId);
  if (!worker) return 'trainee';
  const tierMap: Record<string, WorkerTier> = {
    trainee: 'trainee',
    junior: 'junior',
    senior: 'senior',
    expert: 'expert',
    master: 'master',
  };
  return tierMap[worker.tier.toLowerCase()] ?? 'trainee';
}

export const createWorkerAssignmentSlice: StateCreator<
  GameState,
  [],
  [],
  WorkerAssignmentSlice
> = (set, get) => ({
  workerInstances: [],
  workerTrust: {},
  completedPersonalQuests: {},

  // ── createWorkerInstance ─────────────────────────────────
  createWorkerInstance: (workerId) => {
    const worker = getWorker(workerId);
    const folk = getVillageFolkById(workerId);
    if (!worker && !folk) return null;

    const instance: WorkerInstance = {
      instanceId: generateInstanceId(),
      workerId,
      assignment: { type: 'global_aura' },
      level: 1,
      experience: 0,
      mood: 80, // Start with good mood
      hiredAt: Date.now(),
    };

    set((state) => ({
      workerInstances: [...state.workerInstances, instance],
    }));

    eventBus.emit('WORKER_HIRED', {
      workerId,
      workerName: folk?.name ?? worker?.name ?? 'Worker',
      cost: folk?.hireCost ?? worker?.hire_cost ?? 0,
    });

    return instance;
  },

  // ── completePersonalQuest ────────────────────────────────
  completePersonalQuest: (workerId, questId) => {
    const folk = getVillageFolkById(workerId);
    if (!folk) return;

    const completed = get().completedPersonalQuests[workerId] ?? [];
    if (completed.includes(questId)) return;

    const quest = folk.personalQuests.find((q) => q.id === questId);
    if (!quest) return;

    const prevTrust = get().workerTrust[workerId] ?? 0;

    set((state) => {
      const currentTrust = state.workerTrust[workerId] ?? 0;
      const nextTrust = Math.min(100, currentTrust + quest.trustReward);

      return {
        workerTrust: {
          ...state.workerTrust,
          [workerId]: nextTrust,
        },
        completedPersonalQuests: {
          ...state.completedPersonalQuests,
          [workerId]: [...(state.completedPersonalQuests[workerId] ?? []), questId],
        },
      };
    });

    const trustNow = get().workerTrust[workerId] ?? 0;
    const trustDelta = trustNow - prevTrust;

    // Phase 2: trigger unlock pipeline evaluation
    eventBus.emit('WORKER_TRUST_UPDATED', { workerId, trust: trustNow, delta: trustDelta });

    for (const unlock of folk.trust_unlocks) {
      if (trustNow >= unlock.trustThreshold) {
        eventBus.emit('CONTENT_UNLOCKED', {
          contentType: 'worker_trust_unlock',
          itemId: unlock.unlock,
          announcementText: `${folk.name} trust reached ${unlock.trustThreshold}: ${unlock.unlock}`,
        });
      }
    }
  },

  // ── assignWorker ─────────────────────────────────────────
  assignWorker: (instanceId, assignment) => {
    const instance = get().workerInstances.find((w) => w.instanceId === instanceId);
    if (!instance) return false;

    const role = getWorkerRole(instance.workerId);
    const template = ROLE_BONUS_TEMPLATES[role];

    // Check if this assignment type is allowed for this role
    if (!template.assignableTo.includes(assignment.type)) {
      eventBus.emit('CONTENT_UNLOCKED', {
        contentType: 'worker_assignment_failure',
        itemId: instanceId,
      });
      return false;
    }

    // Check machine type restrictions
    if (assignment.type === 'machine' && template.machineTypeRestrictions) {
      // Would need to check machine type - for now, allow all
    }

    set((state) => ({
      workerInstances: state.workerInstances.map((w) =>
        w.instanceId === instanceId ? { ...w, assignment } : w
      ),
    }));

    if (assignment.targetId) {
      eventBus.emit('WORKER_ASSIGNED', {
        instanceId,
        targetType: assignment.type,
        targetId: assignment.targetId,
      });
    }

    return true;
  },

  // ── unassignWorker ───────────────────────────────────────
  unassignWorker: (instanceId) => {
    set((state) => ({
      workerInstances: state.workerInstances.map((w) =>
        w.instanceId === instanceId
          ? { ...w, assignment: { type: 'global_aura' } }
          : w
      ),
    }));

    eventBus.emit('WORKER_UNASSIGNED', { instanceId });
  },

  // ── addWorkerExperience ──────────────────────────────────
  addWorkerExperience: (instanceId, xp) => {
    set((state) => {
      const instances = state.workerInstances.map((w) => {
        if (w.instanceId !== instanceId) return w;

        let newXp = w.experience + xp;
        let newLevel = w.level;

        // Check for level up
        while (
          newLevel < LEVEL_XP_REQUIREMENTS.length &&
          newXp >= LEVEL_XP_REQUIREMENTS[newLevel]
        ) {
          newXp -= LEVEL_XP_REQUIREMENTS[newLevel];
          newLevel++;

          eventBus.emit('WORKER_LEVELED', { instanceId, newLevel });
        }

        // Cap at max level
        if (newLevel >= LEVEL_XP_REQUIREMENTS.length) {
          newLevel = LEVEL_XP_REQUIREMENTS.length;
          newXp = 0;
        }

        return { ...w, experience: newXp, level: newLevel };
      });

      return { workerInstances: instances };
    });
  },

  // ── updateWorkerMood ─────────────────────────────────────
  updateWorkerMood: (instanceId, delta) => {
    set((state) => ({
      workerInstances: state.workerInstances.map((w) =>
        w.instanceId === instanceId
          ? { ...w, mood: Math.max(0, Math.min(100, w.mood + delta)) }
          : w
      ),
    }));
  },

  // ── getGlobalAuraBonus ───────────────────────────────────
  getGlobalAuraBonus: () => {
    const { workerInstances } = get();
    const managerBonus = get().getManagerBonus();

    let totalAura = 0;

    for (const instance of workerInstances) {
      const tier = getWorkerTier(instance.workerId);
      const tierMult = TIER_MULTIPLIERS[tier];
      const levelMult = getLevelMultiplier(instance.level);
      const moodMult = 0.5 + (instance.mood / 100) * 0.5; // 50-100% based on mood

      // Base aura from tier
      const baseAura = TIER_BASE_AURA[tier];

      // Retention when assigned (reduced aura)
      let retention = 1.0;
      if (instance.assignment.type !== 'global_aura') {
        retention = 0.3; // 30% aura when assigned
      }

      const effectiveAura = baseAura * tierMult * levelMult * moodMult * retention;
      totalAura += effectiveAura;
    }

    // Apply manager bonus
    return totalAura * (1 + managerBonus);
  },

  // ── getMachineBonuses ────────────────────────────────────
  getMachineBonuses: (machineId) => {
    const workersOnMachine = get().getWorkersOnMachine(machineId);
    const managerBonus = get().getManagerBonus();

    const bonus: MachineWorkerBonus = { ...EMPTY_MACHINE_BONUS };

    for (const instance of workersOnMachine) {
      const role = getWorkerRole(instance.workerId);
      const tier = getWorkerTier(instance.workerId);
      const template = ROLE_BONUS_TEMPLATES[role];
      const tierMult = TIER_MULTIPLIERS[tier];
      const levelMult = getLevelMultiplier(instance.level);
      const moodMult = 0.5 + (instance.mood / 100) * 0.5;
      const effectiveMult = tierMult * levelMult * moodMult * (1 + managerBonus);

      if (template.assignmentBonuses.machine) {
        const mb = template.assignmentBonuses.machine;
        bonus.speedMultiplier += (mb.speedMultiplier ?? 0) * effectiveMult;
        bonus.yieldMultiplier += (mb.yieldMultiplier ?? 0) * effectiveMult;
        bonus.maintenanceReduction += (mb.maintenanceReduction ?? 0) * effectiveMult;
        bonus.wearReduction += (mb.wearReduction ?? 0) * effectiveMult;
        bonus.overclockBonus += (mb.overclockBonus ?? 0) * effectiveMult;
      }
    }

    // Cap reductions at 90%
    bonus.maintenanceReduction = Math.min(0.9, bonus.maintenanceReduction);
    bonus.wearReduction = Math.min(0.9, bonus.wearReduction);

    return bonus;
  },

  // ── getRegionBonuses ─────────────────────────────────────
  getRegionBonuses: (regionId) => {
    const workersInRegion = get().getWorkersInRegion(regionId);
    const managerBonus = get().getManagerBonus();

    const bonus: RegionWorkerBonus = { ...EMPTY_REGION_BONUS };

    for (const instance of workersInRegion) {
      const role = getWorkerRole(instance.workerId);
      const tier = getWorkerTier(instance.workerId);
      const template = ROLE_BONUS_TEMPLATES[role];
      const tierMult = TIER_MULTIPLIERS[tier];
      const levelMult = getLevelMultiplier(instance.level);
      const moodMult = 0.5 + (instance.mood / 100) * 0.5;
      const effectiveMult = tierMult * levelMult * moodMult * (1 + managerBonus);

      if (template.assignmentBonuses.region) {
        const rb = template.assignmentBonuses.region;
        bonus.productivityMultiplier += (rb.productivityMultiplier ?? 0) * effectiveMult;
        bonus.rareCropChance += (rb.rareCropChance ?? 0) * effectiveMult;
        bonus.weatherResistance += (rb.weatherResistance ?? 0) * effectiveMult;
        bonus.reputationGain += (rb.reputationGain ?? 0) * effectiveMult;
      }
    }

    return bonus;
  },

  // ── getPlotBonuses ───────────────────────────────────────
  getPlotBonuses: (plotId) => {
    const { workerInstances } = get();
    const managerBonus = get().getManagerBonus();

    const bonus: PlotWorkerBonus = { ...EMPTY_PLOT_BONUS };

    const workersOnPlot = workerInstances.filter(
      (w) => w.assignment.type === 'plot' && w.assignment.targetId === plotId
    );

    for (const instance of workersOnPlot) {
      const role = getWorkerRole(instance.workerId);
      const tier = getWorkerTier(instance.workerId);
      const template = ROLE_BONUS_TEMPLATES[role];
      const tierMult = TIER_MULTIPLIERS[tier];
      const levelMult = getLevelMultiplier(instance.level);
      const moodMult = 0.5 + (instance.mood / 100) * 0.5;
      const effectiveMult = tierMult * levelMult * moodMult * (1 + managerBonus);

      if (template.assignmentBonuses.plot) {
        const pb = template.assignmentBonuses.plot;
        bonus.growthSpeed += (pb.growthSpeed ?? 0) * effectiveMult;
        bonus.yieldBonus += (pb.yieldBonus ?? 0) * effectiveMult;
        bonus.qualityChance += (pb.qualityChance ?? 0) * effectiveMult;
      }
    }

    return bonus;
  },

  // ── getWorkersOnMachine ──────────────────────────────────
  getWorkersOnMachine: (machineId) => {
    return get().workerInstances.filter(
      (w) => w.assignment.type === 'machine' && w.assignment.targetId === machineId
    );
  },

  // ── getWorkersInRegion ───────────────────────────────────
  getWorkersInRegion: (regionId) => {
    return get().workerInstances.filter(
      (w) => w.assignment.type === 'region' && w.assignment.targetId === regionId
    );
  },

  // ── getUnassignedWorkers ─────────────────────────────────
  getUnassignedWorkers: () => {
    return get().workerInstances.filter(
      (w) => w.assignment.type === 'global_aura'
    );
  },

  // ── getManagerBonus ──────────────────────────────────────
  getManagerBonus: () => {
    const { workerInstances } = get();
    let bonus = 0;

    for (const instance of workerInstances) {
      const role = getWorkerRole(instance.workerId);
      if (role !== 'manager') continue;

      const tier = getWorkerTier(instance.workerId);
      const tierMult = TIER_MULTIPLIERS[tier];
      const levelMult = getLevelMultiplier(instance.level);
      const moodMult = 0.5 + (instance.mood / 100) * 0.5;

      // Managers give +10% to all worker bonuses, scaled by tier/level
      bonus += 0.10 * tierMult * levelMult * moodMult;
    }

    return bonus;
  },

  // ── getAnalystBonus ──────────────────────────────────────
  getAnalystBonus: () => {
    const { workerInstances } = get();
    let bonus = 0;

    for (const instance of workerInstances) {
      const role = getWorkerRole(instance.workerId);
      if (role !== 'analyst') continue;

      const tier = getWorkerTier(instance.workerId);
      const tierMult = TIER_MULTIPLIERS[tier];
      const levelMult = getLevelMultiplier(instance.level);
      const moodMult = 0.5 + (instance.mood / 100) * 0.5;

      // Analysts give +10% sell price boost, scaled by tier/level
      bonus += 0.10 * tierMult * levelMult * moodMult;
    }

    return bonus;
  },

  // ── getWorkerTrust ───────────────────────────────────────
  getWorkerTrust: (workerId) => {
    return get().workerTrust[workerId] ?? 0;
  },

  // ── getRoleCounts ─────────────────────────────────────────
  getRoleCounts: () => {
    const counts: Partial<Record<WorkerRole, number>> = {};
    for (const instance of get().workerInstances) {
      const role = getWorkerRole(instance.workerId);
      counts[role] = (counts[role] ?? 0) + 1;
    }
    return counts;
  },
});
