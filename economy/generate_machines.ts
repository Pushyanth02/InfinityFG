import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Types ────────────────────────────────────────────────────────────────────
type MachineCategory = 'planter' | 'waterer' | 'harvester' | 'processor' | 'drone';

interface MachineDef {
  machine_id: string;
  name: string;
  category: MachineCategory;
  tier: number;
  base_cost: number;
  production_rate: { crops_per_min: number };
  efficiency_curve: {
    level_1: number;
    level_5: number;
    level_10: number;
  };
  maintenance_cost_per_hour: number;
  overclockable: boolean;
  overclock_effects?: {
    speed_multiplier: number;
    wear_rate_multiplier: number;
  };
  description: string;
}

// ── Configuration ────────────────────────────────────────────────────────────
const CONFIG = {
  num_machines: 50, // 10 per category
  categories: ['planter', 'waterer', 'harvester', 'processor', 'drone'] as MachineCategory[],
  tier_distribution: [
    { max: 10, tier: 1 },
    { max: 20, tier: 2 },
    { max: 35, tier: 3 },
    { max: 45, tier: 4 },
    { max: 50, tier: 5 },
  ],
};

// ── Mulberry32 PRNG (Deterministic) ──────────────────────────────────────────
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}
const rng = mulberry32(1337);

function randRange(min: number, max: number): number {
  return min + rng() * (max - min);
}

function randChoice<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function roundToSignificant(num: number, sig: number): number {
  if (num === 0) return 0;
  const mult = Math.pow(10, sig - Math.floor(Math.log10(Math.abs(num))) - 1);
  return Math.round(num * mult) / mult;
}

// ── Naming dictionaries ──────────────────────────────────────────────────────
const PREFIXES = {
  planter: ['Seed', 'Soil', 'Root', 'Furrow', 'Terra'],
  waterer: ['Aqua', 'Hydro', 'Mist', 'Irrig', 'Flow'],
  harvester: ['Crop', 'Reap', 'Yield', 'Scythe', 'Gather'],
  processor: ['Mill', 'Refine', 'Crush', 'Blend', 'Synth'],
  drone: ['Aero', 'Hexa', 'Opti', 'Swift', 'Sky'],
};
const SUFFIXES = ['Tron', 'Matic', 'Max', 'Tech', 'Bot', 'Core', 'Forge', 'Sync'];

function generateName(category: MachineCategory, tier: number): string {
  const pfx = randChoice(PREFIXES[category]);
  const sfx = randChoice(SUFFIXES);
  const version = randChoice([
    `${tier}00`, `${tier}000`, `v${tier}.0`, `Mk ${tier}`, `X${tier}`, `Pro`
  ]);
  return `${pfx}-${sfx} ${version}`;
}

// ── Generation Logic ─────────────────────────────────────────────────────────
const machines: MachineDef[] = [];

