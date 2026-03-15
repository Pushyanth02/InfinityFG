import { MACHINES } from '../src/data/machines';
import { createMachineInstance, tickMachine, startMachine } from '../src/engine/machineEngine';

const CROP_VALUE = 10;
const SIMULATION_HOURS = 24;
const TICK_SEC = 10;

console.log('🤖 Machine ROI & Diminishing Returns Validation\n');

for (const profile of ['casual', 'overclocker']) {
  console.log(`\n--- Profile: ${profile.toUpperCase()} ---`);
  
  // Pick a mid-tier harvester
  const machineDef = MACHINES.find(m => m.category === 'harvester' && m.tier === 3);
  if (!machineDef) throw new Error('Could not find generic T3 harvester');

  const instance = createMachineInstance('inst_01', machineDef.id);
  let totalCrops = 0;
  let totalMaintCost = 0;
  
  // Assign a level 5 worker
  instance.assignedWorkerLevel = 5;

  let timeActive = 0;
  let timeMaint = 0;

  for (let s = 0; s < SIMULATION_HOURS * 3600; s += TICK_SEC) {
    if (instance.state === 'idle') {
      startMachine(instance);
      if (profile === 'overclocker') {
         // Overclock hack for test:
         if (machineDef.overclockable) instance.state = 'overclocked';
      }
    }

    const { cropsProduced, maintenanceCost } = tickMachine(instance, machineDef, TICK_SEC);
    totalCrops += cropsProduced;
    totalMaintCost += maintenanceCost;
    
    if (instance.state === 'maintenance') timeMaint += TICK_SEC;
    else if (instance.state === 'active' || instance.state === 'overclocked') timeActive += TICK_SEC;
  }

  const grossRev = totalCrops * CROP_VALUE;
  const netRev = grossRev - totalMaintCost;
  const roiHours = netRev > 0 ? machineDef.baseCost / (netRev / SIMULATION_HOURS) : Infinity;

  console.log(`Machine: ${machineDef.name} (Base Cost: ${machineDef.baseCost})`);
  console.log(`Gross Rev: ${Math.round(grossRev)} | Maint. Cost: ${Math.round(totalMaintCost)}`);
  console.log(`Net Profit: ${Math.round(netRev)}`);
  console.log(`ROI Time: ${roiHours.toFixed(2)} hours`);
  console.log(`Uptime: ${((timeActive / (timeActive + timeMaint)) * 100).toFixed(1)}%`);
}

console.log('\n✅ Validation complete.');
