// ============================================================
// COZY GARDEN — Production Engine
// Consolidated production multiplier with 3 tunable knobs.
// Single source of truth for all multiplicative effects.
// ============================================================

/**
 * Tunable parameters for the production formula.
 * Each knob has safe ranges and can be adjusted for balancing.
 */
export interface ProductionTunables {
  // ── KNOB 1: Worker Balance ───────────────────────────────
  /** How much global worker aura contributes (default: 0.7) */
  AURA_WEIGHT: number;
  /** How much assigned worker bonus contributes (default: 1.5) */
  ASSIGNMENT_WEIGHT: number;

  // ── KNOB 2: Skill Balance ────────────────────────────────
  /** Maximum total skill multiplier (default: 2.0 = 200%) */
  SKILL_CAP: number;
  /** Decay factor for stacking skills (default: 0.85) */
  SKILL_STACKING_DECAY: number;

  // ── KNOB 3: Prestige Balance ─────────────────────────────
  /** Bonus per prestige point (default: 0.10 = +10%) */
  PRESTIGE_SCALE: number;
  /** Maximum prestige multiplier (default: 3.0 = 300%) */
  PRESTIGE_CAP: number;
}

/**
 * Default tunable values.
 * These are the starting balance points.
 */
export const DEFAULT_TUNABLES: ProductionTunables = {
  // Knob 1: Worker Balance
  AURA_WEIGHT: 0.7,       // Global aura is 70% effective
  ASSIGNMENT_WEIGHT: 1.5, // Assigned workers are 150% effective

  // Knob 2: Skill Balance
  SKILL_CAP: 2.0,              // Skills can at most double production
  SKILL_STACKING_DECAY: 0.85,  // Each additional skill is 15% less effective

  // Knob 3: Prestige Balance
  PRESTIGE_SCALE: 0.10, // Each prestige point = +10% production
  PRESTIGE_CAP: 3.0,    // Maximum 300% from prestige
};

/**
 * Safe ranges for each tunable parameter.
 * Used for validation and simulation bounds.
 */
export const TUNABLE_SAFE_RANGES: Record<keyof ProductionTunables, { min: number; max: number }> = {
  AURA_WEIGHT: { min: 0.3, max: 1.0 },
  ASSIGNMENT_WEIGHT: { min: 1.0, max: 2.5 },
  SKILL_CAP: { min: 1.5, max: 4.0 },
  SKILL_STACKING_DECAY: { min: 0.65, max: 0.95 },
  PRESTIGE_SCALE: { min: 0.05, max: 0.20 },
  PRESTIGE_CAP: { min: 2.0, max: 5.0 },
};

/**
 * Input values for the production multiplier calculation.
 */
export interface ProductionMultiplierInput {
  // ── Base Value ───────────────────────────────────────────
  /** Base production value before multipliers */
  baseValue: number;

  // ── Worker Contribution ──────────────────────────────────
  /** Sum of efficiency bonuses from unassigned workers */
  globalAuraBonus: number;
  /** Specific assignment bonus for this production context */
  assignmentBonus: number;

  // ── Skill Contribution ───────────────────────────────────
  /** Array of relevant skill bonus values */
  skillBonuses: number[];

  // ── Prestige Contribution ────────────────────────────────
  /** Current prestige points */
  prestigePoints: number;

  // ── Fixed Modifiers (not tunable) ────────────────────────
  /** Region multiplier (1.0-6.5x) */
  regionMultiplier: number;
  /** Weather multiplier (0.5-2.0x) */
  weatherMultiplier: number;
  /** Equipment multiplier (crop weapons, etc.) */
  equipmentMultiplier: number;
}

/**
 * Breakdown of how each component contributes to the final multiplier.
 */
export interface ProductionBreakdown {
  workerMult: number;
  skillMult: number;
  prestigeMult: number;
  fixedMult: number;
  finalMult: number;
}

/**
 * Calculates the consolidated production multiplier.
 * This is the single formula that combines all multiplicative effects.
 *
 * Formula:
 *   final = base * (1 + workerBonus + skillBonus) * prestigeMult * fixedMult
 *
 * Where:
 *   workerBonus = softcap(auraBonus * AURA_WEIGHT + assignmentBonus * ASSIGNMENT_WEIGHT)
 *   skillBonus = softcap(sum(skills * 0.85^idx))
 *   prestigeMult = min(1 + ln(1 + prestigePoints) * PRESTIGE_SCALE, PRESTIGE_CAP)
 *   fixedMult = region * weather * softcap(equipment)
 */
export function calculateProductionMultiplier(
  input: ProductionMultiplierInput,
  tunables: ProductionTunables = DEFAULT_TUNABLES
): number {
  const breakdown = getProductionBreakdown(input, tunables);
  return input.baseValue * breakdown.finalMult;
}

/**
 * Gets the full breakdown of the production multiplier.
 * Useful for UI display and debugging.
 */
