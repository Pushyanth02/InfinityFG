import { LiveOpsGatekeeper, LiveTelemetrySummary } from '../src/engine/liveOps';

const gatekeeper = new LiveOpsGatekeeper();

console.log('📡 [Live-Ops Analytics AI] Ingesting telemetry...');

// Scenario 1: Healthy
const healthyTelemetry: LiveTelemetrySummary = {
  DAU: 15200,
  D1_retention: 0.42,
  avg_session_length_minutes: 22.5,
  inflation_index: 8.4,
  avg_coins_earned_per_day: 150000,
  prestige_rate_daily: 0.02
};

console.log('\n--- Scenario 1: Healthy System ---');
const patches1 = gatekeeper.evaluateTelemetry(healthyTelemetry);
console.log(`Alerts fired: ${patches1.length}`);

// Scenario 2: High Inflation and Low Retention
const crisisTelemetry: LiveTelemetrySummary = {
  DAU: 12000,
  D1_retention: 0.28, // Below 0.35 threshold (Trigger retention boost)
  avg_session_length_minutes: 15.0,
  inflation_index: 32.1, // Above 25 threshold (Trigger inflation brake)
  avg_coins_earned_per_day: 4500000,
  prestige_rate_daily: 0.08 // Above 0.05 threshold (Trigger prestige throttle)
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

console.log('\n✅ Validation complete.');