// Generate 10 machines per category
for (let c = 0; c < CONFIG.categories.length; c++) {
  const category = CONFIG.categories[c];
  for (let i = 0; i < 10; i++) {
    const totalIndex = c * 10 + i;
    const tier = CONFIG.tier_distribution.find(d => totalIndex < d.max)?.tier || 5;
    
    // Base math: 
    // T1: 50 - 500 coins. T5: 50,000 - 500,000 coins.
    const baseCostRaw = Math.pow(10, tier) * randRange(0.5, 5);
    const baseCost = roundToSignificant(baseCostRaw, 2);
    
    // Production rate (crops/min)
    const baseProd = Math.pow(2.2, tier) * randRange(0.8, 1.2) * (category === 'drone' ? 0.5 : 1);
    const cropsPerMin = Math.max(1, Math.round(baseProd));
    
    // Maintenance approx 1-3% of cost per hour
    const maintCostRaw = baseCost * randRange(0.01, 0.03);
    const maintCost = Math.max(1, Math.round(maintCostRaw));

    // Overclocking
    const overclockable = rng() > 0.3; // 70% chance to be overclockable
    const speedMult = overclockable ? roundToSignificant(randRange(1.3, 2.0), 2) : 1;
    const wearMult = overclockable ? roundToSignificant(speedMult * randRange(1.2, 1.8), 2) : 1;

    // Efficiency curve (scales with level 1-10)
    const eff5 = roundToSignificant(randRange(1.4, 2.0), 2);
    const eff10 = roundToSignificant(eff5 * randRange(1.3, 1.8), 2);

    const descLines = [
      category === 'planter' ? 'Automates seed sowing.' :
      category === 'waterer' ? 'Maintains optimal soil moisture.' :
      category === 'harvester' ? 'Harvests mature crops efficiently.' :
      category === 'processor' ? 'Converts raw crops into high-value goods.' :
      'Autonomous aerial farm maintenance.',
      `Tier ${tier} technology.`,
      overclockable ? 'Supports dangerous overclocking.' : 'Stable design, cannot be overclocked.'
    ];

    machines.push({
      machine_id: `mach_${category.substring(0,4)}_${String(tier)}_${String(i).padStart(2, '0')}`,
      name: generateName(category, tier),
      category,
      tier,
      base_cost: baseCost,
      production_rate: { crops_per_min: cropsPerMin },
      efficiency_curve: {
        level_1: 1.0,
        level_5: eff5,
        level_10: eff10,
      },
      maintenance_cost_per_hour: maintCost,
      overclockable,
      ...(overclockable ? {
        overclock_effects: {
          speed_multiplier: speedMult,
          wear_rate_multiplier: wearMult,
        }
      } : {}),
      description: descLines.join(' '),
    });
  }
}

// ── Output ───────────────────────────────────────────────────────────────────
const outDir = path.join(__dirname, '../src/data_exports');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// JSON Output
fs.writeFileSync(
  path.join(outDir, 'machine_catalog.json'),
  JSON.stringify(machines, null, 2)
);

// TypeScript Data Output
const tsDataOut = path.join(__dirname, '../src/data/machines.ts');
const tsContent = `// Auto-generated by economy/generate_machines.ts
export type MachineCategory = 'planter' | 'waterer' | 'harvester' | 'processor' | 'drone';

export interface MachineDef {
  id: string;
  name: string;
  category: MachineCategory;
  tier: number;
  baseCost: number;
  productionRate: { cropsPerMin: number };
  efficiencyCurve: { level_1: number; level_5: number; level_10: number };
  maintenanceCostPerHour: number;
  overclockable: boolean;
  overclockEffects?: { speedMultiplier: number; wearRateMultiplier: number };
  description: string;
}

export const MACHINES: MachineDef[] = ${JSON.stringify(
  machines.map(m => ({
    id: m.machine_id,
    name: m.name,
    category: m.category,
    tier: m.tier,
    baseCost: m.base_cost,
    productionRate: { cropsPerMin: m.production_rate.crops_per_min },
    efficiencyCurve: m.efficiency_curve,
    maintenanceCostPerHour: m.maintenance_cost_per_hour,
    overclockable: m.overclockable,
    overclockEffects: m.overclock_effects ? {
      speedMultiplier: m.overclock_effects.speed_multiplier,
      wearRateMultiplier: m.overclock_effects.wear_rate_multiplier,
    } : undefined,
    description: m.description,
  })),
  null,
  2
).replace(/"([^"]+)":/g, '$1:')}; // Remove quotes from keys for cleaner TS

export const getMachine = (id: string): MachineDef | undefined => MACHINES.find(m => m.id === id);
export const getMachinesByCategory = (cat: MachineCategory): MachineDef[] => MACHINES.filter(m => m.category === cat);
`;

const srcDataDir = path.join(__dirname, '../src/data');
if (!fs.existsSync(srcDataDir)) {
  fs.mkdirSync(srcDataDir, { recursive: true });
}
fs.writeFileSync(tsDataOut, tsContent);

console.log(`✅ Generated ${machines.length} machines successfully.`);
console.log(`📁 JSON: economy/machine_catalog.json`);
console.log(`📁 TS:   src/data/machines.ts`);
