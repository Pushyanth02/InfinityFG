// ============================================================
// COZY GARDEN — Worker System Types
// Deep worker system with role mechanics and assignments.
// ============================================================

import type { UnlockMetadata } from './unlock';

/**
 * Worker roles define their functional specialization.
 * Each role has unique bonuses when assigned vs global aura.
 */
export type WorkerRole =
  | 'intern'         // Basic worker, small global aura only
  | 'farmhand'       // Manual harvest speed boost
  | 'harvester'      // Auto-harvester machine bonus
  | 'planter'        // Auto-planter machine bonus + crop growth
  | 'waterer'        // Waterer machine bonus + drought resistance
  | 'mechanic'       // Reduces machine maintenance/wear
  | 'engineer'       // Machine overclock bonus, reduced penalties
  | 'scientist'      // Rare crop discovery chance
  | 'geneticist'     // Crop mutation/hybrid chance
  | 'manager'        // Boosts other worker effectiveness
  | 'supervisor'     // Region productivity multiplier
  | 'logistics'      // Reduces processing chain time
  | 'analyst'        // Better sell prices, price prediction
  | 'drone_pilot'    // Drone machine bonus
  | 'biohacker'      // Weather resistance bonus
  | 'botanist';      // Legendary crop discovery chance

/**
 * Worker tiers represent experience/capability levels.
 */
export type WorkerTier =
  | 'trainee'   // Starting tier, lowest bonuses
  | 'junior'    // Mid tier
  | 'senior'    // High tier
  | 'expert'    // Very high tier (unlocked late)
  | 'master';   // Highest tier (endgame)

/**
 * Assignment types determine where a worker can be placed.
 */
export type AssignmentType =
  | 'global_aura'   // Not assigned, provides passive global bonus
  | 'machine'       // Assigned to a specific machine
  | 'region'        // Assigned to a specific region
  | 'plot';         // Assigned to a specific plot

/**
 * Worker assignment data.
 */
export interface WorkerAssignment {
  type: AssignmentType;
  targetId?: string;  // machineId, regionId, or plotId (undefined for global_aura)
}

/**
 * Bonuses workers provide when assigned to machines.
 */
export interface MachineWorkerBonus {
  speedMultiplier: number;          // +X to machine production speed
  yieldMultiplier: number;          // +X to machine output yield
  maintenanceReduction: number;     // -X to maintenance costs (0-1)
  wearReduction: number;            // -X to wear rate (0-1)
  overclockBonus: number;           // +X to overclock effectiveness
}

/**
 * Bonuses workers provide when assigned to regions.
 */
export interface RegionWorkerBonus {
  productivityMultiplier: number;   // +X to all production in region
  rareCropChance: number;           // +X% to rare crop discovery
  weatherResistance: number;        // +X% weather resistance
  reputationGain: number;           // +X% reputation gain rate
}

/**
 * Bonuses workers provide when assigned to plots.
 */
export interface PlotWorkerBonus {
  growthSpeed: number;              // +X% crop growth speed
  yieldBonus: number;               // +X% harvest yield
  qualityChance: number;            // +X% quality crop chance
}

/**
 * Extended worker definition with role mechanics.
 */
export interface ExtendedWorkerDef {
  id: string;
  name: string;
  emoji: string;
  role: WorkerRole;
  tier: WorkerTier;

  // Cost and unlock
  hireCost: number;
  unlockMetadata: UnlockMetadata;

  // Passive global aura (always active when hired, reduced when assigned)
  globalAura: {
    /** Base efficiency bonus added to production (e.g., 0.05 = +5%) */
    efficiency: number;
    /** Fraction of aura retained when worker is assigned (0 = none, 1 = full) */
    assignedRetention: number;
  };

  // Assignment-specific bonuses (only when assigned)
  assignmentBonuses: {
    machine?: Partial<MachineWorkerBonus>;
    region?: Partial<RegionWorkerBonus>;
    plot?: Partial<PlotWorkerBonus>;
  };

  // What this worker can be assigned to
  assignableTo: AssignmentType[];

  // Machine type restrictions (if assignable to machines)
  machineTypeRestrictions?: string[];  // e.g., ['harvester', 'planter']

  description: string;
  lore: string;
}

/**
 * Worker instance owned by player.
 * References a worker definition but has instance-specific state.
 */
export interface WorkerInstance {
  /** Unique instance ID */
  instanceId: string;

  /** References ExtendedWorkerDef.id */
  workerId: string;

  /** Current assignment */
  assignment: WorkerAssignment;

  /** Worker level (1-10), affects bonus magnitude */
  level: number;

  /** Experience points toward next level */
  experience: number;

  /** Worker mood (0-100), affects effectiveness */
  mood: number;

