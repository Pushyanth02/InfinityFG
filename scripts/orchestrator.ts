import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🚀 Orchestrator AI — Starting Build Pipeline v1.0.0\n');

// ── Pipeline Definition ──────────────────────────────────────────────────────
const pipeline = [
  { step: 'generate_crops', cmd: 'npx tsx economy/generate_crops.ts', artifact: 'crop_catalog.json' },
  { step: 'generate_machines', cmd: 'npx tsx economy/generate_machines.ts', artifact: 'machine_catalog.json' },
  { step: 'generate_upgrades', cmd: 'npx tsx economy/generate_machine_upgrades.ts', artifact: 'augmented_machines.json' },
  { step: 'generate_progression', cmd: 'npx tsx economy/generate_progression.ts', artifact: 'progression_model.json' },
  { step: 'generate_world', cmd: 'npx tsx economy/generate_workers_regions.ts', artifact: 'workers.json' },
  { step: 'generate_narrative', cmd: 'npx tsx economy/generate_content.ts', artifact: 'narrative_content.json' },
  { step: 'run_roi_validation', cmd: 'npx tsx simulation/machine_roi_sim.ts', artifact: 'stdout' },
  { step: 'run_pacing_validation', cmd: 'npx tsx simulation/progression_sim.ts', artifact: 'stdout' },
  { step: 'run_simulation_qa', cmd: 'npx tsx simulation/qa_runner.ts --sessions 1000', artifact: 'sim_report' }
];

const apiContracts = [
  { name: "EconomyAPI", endpoint: "static/economy_model.json", schema: "Ref(game_config)" },
  { name: "AutomationAPI", endpoint: "static/automation_api.json", schema: "Ref(AutomationSystem)" },
  { name: "LiveOpsAPI", endpoint: "static/live_ops_rules.json", schema: "Ref(LiveOpsGatekeeper)" }
];

async function runPipeline() {
  const startTime = Date.now();
  let hasCriticalFailure = false;

  for (const task of pipeline) {
    console.log(`\n⏳ [STEP: ${task.step}] Running...`);
    try {
      // Execute step
      execSync(task.cmd, { cwd: rootDir, stdio: 'inherit' });
      console.log(`✅ [STEP: ${task.step}] Success. Produced: ${task.artifact}`);
    } catch {
      console.error(`❌ [STEP: ${task.step}] FAILED!`);
      hasCriticalFailure = true;
      break;
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n──────────────────────────────────────────────────');
  if (hasCriticalFailure) {
    console.error(`💥 BUILD PIPELINE FAILED after ${duration}s.`);
    console.error(`Remediation Steps:`);
    console.error(` 1. Check the logs above for the specific TypeScript/Simulation error.`);
    console.error(` 2. If Simulation QA failed, adjust parameters in game_config.json.`);
    console.error(` 3. Re-run 'npm run build:pipeline'`);
    process.exit(1);
  } else {
    console.log(`🎉 BUILD PIPELINE SUCCESS in ${duration}s.`);
    console.log(`📦 Artifacts packaged and validated via Simulation QA.`);
    
    // Output orchestration registry
    const orchestrationResult = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      pipeline,
      api_contracts: apiContracts,
      status: "SUCCESS"
    };

    fs.writeFileSync(
      path.join(rootDir, 'economy', 'orchestration_manifest.json'),
      JSON.stringify(orchestrationResult, null, 2)
    );
    console.log(`📝 Wrote orchestration_manifest.json`);
    process.exit(0);
  }
}

runPipeline();
