import { LiveOpsGatekeeper, LiveTelemetrySummary } from '../src/engine/liveOps';

const gatekeeper = new LiveOpsGatekeeper();

console.log('📡 [Live-Ops Analytics AI] Ingesting telemetry...');

// Scenario 1: Healthy
const healthyTelemetry: LiveTelemetrySummary = {
  DAU: 15200,
  D1_retention: 0.42,
  D3_retention: 0.24,
  avg_session_length_minutes: 22.5,
  inflation_index: 8.4,
  avg_coins_earned_per_day: 150000,
  prestige_rate_daily: 0.02,
  region_dropoff_rate: 0.21,
  avg_region_completion_minutes: 48,
  idle_active_ratio: 2.8,
  worker_usage_rate: 0.41,
  machine_usage_rate: 0.47,
  market_usage_rate: 0.34,
  p50_prestige_hours: 3.6,
  p90_prestige_hours: 7.8,
};

console.log('\n--- Scenario 1: Healthy System ---');
const patches1 = gatekeeper.evaluateTelemetry(healthyTelemetry);
console.log(`Alerts fired: ${patches1.length}`);
console.log(`KPI Dashboard: ${JSON.stringify(gatekeeper.getKPIDashboardSnapshot(healthyTelemetry))}`);

// Scenario 2: High Inflation and Low Retention
const crisisTelemetry: LiveTelemetrySummary = {
  DAU: 12000,
  D1_retention: 0.28, // Below 0.35 threshold (Trigger retention boost)
  D3_retention: 0.16,
  avg_session_length_minutes: 15.0,
  inflation_index: 32.1, // Above 25 threshold (Trigger inflation brake)
  avg_coins_earned_per_day: 4500000,
  prestige_rate_daily: 0.08, // Above 0.05 threshold (Trigger prestige throttle)
  region_dropoff_rate: 0.55,
  avg_region_completion_minutes: 104,
  idle_active_ratio: 4.4,
  worker_usage_rate: 0.22,
  machine_usage_rate: 0.27,
  market_usage_rate: 0.14,
  p50_prestige_hours: 1.3,
  p90_prestige_hours: 2.9,
};

console.log('\n--- Scenario 2: Multi-Factor Crisis ---');
const patches2 = gatekeeper.evaluateTelemetry(crisisTelemetry);
console.log(`Alerts fired: ${patches2.length}`);

patches2.forEach((p, idx) => {
  console.log(`\n📦 Parameter Patch [${idx + 1}]`);
  console.log(`Reason: ${p.reason}`);
  console.log(`Changes: ${JSON.stringify(p.changes)}`);
  console.log(`Rollback: ${p.rollback_conditions.join(', ')}`);
});

console.log(`\nTunable contracts loaded: ${gatekeeper.getTunableContracts().length}`);
console.log(`Iteration-1 micro-adjustments: ${gatekeeper.getFirstIterationMicroAdjustments().length}`);

console.log('\n✅ Validation complete.');