  /** Timestamp when worker was hired */
  hiredAt: number;
}

/**
 * Role-to-bonus mapping for quick lookup.
 * Defines the baseline bonuses for each role.
 */
export const ROLE_BONUS_TEMPLATES: Record<WorkerRole, {
  assignableTo: AssignmentType[];
  machineTypeRestrictions?: string[];
  assignmentBonuses: ExtendedWorkerDef['assignmentBonuses'];
}> = {
  intern: {
    assignableTo: ['global_aura'],
    assignmentBonuses: {},
  },
  farmhand: {
    assignableTo: ['global_aura', 'plot'],
    assignmentBonuses: {
      plot: { yieldBonus: 0.15, growthSpeed: 0.10 },
    },
  },
  harvester: {
    assignableTo: ['global_aura', 'machine'],
    machineTypeRestrictions: ['harvester'],
    assignmentBonuses: {
      machine: { speedMultiplier: 0.20, yieldMultiplier: 0.10 },
    },
  },
  planter: {
    assignableTo: ['global_aura', 'machine', 'plot'],
    machineTypeRestrictions: ['planter'],
    assignmentBonuses: {
      machine: { speedMultiplier: 0.15 },
      plot: { growthSpeed: 0.20 },
    },
  },
  waterer: {
    assignableTo: ['global_aura', 'machine', 'region'],
    machineTypeRestrictions: ['waterer'],
    assignmentBonuses: {
      machine: { speedMultiplier: 0.15 },
      region: { weatherResistance: 0.25 },
    },
  },
  mechanic: {
    assignableTo: ['global_aura', 'machine'],
    assignmentBonuses: {
      machine: { maintenanceReduction: 0.25, wearReduction: 0.20 },
    },
  },
  engineer: {
    assignableTo: ['global_aura', 'machine'],
    assignmentBonuses: {
      machine: { overclockBonus: 0.30, wearReduction: 0.10 },
    },
  },
  scientist: {
    assignableTo: ['global_aura', 'region'],
    assignmentBonuses: {
      region: { rareCropChance: 0.05 },
    },
  },
  geneticist: {
    assignableTo: ['global_aura', 'region'],
    assignmentBonuses: {
      region: { rareCropChance: 0.03, productivityMultiplier: 0.08 },
    },
  },
  manager: {
    assignableTo: ['global_aura'],
    assignmentBonuses: {},
    // Manager bonus is special: boosts other workers (handled in computation)
  },
  supervisor: {
    assignableTo: ['global_aura', 'region'],
    assignmentBonuses: {
      region: { productivityMultiplier: 0.15, reputationGain: 0.10 },
    },
  },
  logistics: {
    assignableTo: ['global_aura', 'machine'],
    machineTypeRestrictions: ['processor'],
    assignmentBonuses: {
      machine: { speedMultiplier: 0.20 },
    },
  },
  analyst: {
    assignableTo: ['global_aura'],
    assignmentBonuses: {},
    // Analyst bonus is special: sell price boost (handled in computation)
  },
  drone_pilot: {
    assignableTo: ['global_aura', 'machine'],
    machineTypeRestrictions: ['drone'],
    assignmentBonuses: {
      machine: { speedMultiplier: 0.25, yieldMultiplier: 0.15 },
    },
  },
  biohacker: {
    assignableTo: ['global_aura', 'region'],
    assignmentBonuses: {
      region: { weatherResistance: 0.30 },
    },
  },
  botanist: {
    assignableTo: ['global_aura', 'region'],
    assignmentBonuses: {
      region: { rareCropChance: 0.08, productivityMultiplier: 0.05 },
    },
  },
};

/**
 * Tier multipliers for scaling bonuses.
 */
export const TIER_MULTIPLIERS: Record<WorkerTier, number> = {
  trainee: 1.0,
  junior: 1.4,
  senior: 1.8,
  expert: 2.2,
  master: 2.8,
};

/**
 * Base efficiency aura by tier (before role adjustments).
 */
export const TIER_BASE_AURA: Record<WorkerTier, number> = {
  trainee: 0.05,
  junior: 0.08,
  senior: 0.12,
  expert: 0.16,
  master: 0.20,
};

/**
 * Experience required to reach each level.
 */
export const LEVEL_XP_REQUIREMENTS = [
  0,      // Level 1 (starting)
  100,    // Level 2
  300,    // Level 3
  600,    // Level 4
  1000,   // Level 5
  1500,   // Level 6
  2200,   // Level 7
  3000,   // Level 8
  4000,   // Level 9
  5500,   // Level 10 (max)
];

/**
 * Level multiplier for bonuses.
 */
export function getLevelMultiplier(level: number): number {
  return 1 + (level - 1) * 0.1; // +10% per level above 1
}
