import type { MachineDef } from '../data/machines';

export type MachineState = 'idle' | 'active' | 'maintenance' | 'overclocked';

export interface MachineInstance {
  instanceId: string;
  machineId: string;
  state: MachineState;
  assignedWorkerLevel: number | null;
  wear: number; // 0.0 to 100.0
  maintenanceTimerSec: number;
}

export interface AutomationTelemetry {
  timestamp: number;
  instanceId: string;
  event: string;
  data: Record<string, unknown>;
  logText: string;
}

// ── Configuration ────────────────────────────────────────────────────────────
const CONFIG = {
  wearPerSecActive: 0.1, // 1000 seconds (~16.6 mins) to reach 100 wear natively
  baseMaintenanceDowntimeSec: 60,
  workerEfficiencyBoostPerLevel: 0.03, // 3% per worker level
};

// ── State Machine Actions ───────────────────────────────────────────────────

export function createMachineInstance(instanceId: string, machineId: string): MachineInstance {
  return {
    instanceId,
    machineId,
    state: 'idle',
    assignedWorkerLevel: null,
    wear: 0,
    maintenanceTimerSec: 0,
  };
}

export function assignWorker(inst: MachineInstance, workerLevel: number | null): AutomationTelemetry {
  inst.assignedWorkerLevel = workerLevel;
  return {
    timestamp: Date.now(),
    instanceId: inst.instanceId,
    event: 'WORKER_ASSIGNED',
    data: { workerLevel },
    logText: `Worker (Lv ${workerLevel ?? 'None'}) assigned to machine.`
  };
}

export function startMachine(inst: MachineInstance, minWear = 100): AutomationTelemetry | null {
  if (inst.wear >= minWear) return null; // Too worn to start
  if (inst.state === 'idle') {
    inst.state = 'active';
    return {
      timestamp: Date.now(),
      instanceId: inst.instanceId,
      event: 'STATE_CHANGE',
      data: { from: 'idle', to: 'active' },
      logText: `Machine ${inst.instanceId} started.`,
    };
  }
  return null;
}

export function stopMachine(inst: MachineInstance): AutomationTelemetry | null {
  if (inst.state === 'active' || inst.state === 'overclocked') {
    const old = inst.state;
    inst.state = 'idle';
    return {
      timestamp: Date.now(),
      instanceId: inst.instanceId,
      event: 'STATE_CHANGE',
      data: { from: old, to: 'idle' },
      logText: `Machine ${inst.instanceId} stopped.`,
    };
  }
  return null;
}

export function overclockMachine(inst: MachineInstance, def: MachineDef): AutomationTelemetry | null {
  if (!def.overclockable) {
    throw new Error(`Machine ${inst.machineId} cannot be overclocked.`);
  }
  if (inst.state === 'active') {
    inst.state = 'overclocked';
    return {
      timestamp: Date.now(),
      instanceId: inst.instanceId,
      event: 'STATE_CHANGE',
      data: { from: 'active', to: 'overclocked', mult: def.overclockEffects?.speedMultiplier },
      logText: `WARNING: Machine ${inst.instanceId} OVERCLOCKED. Wear rate critical.`,
    };
  }
  return null;
}

export function triggerMaintenance(inst: MachineInstance, isForced: boolean): AutomationTelemetry {
  const old = inst.state;
  inst.state = 'maintenance';
  inst.maintenanceTimerSec = CONFIG.baseMaintenanceDowntimeSec * (isForced ? 1.5 : 1.0); // Penalty for forcing it via 100% wear
  return {
    timestamp: Date.now(),
    instanceId: inst.instanceId,
    event: 'MAINTENANCE_STARTED',
    data: { from: old, forced: isForced },
    logText: isForced
      ? `CRITICAL: Machine ${inst.instanceId} broke down! Forced maintenance (${inst.maintenanceTimerSec}s).`
      : `Machine ${inst.instanceId} entering scheduled maintenance (${inst.maintenanceTimerSec}s).`,
  };
}

// ── Tick Logic ───────────────────────────────────────────────────────────────

export interface TickResult {
  cropsProduced: number;
  maintenanceCost: number;
  telemetry: AutomationTelemetry[];
}

export function tickMachine(inst: MachineInstance, def: MachineDef, tickSec: number): TickResult {
  const result: TickResult = { cropsProduced: 0, maintenanceCost: 0, telemetry: [] };

  if (inst.state === 'maintenance') {
    inst.maintenanceTimerSec -= tickSec;
    if (inst.maintenanceTimerSec <= 0) {
      inst.maintenanceTimerSec = 0;
      inst.wear = 0; // Fixed
      inst.state = 'idle';
      result.maintenanceCost = def.maintenanceCostPerHour * (CONFIG.baseMaintenanceDowntimeSec / 3600);
      result.telemetry.push({
        timestamp: Date.now(),
        instanceId: inst.instanceId,
        event: 'MAINTENANCE_FINISHED',
        data: { cost: result.maintenanceCost },
        logText: `Machine ${inst.instanceId} finished maintenance and is idle (-${Math.round(result.maintenanceCost)} coins).`,
      });
    }
    return result; // No production during maintenance
  }

  if (inst.state === 'active' || inst.state === 'overclocked') {
    // 1. Calculate production
    const workerMult = 1 + (inst.assignedWorkerLevel ?? 0) * CONFIG.workerEfficiencyBoostPerLevel;
    const overclockMult = inst.state === 'overclocked' ? (def.overclockEffects?.speedMultiplier ?? 1) : 1;
    // Base production is in crops per minute, convert to per tick
    const cropsPerSec = (def.productionRate.cropsPerMin / 60);
    
    result.cropsProduced = cropsPerSec * tickSec * workerMult * overclockMult * def.efficiencyCurve.level_1;

    // 2. Apply wear
    const wearSpeedMult = inst.state === 'overclocked' ? (def.overclockEffects?.wearRateMultiplier ?? 1) : 1;
    inst.wear += CONFIG.wearPerSecActive * tickSec * wearSpeedMult;

    // 3. Check for breakdown
    if (inst.wear >= 100) {
      inst.wear = 100;
      result.telemetry.push(triggerMaintenance(inst, true));
    }
  }

  return result;
}
