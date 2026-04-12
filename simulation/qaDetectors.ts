import type { CropDef } from './qaData';

// 0.05% chance per roll; tuned to keep random events rare and avoid false exploit positives.
const RANDOM_EVENT_TRIGGER_THRESHOLD = 0.9995;

export interface QaDetectorConfig {
  processingMultPerStage: number;
  processingFeeRatio: number;
  autoHarvestThreshold: number;
  machineCpsSoftCap: number;
}

export interface SimPlot {
  cropId: string;
  readyAt: number;
}

export function detectProcessorArbitrage(
  cropValue: number,
  processingCost: number,
  stage: number,
  cfg: QaDetectorConfig
): boolean {
  const netGain = cropValue * Math.pow(cfg.processingMultPerStage, stage) * (1 - cfg.processingFeeRatio) - processingCost;
  return netGain > cropValue * 20;
}

export function detectAutomationShortcut(automationLevel: number, timeSeconds: number, cfg: QaDetectorConfig): boolean {
  return automationLevel >= cfg.autoHarvestThreshold && timeSeconds < 180;
}

export function detectPrestigeAbuse(resetCount: number, prestigeDuration: number): boolean {
  return resetCount > 3 && prestigeDuration < 7200;
}

export function detectCpsSoftCapBypass(cps: number, cfg: QaDetectorConfig): boolean {
  return cps > cfg.machineCpsSoftCap * 1.5;
}

export function detectRebirthLoop(prestigeCount: number, sessionDuration: number): boolean {
  return prestigeCount > 10 && sessionDuration < 21600;
}

export function detectMachineStacking(machinesOwned: string[]): boolean {
  return machinesOwned.length > 20;
}

export function detectCropArbitrage(plots: SimPlot[], crops: CropDef[]): boolean {
  if (plots.length === 0) return false;

  // Flag only highly suspicious loops, not normal profitable crops.
  if (plots.length > 16) return true;

  for (const p of plots) {
    const crop = crops.find((c) => c.id === p.cropId);
    if (!crop) continue;

    const yieldValue = crop.baseValue * crop.yieldAmt;
    const profitRatio = yieldValue / Math.max(1, crop.seedCost);

    if (crop.growthSec <= 10 && profitRatio >= 25 && yieldValue >= 5000) {
      return true;
    }
  }

  return false;
}

export function shouldTriggerRandomEvent(rng: () => number): boolean {
  // Random events should be rare; this function represents a single event roll.
  return rng() > RANDOM_EVENT_TRIGGER_THRESHOLD;
}
