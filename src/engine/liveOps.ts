import rulesData from '../../economy/live_ops_rules.json';

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
  avg_session_length_minutes: number;
  inflation_index: number;
  avg_coins_earned_per_day: number;
  prestige_rate_daily: number;
}

/**
 * Gatekeeper Engine
 * Evaluates telemetry against the live_ops_rules.json definition.
 * If a threshold is crossed, it auto-generates a safe, reversible ParameterPatch.
 */
export class LiveOpsGatekeeper {
  private rules: LiveRule[] = rulesData.live_rules as LiveRule[];

  public evaluateTelemetry(telemetry: LiveTelemetrySummary): ParameterPatch[] {
    const generatedPatches: ParameterPatch[] = [];

    for (const rule of this.rules) {
      if (this.evaluateCondition(rule.condition, telemetry)) {
        console.log(`[LIVE OPS ALERT] Triggering rule: ${rule.rule_id}`);
        const patch = this.generatePatchFromAction(rule.action, rule.rollback_condition);
        generatedPatches.push(patch);
      }
    }

    return generatedPatches;
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

  private generatePatchFromAction(action: LiveRule['action'], rollbackCond: string): ParameterPatch {
    return {
      patch_id: `auto_${Date.now()}`,
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
