import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface SimulationTunables {
  upgradeScaleFactor: number;
  machineMultPerUnit: number;
  automationSlope: number;
  autoHarvestThreshold: number;
  prestigeDivisor: number;
  processingMultPerStage: number;
}

interface RootConfig {
  qa_integration?: {
    report_output_dir?: string;
  };
  economy?: {
    revenue_formula?: { tunables?: Array<{ knob?: string; current?: unknown }> };
    upgrade_cost_scaling?: { tunables?: Array<{ knob?: string; current?: unknown }> };
    automation_bonus?: { tunables?: Array<{ knob?: string; current?: unknown }> };
    prestige_formula?: { tunables?: Array<{ knob?: string; current?: unknown }> };
  };
  processing_chains?: {
    value_multiplier_per_stage?: { current?: unknown };
  };
}

const DEFAULTS: SimulationTunables = {
  upgradeScaleFactor: 1.15,
  machineMultPerUnit: 0.08,
  automationSlope: 0.12,
  autoHarvestThreshold: 4,
  prestigeDivisor: 8_000_000,
  processingMultPerStage: 2.3,
};

function toNumber(input: unknown): number | null {
  return typeof input === 'number' && Number.isFinite(input) ? input : null;
}

function getTunableCurrent(
  tunables: Array<{ knob?: string; current?: unknown }> | undefined,
  knob: string
): number | null {
  if (!tunables) return null;
  const found = tunables.find((entry) => entry.knob === knob);
  return toNumber(found?.current);
}

function loadRootConfig(): RootConfig {
  const configPath = path.resolve(__dirname, '../game_config.json');
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(raw) as RootConfig;
  } catch {
    return {};
  }
}

export function loadSimulationTunables(): SimulationTunables {
  const cfg = loadRootConfig();
  const upgradeScaleFactor =
    getTunableCurrent(cfg.economy?.upgrade_cost_scaling?.tunables, 'scale_factor') ??
    DEFAULTS.upgradeScaleFactor;
  const machineMultPerUnit =
    getTunableCurrent(cfg.economy?.revenue_formula?.tunables, 'machine_multiplier_per_unit') ??
    DEFAULTS.machineMultPerUnit;
  const automationSlope =
    getTunableCurrent(cfg.economy?.automation_bonus?.tunables, 'automation_slope') ??
    DEFAULTS.automationSlope;
  const autoHarvestThreshold =
    getTunableCurrent(cfg.economy?.automation_bonus?.tunables, 'auto_harvest_trigger_threshold') ??
    DEFAULTS.autoHarvestThreshold;
  const prestigeDivisor =
    getTunableCurrent(cfg.economy?.prestige_formula?.tunables, 'prestige_divisor') ??
    DEFAULTS.prestigeDivisor;
  const processingMultPerStage =
    toNumber(cfg.processing_chains?.value_multiplier_per_stage?.current) ??
    DEFAULTS.processingMultPerStage;

  return {
    upgradeScaleFactor,
    machineMultPerUnit,
    automationSlope,
    autoHarvestThreshold,
    prestigeDivisor,
    processingMultPerStage,
  };
}

export function getSimulationReportDir(): string {
  const cfg = loadRootConfig();
  const reportDir = cfg.qa_integration?.report_output_dir;
  if (typeof reportDir === 'string' && reportDir.trim().length > 0) {
    return path.resolve(__dirname, '..', reportDir);
  }
  return path.resolve(__dirname, 'reports');
}