export function getProductionBreakdown(
  input: ProductionMultiplierInput,
  tunables: ProductionTunables = DEFAULT_TUNABLES
): ProductionBreakdown {
  const softcap = (value: number, knee: number, softness: number): number => {
    if (value <= knee) return value;
    return knee + Math.log1p((value - knee) * softness) / softness;
  };

  // === KNOB 1: Worker Contribution ===
  const workerRaw =
    input.globalAuraBonus * tunables.AURA_WEIGHT +
    input.assignmentBonus * tunables.ASSIGNMENT_WEIGHT;
  const workerMult = 1 + softcap(Math.max(0, workerRaw), 1.5, 1.0);

  // === KNOB 2: Skill Contribution ===
  // Sort skills by value (highest first) and apply stacking decay
  const sortedSkills = [...input.skillBonuses].sort((a, b) => b - a);
  let skillTotal = 0;
  for (let i = 0; i < sortedSkills.length; i++) {
    const decayFactor = Math.pow(tunables.SKILL_STACKING_DECAY, i);
    skillTotal += sortedSkills[i] * decayFactor;
  }
  const skillMult = Math.min(1 + softcap(Math.max(0, skillTotal), 0.8, 1.1), tunables.SKILL_CAP);

  // === KNOB 3: Prestige Contribution ===
  const prestigeMult = Math.min(
    1 + Math.log1p(Math.max(0, input.prestigePoints)) * tunables.PRESTIGE_SCALE,
    tunables.PRESTIGE_CAP
  );

  // === Fixed Modifiers (not tunable) ===
  const equipmentEffective = 1 + Math.log1p(Math.max(0, input.equipmentMultiplier - 1) * 2) / 2;
  const fixedMult =
    input.regionMultiplier * input.weatherMultiplier * equipmentEffective;

  // === Final Multiplier ===
  const additiveGrowth = (workerMult - 1) + (skillMult - 1);
  const finalMult = (1 + additiveGrowth) * prestigeMult * fixedMult;

  return {
    workerMult,
    skillMult,
    prestigeMult,
    fixedMult,
    finalMult,
  };
}

/**
 * Simulates production with different configurations.
 * Useful for balance testing and what-if analysis.
 */
export function simulateProduction(
  base: number,
  workerConfig: { aura: number; assigned: number },
  skills: number[],
  prestige: number,
  fixed: { region: number; weather: number; equipment: number },
  customTunables?: Partial<ProductionTunables>
): { production: number; breakdown: ProductionBreakdown } {
  const tunables = { ...DEFAULT_TUNABLES, ...customTunables };

  const input: ProductionMultiplierInput = {
    baseValue: base,
    globalAuraBonus: workerConfig.aura,
    assignmentBonus: workerConfig.assigned,
    skillBonuses: skills,
    prestigePoints: prestige,
    regionMultiplier: fixed.region,
    weatherMultiplier: fixed.weather,
    equipmentMultiplier: fixed.equipment,
  };

  const breakdown = getProductionBreakdown(input, tunables);

  return {
    production: calculateProductionMultiplier(input, tunables),
    breakdown,
  };
}

/**
 * Validates that tunables are within safe ranges.
 */
export function validateTunables(tunables: ProductionTunables): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const [key, value] of Object.entries(tunables)) {
    const range = TUNABLE_SAFE_RANGES[key as keyof ProductionTunables];
    if (value < range.min || value > range.max) {
      errors.push(`${key} = ${value} is outside safe range [${range.min}, ${range.max}]`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================
// SPECIALIZED CALCULATORS
// ============================================================

/**
 * Calculates manual harvest production value.
 */
export function calculateManualHarvestValue(
  baseCropValue: number,
  input: Omit<ProductionMultiplierInput, 'baseValue'>
): number {
  return calculateProductionMultiplier({ ...input, baseValue: baseCropValue });
}

/**
 * Calculates machine production per second.
 */
export function calculateMachineProductionRate(
  baseCPS: number,
  machineSpeedBonus: number,
  input: Omit<ProductionMultiplierInput, 'baseValue'>
): number {
  // Apply machine-specific speed bonus first
  const adjustedCPS = baseCPS * (1 + machineSpeedBonus);
  return calculateProductionMultiplier({ ...input, baseValue: adjustedCPS });
}

/**
 * Calculates sell price after all modifiers.
 */
export function calculateSellPrice(
  basePrice: number,
  sellMultiplierBonus: number,
  analystBonus: number,
  marketPriceMultiplier: number
): number {
  return basePrice * (1 + sellMultiplierBonus) * (1 + analystBonus) * marketPriceMultiplier;
}

// ============================================================
// SIMULATION TARGETS (for QA testing)
// ============================================================

/**
 * Target production rates at various game phases.
 * Used for balance verification.
 */
export const PRODUCTION_TARGETS = {
  /** Early game (0-30 min): ~10 coins/sec */
  EARLY_GAME_CPS: 10,

  /** Mid game (30 min - 2 hr): ~100 coins/sec */
  MID_GAME_CPS: 100,

  /** Late game (2-8 hr): ~1,000 coins/sec */
  LATE_GAME_CPS: 1000,

  /** Endgame (8+ hr): ~10,000 coins/sec */
  ENDGAME_CPS: 10000,

  /** Post-prestige scaling: 1.5x per prestige */
  PRESTIGE_SCALING: 1.5,
};

/**
 * Maximum reasonable multiplier values (sanity checks).
 */
export const MAX_MULTIPLIERS = {
  WORKER_MULT: 3.0,    // Max 300% from workers
  SKILL_MULT: 2.0,     // Max 200% from skills (capped)
  PRESTIGE_MULT: 3.0,  // Max 300% from prestige (capped)
  REGION_MULT: 6.5,    // Max 650% from regions
  WEATHER_MULT: 2.0,   // Max 200% from weather
  EQUIPMENT_MULT: 10.0, // Max 1000% from equipment

  // Combined theoretical maximum (for inflation testing)
  THEORETICAL_MAX: 3.0 * 2.0 * 3.0 * 6.5 * 2.0 * 10.0, // = 2,340x
};
