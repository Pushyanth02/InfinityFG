import rulesData from '../../economy/live_ops_rules.json';
import { createStableId } from '../systems/time';

// Types mapping directly to the Live-Ops Analytics AI outputs
export interface LiveRule {
  rule_id: string;
  condition: string;
  action: {
    type: 'parameter_nudge' | 'event_trigger';
    target: string;
    adjustment?: string;
    reason: string;
  };
  rollback_condition: string;
  volatility_rating: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface TunableParameterContract {
  key: string;
  target_path: string;
  safe_range: number[];
  rollback_condition: string;
}

export interface FirstIterationMicroAdjustment {
  id: string;
  target: string;
  proposed_adjustment: string;
  hypothesis: string;
  guardrail_metric: string;
  rollback_condition: string;
}

export interface ExperimentProtocol {
  observation_window_hours: number;
  sample_cohorts: string[];
  success_targets: {
    D1_retention_min: number;
    D3_retention_min: number;
    avg_session_length_minutes_min: number;
  };
}

export interface LiveOpsRulesConfig {
  live_rules?: LiveRule[];
  tunable_parameter_registry?: TunableParameterContract[];
  kpi_dashboard_fields?: Array<keyof LiveTelemetrySummary>;
  first_iteration_micro_adjustments?: FirstIterationMicroAdjustment[];
  experiment_protocol?: ExperimentProtocol;
}

export interface ParameterPatch {
  patch_id: string;
  issued_by: string;
  timestamp: string;
  reason: string;
  changes: Array<{
    path: string;
    old_value: unknown;
    new_value: unknown;
  }>;
  rollback_conditions: string[];
  approved_by: string;
}

export interface LiveTelemetrySummary {
  DAU: number;
  D1_retention: number;
  D3_retention: number;
  avg_session_length_minutes: number;
  inflation_index: number;
  avg_coins_earned_per_day: number;
  prestige_rate_daily: number;
  region_dropoff_rate: number;
  avg_region_completion_minutes: number;
  idle_active_ratio: number;
  worker_usage_rate: number;
  machine_usage_rate: number;
  market_usage_rate: number;
  p50_prestige_hours: number;
  p90_prestige_hours: number;
}

export interface KPIDashboardSnapshot {
  region_dropoff_rate: number;
  avg_region_completion_minutes: number;
  idle_active_ratio: number;
  worker_usage_rate: number;
  machine_usage_rate: number;
  market_usage_rate: number;
  p50_prestige_hours: number;
  p90_prestige_hours: number;
  D1_retention: number;
  D3_retention: number;
  avg_session_length_minutes: number;
}

/**
 * Gatekeeper Engine
 * Evaluates telemetry against the live_ops_rules.json definition.
 * If a threshold is crossed, it auto-generates a safe, reversible ParameterPatch.
 */
export class LiveOpsGatekeeper {
  private readonly config: LiveOpsRulesConfig = rulesData as unknown as LiveOpsRulesConfig;
  private readonly rules: LiveRule[] = this.config.live_rules ?? [];
  private readonly tunableRegistry = new Map<string, TunableParameterContract>(
    (this.config.tunable_parameter_registry ?? []).map((entry) => [entry.key, entry])
  );
  private readonly dashboardFields: Array<keyof LiveTelemetrySummary> =
    this.config.kpi_dashboard_fields ?? [
      'region_dropoff_rate',
      'avg_region_completion_minutes',
      'idle_active_ratio',
      'worker_usage_rate',
      'machine_usage_rate',
      'market_usage_rate',
      'p50_prestige_hours',
      'p90_prestige_hours',
      'D1_retention',
      'D3_retention',
      'avg_session_length_minutes',
    ];

  public evaluateTelemetry(telemetry: LiveTelemetrySummary): ParameterPatch[] {
    const generatedPatches: ParameterPatch[] = [];

    for (const rule of this.rules) {
      if (!this.isActionContracted(rule)) {
        console.warn(`[LIVE OPS WARN] Rule ${rule.rule_id} target ${rule.action.target} is missing tunable contract.`);
        continue;
      }

      if (this.evaluateCondition(rule.condition, telemetry)) {
        console.log(`[LIVE OPS ALERT] Triggering rule: ${rule.rule_id}`);
        const patch = this.generatePatchFromAction(rule.action, rule.rollback_condition);
        generatedPatches.push(patch);
      }
    }

    return generatedPatches;
  }

  public getKPIDashboardSnapshot(telemetry: LiveTelemetrySummary): Record<string, number> {
    const snapshot: Record<string, number> = {};
    for (const field of this.dashboardFields) {
      snapshot[field] = telemetry[field] as number;
    }
    return snapshot;
  }

  public getTunableContracts(): TunableParameterContract[] {
    return Array.from(this.tunableRegistry.values());
  }

  public getFirstIterationMicroAdjustments(): FirstIterationMicroAdjustment[] {
    return this.config.first_iteration_micro_adjustments ?? [];
  }

  public getExperimentProtocol(): ExperimentProtocol | undefined {
    return this.config.experiment_protocol;
  }

  private evaluateCondition(conditionStr: string, telemetry: LiveTelemetrySummary): boolean {
    // Basic parser for rules like "inflation_index > 25"
    const match = conditionStr.match(/([a-zA-Z0-9_]+)\s*(>|<|>=|<=|==)\s*([0-9.]+)/);
    if (!match) return false;

    const [ , metricName, operator, valueStr ] = match;
    const value = parseFloat(valueStr);
    const metricVal = telemetry[metricName as keyof LiveTelemetrySummary];

    if (metricVal === undefined) return false;

    switch (operator) {
      case '>': return metricVal > value;
      case '<': return metricVal < value;
      case '>=': return metricVal >= value;
      case '<=': return metricVal <= value;
      case '==': return metricVal === value;
      default: return false;
    }
  }

  private isActionContracted(rule: LiveRule): boolean {
    if (rule.action.type !== 'parameter_nudge') return true;
    return this.tunableRegistry.has(rule.action.target);
  }

  private generatePatchFromAction(action: LiveRule['action'], rollbackCond: string): ParameterPatch {
    return {
      patch_id: createStableId('auto'),
      issued_by: 'LiveOps_AI',
      timestamp: new Date().toISOString(),
      reason: action.reason,
      changes: [
        {
          path: action.target,
          old_value: 'current (varies)',
          new_value: action.adjustment || 'trigger_event',
        }
      ],
      rollback_conditions: [rollbackCond],
      approved_by: 'PENDING_ADMIN',
    };
  }
}
