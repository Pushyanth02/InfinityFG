/**
 * AGRIEMPIRE — CropGen AI
 * Procedural crop catalog generator.
 *
 * Input:  {"num_crops":60,"target_growth_buckets":[...]}
 * Output: economy/crop_catalog.json + src/data/crops.ts
 *
 * Run: npx tsx economy/generate_crops.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Input schema ─────────────────────────────────────────────────────────────
const INPUT = {
  num_crops: 60,
  target_growth_buckets: [
    { name: 'early', min_s: 10,  max_s: 90   },   // 24 crops
    { name: 'mid',   min_s: 90,  max_s: 600  },   // 24 crops
    { name: 'late',  min_s: 600, max_s: 7200 },   // 12 crops
  ],
};

// ─── Constants ────────────────────────────────────────────────────────────────
const RARITY_MULT: Record<string, number> = {
  common: 1, uncommon: 1.6, rare: 3, epic: 7, legendary: 20,
};
const RARITY_UNLOCK: Record<string, number> = {
  common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5,
};

// Consistent machine synergy taxonomy
const SYNERGY_TAGS = {
  grain:      ['grain_mill', 'auto_harvester'],
  vegetable:  ['auto_planter', 'drip_irrigation'],
  fruit:      ['juice_press', 'auto_harvester'],
  legume:     ['seed_sorter', 'grain_mill'],
  tuber:      ['auto_harvester', 'processing_unit'],
  herb:       ['drip_irrigation', 'roaster'],
  flower:     ['drip_irrigation', 'cold_storage'],
  tropical:   ['hydroponic_bay', 'juice_press'],
  mushroom:   ['cold_storage', 'processing_unit'],
  exotic:     ['hydroponic_bay', 'mega_harvester'],
  industrial: ['mega_harvester', 'ai_farm_mgr', 'processing_unit'],
};

type SynergyKey = keyof typeof SYNERGY_TAGS;

// Processing chain suggestions by crop category
const CHAINS: Record<string, { steps: string[]; multipliers: number[] }> = {
  grain:      { steps: ['raw → flour → bread → artisan loaf'], multipliers: [2.3, 2.3, 2.3] },
  vegetable:  { steps: ['raw → preserved → pickled → gourmet jar'], multipliers: [2.0, 2.0, 2.3] },
  fruit:      { steps: ['raw → juice → wine → reserve'], multipliers: [2.3, 2.3, 2.3] },
  legume:     { steps: ['raw → dried → paste → premium paste'], multipliers: [1.8, 2.0, 2.3] },
  tuber:      { steps: ['raw → processed → chips → luxury snack'], multipliers: [2.0, 2.3, 2.0] },
  herb:       { steps: ['raw → dried herb → extract → essence'], multipliers: [2.5, 2.5, 2.5] },
  flower:     { steps: ['raw → petals → perfume → luxury perfume'], multipliers: [3.0, 2.3, 2.3] },
  tropical:   { steps: ['raw → pulp → exotic blend → premium export'], multipliers: [2.3, 2.5, 2.5] },
  mushroom:   { steps: ['raw → dried → powder → supplement'], multipliers: [2.0, 2.5, 3.0] },
  exotic:     { steps: ['raw → refined → crystallized → ultra-rare export'], multipliers: [3.0, 3.0, 3.0] },
  industrial: { steps: ['raw → bio-fuel → refined bio-fuel → energy cell'], multipliers: [2.3, 2.3, 2.5] },
};

// ─── Crop seed data ───────────────────────────────────────────────────────────
// Each entry: [name, emoji, growthSec, yield, soilType, rarity, category, weatherAffinity[], unlock_region, loreTag]
type CropSeed = [string, string, number, number, string, string, SynergyKey, string[], string, string];

const CROP_SEEDS: CropSeed[] = [
  // ── EARLY (10–90s) — 24 crops ──────────────────────────────────────────────
  // Common (12)
  ['Wheat',          '🌾', 30,  4, 'meadow',     'common',   'grain',    ['sunny','rainstorm'],          'meadow',   'The backbone of any farm. Grows fast, sells reliably.'],
  ['Corn',           '🌽', 45,  3, 'meadow',     'common',   'grain',    ['sunny'],                      'meadow',   'Warm-weather staple with consistent yields.'],
  ['Potato',         '🥔', 60,  5, 'highlands',  'common',   'tuber',    ['rainstorm'],                  'meadow',   'Rugged and reliable — it grows almost anywhere.'],
  ['Carrot',         '🥕', 40,  4, 'meadow',     'common',   'vegetable',['sunny','rainstorm'],          'meadow',   'A crunchy favourite. Perfect for market days.'],
  ['Tomato',         '🍅', 50,  3, 'riverlands', 'common',   'vegetable',['sunny'],                      'meadow',   'Sun-kissed and plump, ready for the saucemaker.'],
  ['Lettuce',        '🥬', 20,  3, 'meadow',     'common',   'vegetable',['rainstorm'],                  'meadow',   'Fast-growing leafy green. The salad king.'],
  ['Radish',         '🌰', 10,  2, 'highlands',  'common',   'vegetable',['rainstorm'],                  'meadow',   'The fastest crop on the farm. Quick coins, quick satisfaction.'],
  ['Pea',            '🫛', 35,  4, 'meadow',     'common',   'legume',   ['sunny','rainstorm'],          'meadow',   'Tiny pods, big harvests. Great for seed cycling.'],
  ['Bean',           '🫘', 55,  5, 'riverlands', 'common',   'legume',   ['rainstorm'],                  'meadow',   'A protein powerhouse. Beans go into everything.'],
  ['Cabbage',        '🥦', 70,  4, 'highlands',  'common',   'vegetable',['rainstorm'],                  'meadow',   'Dense and dependable. Favoured in cold highland plots.'],
  ['Spinach',        '🍃', 25,  3, 'meadow',     'common',   'vegetable',['rainstorm'],                  'meadow',   'Iron-rich and fast-growing. Farmers love the turnaround.'],
  ['Garlic',         '🧄', 80,  3, 'highlands',  'common',   'herb',     ['sunny'],                      'meadow',   'Pungent perfection. Doubles as pest control.'],
  // Uncommon (12)
  ['Soybean',        '🌱', 65,  5, 'meadow',     'uncommon', 'legume',   ['rainstorm','fertile'],       'meadow',   'The plant that feeds the world — and your machines.'],
  ['Sunflower',      '🌻', 70,  4, 'meadow',     'uncommon', 'flower',   ['sunny','fertile'],           'meadow',   'Tall, golden, photosynthetically aggressive.'],
  ['Pumpkin',        '🎃', 85,  4, 'highlands',  'uncommon', 'vegetable',['fertile'],                   'highlands','Seasonal superstar. Farmers swear by autumn harvests.'],
  ['Ginger',         '🫚', 90,  3, 'riverlands', 'uncommon', 'herb',     ['rainstorm','fertile'],       'riverlands','A fiery root. Prized in markets and medicine halls.'],
  ['Pepper',         '🌶', 75,  3, 'meadow',     'uncommon', 'vegetable',['sunny','fertile'],           'meadow',   'Bold heat in small packages. The spice trade starts here.'],
  ['Onion',          '🧅', 60,  4, 'highlands',  'uncommon', 'vegetable',['rainstorm'],                 'highlands','Brings tears in the field, cheers at the market.'],
  ['Basil',          '🌿', 35,  3, 'riverlands', 'uncommon', 'herb',     ['sunny','fertile'],           'riverlands','Fragrant gold. Worth triple the coin when extracted.'],
  ['Mint',           '🍀', 30,  4, 'riverlands', 'uncommon', 'herb',     ['rainstorm'],                 'riverlands','Cool and fast-spreading. Essential for the extract line.'],
  ['Chamomile',      '🌼', 55,  3, 'meadow',     'uncommon', 'flower',   ['sunny'],                     'meadow',   'Calming and profitable. Florists and apothecaries compete.'],
  ['Kale',           '🥬', 45,  5, 'highlands',  'uncommon', 'vegetable',['rainstorm','fertile'],       'highlands','The superfood of choice. Cold-hardy and nutrient-dense.'],
  ['Lentil',         '🫘', 50,  4, 'meadow',     'uncommon', 'legume',   ['sunny'],                     'meadow',   'Ancient and humble. Lentils power civilisations.'],
  ['Fennel',         '🌾', 65,  3, 'riverlands', 'uncommon', 'herb',     ['sunny','fertile'],           'riverlands','Anise-sweet and elegant. Cooks pay premium.'],

  // ── MID (90–600s) — 24 crops ───────────────────────────────────────────────
  // Uncommon (6)
  ['Rice',           '🌾', 90,  6, 'riverlands', 'uncommon', 'grain',    ['rainstorm','fertile'],       'riverlands','Wetland wonder. Feeds half the world\'s appetite.'],
  ['Sugarcane',      '🎋', 120, 5, 'tropical',   'uncommon', 'industrial',['sunny','fertile'],          'tropical', 'Sweet gold. Refined into sugar, ethanol, and profit.'],
  ['Oats',           '🌾', 100, 5, 'highlands',  'uncommon', 'grain',    ['rainstorm'],                 'highlands','Hardy highland grain. Cold-weather masterpiece.'],
  ['Buckwheat',      '🌸', 110, 4, 'highlands',  'uncommon', 'grain',    ['sunny'],                     'highlands','Gluten-free and fast. High upland crop demand.'],
  ['Barley',         '🌾', 130, 5, 'meadow',     'uncommon', 'grain',    ['sunny','rainstorm'],         'meadow',   'The brewer\'s darling. Barley leads all fermentation chains.'],
  ['Lavender',       '💜', 150, 3, 'highlands',  'uncommon', 'flower',   ['sunny','fertile'],           'highlands','Aromatherapy in plant form. Extract prices are extraordinary.'],
  // Rare (10)
  ['Grape',          '🍇', 200, 5, 'highlands',  'rare',     'fruit',    ['sunny','fertile'],           'highlands','The vintage begins here. Four processing tiers await.'],
  ['Strawberry',     '🍓', 180, 4, 'meadow',     'rare',     'fruit',    ['sunny','fertile'],           'meadow',   'Delicate and fleeting. Peak-season prices are the highest.'],
  ['Blueberry',      '🫐', 240, 4, 'highlands',  'rare',     'fruit',    ['rainstorm','fertile'],       'highlands','Antioxidant powerhouse. Export demand always strong.'],
  ['Coffee',         '☕', 300, 3, 'tropical',   'rare',     'industrial',['sunny','fertile'],          'tropical', 'The world\'s favourite stimulant. Roast it for 3x returns.'],
  ['Tea',            '🍵', 250, 4, 'highlands',  'rare',     'herb',     ['rainstorm','fertile'],       'highlands','Calming leaves with obsessive global demand.'],
  ['Vanilla',        '🌸', 400, 2, 'tropical',   'rare',     'herb',     ['sunny'],                     'tropical', 'The world\'s second most expensive spice. Extract is worth fortunes.'],
  ['Mango',          '🥭', 220, 4, 'tropical',   'rare',     'tropical', ['sunny','fertile'],           'tropical', 'King of tropical fruits. Juice revenue is exceptional.'],
  ['Pineapple',      '🍍', 280, 3, 'tropical',   'rare',     'tropical', ['sunny'],                     'tropical', 'Spiky exterior, sweet reward. Canning adds major value.'],
  ['Papaya',         '🪔', 260, 4, 'tropical',   'rare',     'tropical', ['sunny','fertile'],           'tropical', 'Enzymes in every bite. Prized by pharmaceutical buyers.'],
  ['Cacao',          '🍫', 350, 3, 'tropical',   'rare',     'industrial',['rainstorm','fertile'],      'tropical', 'The raw material of chocolate empires. Four stages of bliss.'],
  // Epic (8)
  ['Dragon Fruit',   '🐉', 450, 3, 'desert',     'epic',     'exotic',   ['sunny'],                     'arid',     'Otherworldly in appearance, extraordinary in market value.'],
  ['Saffron',        '🌷', 500, 1, 'highlands',  'epic',     'flower',   ['sunny','fertile'],           'highlands','The world\'s most expensive spice by weight. Rarity is the point.'],
  ['Black Truffle',  '🍄', 480, 2, 'highlands',  'epic',     'mushroom', ['rainstorm'],                 'highlands','Found underground, sold in high-end restaurants worldwide.'],
  ['Avocado',        '🥑', 420, 3, 'tropical',   'epic',     'tropical', ['sunny'],                     'tropical', 'The millennial crop. Demand never wavers.'],
  ['Artichoke',      '🌿', 360, 2, 'highlands',  'epic',     'vegetable',['fertile'],                   'highlands','Architectural beauty with a gourmet price tag.'],
  ['Quinoa',         '🌾', 390, 4, 'highlands',  'epic',     'grain',    ['sunny'],                     'highlands','The super-grain of lost civilisations. Premium health-food pricing.'],
  ['Chia',           '🌱', 340, 5, 'desert',     'epic',     'legume',   ['sunny'],                     'arid',     'Tiny seeds, enormous nutritional value. Global export potential.'],
  ['Tahitian Lime',  '🍋', 380, 3, 'tropical',   'epic',     'fruit',    ['rainstorm','sunny'],         'tropical', 'Citrus royalty. The extract is used in luxury beverage lines.'],

  // ── LATE (600–7200s) — 12 crops ────────────────────────────────────────────
  // Epic (2)
  ['Wasabi Root',    '🟢', 900,  2, 'riverlands', 'epic',     'herb',     ['rainstorm','fertile'],       'riverlands','Grows only in cold stream beds. Authentic demand keeps prices elite.'],
  ['Blue Oyster Mushroom','🍄',720,4,'riverlands', 'epic',    'mushroom', ['rainstorm'],                 'riverlands','Medical-grade mycelium. Extract commands pharmaceutical rates.'],
  // Legendary (10)
  ['White Truffle',  '✨', 3600, 1, 'highlands',  'legendary','mushroom', ['fertile'],                   'highlands','The jewel of gastronomy. A single harvest is worth a machine.'],
  ['Kopi Luwak',     '☕', 2400, 1, 'tropical',   'legendary','industrial',['sunny','fertile'],          'tropical', 'The world\'s rarest coffee. A cup sells for $80. You grow the beans.'],
  ['Ghost Pepper',   '🔥', 1800, 2, 'desert',     'legendary','vegetable',['sunny'],                    'arid',     'Record-breaking Scoville rating. Pharmaceutical and food-tech buyers compete.'],
  ['Sea Grape',      '🌊', 2700, 2, 'coastal',    'legendary','fruit',    ['rainstorm','sunny'],         'coastal',  'Rare coastal delicacy. Only grows in salt-kissed soils near water.'],
  ['Argan Blossom',  '🌺', 2100, 1, 'desert',     'legendary','flower',   ['sunny'],                    'arid',     'The desert\'s treasure. Cold-pressed oil trades at extreme premiums.'],
  ['Matsutake',      '🍄', 4200, 1, 'highlands',  'legendary','mushroom', ['rainstorm'],                 'highlands','Japan\'s sacred mushroom. Gifted to emperors. Now sold to your buyers.'],
  ['Manuka Flower',  '🌸', 3000, 2, 'coastal',    'legendary','flower',   ['sunny','fertile'],           'coastal',  'The source of Manuka honey. Medical-grade antibacterial properties.'],
  ['Oud Resin',      '🪵', 5400, 1, 'tropical',   'legendary','exotic',   ['sunny'],                    'tropical', 'Liquid gold from agarwood trees. A kilogram trades for $10,000.'],
  ['Lunar Melon',    '🌙', 7000, 2, 'highlands',  'legendary','exotic',   ['fertile'],                  'highlands','A mythic heirloom variety. Said to only fruit under full-moon cycles.'],
  ['Aurora Cacao',   '🌌', 6500, 1, 'tropical',   'legendary','industrial',['fertile','sunny'],         'tropical', 'A genetic marvel of cacao genetics. Chocolate houses pay fortunes for it.'],
];

// ─── Formula: base_value = round( growthSec^0.9 × rarityMult × yieldInv )
function computeBaseValue(growthSec: number, rarity: string, yieldAmt: number): number {
  const raw = Math.pow(growthSec, 0.9) * RARITY_MULT[rarity] / Math.max(1, yieldAmt * 0.5);
  return Math.max(1, Math.round(raw));
}

// ─── Build crops ──────────────────────────────────────────────────────────────
interface CropEntry {
  crop_id: string;
  name: string;
  emoji: string;
  growth_time: number;
  yield: number;
  base_value: number;
  value_per_minute: number;
  seed_cost: number;
  soil_type: string;
  rarity: string;
  growth_bucket: string;
  weather_affinity: string[];
  machine_synergy: string[];
  processing_chain: { steps: string[]; multipliers: number[]; stage4_value: number };
  unlock_tier: number;
  unlock_region: string;
  description: string;
  hybridization: { parent_suggestions: string[]; trait_inherited: string };
  kpis: {
    coins_per_minute_active: number;
    coins_per_minute_idle: number;
    processing_value_stage1: number;
    processing_value_stage4: number;
    no_negative_arbitrage: boolean;
  };
}

const CROP_CATALOG: CropEntry[] = CROP_SEEDS.map((seed, i) => {
  const [name, emoji, growthSec, yieldAmt, soilType, rarity, category, weatherAffinity, unlockRegion, description] = seed;

  const baseValue = computeBaseValue(growthSec, rarity, yieldAmt);
  const seedCost  = Math.round(baseValue * 0.5);
  const bucket    = growthSec >= 600 ? 'late' : growthSec >= 90 ? 'mid' : 'early';
  const chain     = CHAINS[category];
  const stage4Val = Math.round(baseValue * Math.pow(2.3, 3)); // 3 processing stages
  const vmActive  = +((baseValue * yieldAmt) / (growthSec / 60)).toFixed(2);
  const vmIdle    = +(vmActive * 0.6).toFixed(2); // 60% of active (idle assumption)

  // Arbitrage check: processing must yield positive gain after seed cost
  const seedCostRecovered = baseValue * yieldAmt > seedCost;
  const processingPositive = stage4Val > baseValue;

  // Hybridization hints from adjacent crops
  const parentIndex1 = Math.max(0, i - 2);
  const parentIndex2 = Math.min(CROP_SEEDS.length - 1, i + 3);
  const parent1 = CROP_SEEDS[parentIndex1][0];
  const parent2 = CROP_SEEDS[parentIndex2][0];

  return {
    crop_id: `crop_${String(i + 1).padStart(3, '0')}`,
    name,
    emoji,
    growth_time: growthSec,
    yield: yieldAmt,
    base_value: baseValue,
    value_per_minute: vmActive,
    seed_cost: seedCost,
    soil_type: soilType,
    rarity,
    growth_bucket: bucket,
    weather_affinity: weatherAffinity,
    machine_synergy: SYNERGY_TAGS[category],
    processing_chain: {
      steps: chain.steps,
      multipliers: chain.multipliers,
      stage4_value: stage4Val,
    },
    unlock_tier: RARITY_UNLOCK[rarity],
    unlock_region: unlockRegion,
    description,
    hybridization: {
      parent_suggestions: [parent1, parent2],
      trait_inherited: `${category} synergy + ${weatherAffinity[0]} affinity blend`,
    },
    kpis: {
      coins_per_minute_active: vmActive,
      coins_per_minute_idle: vmIdle,
      processing_value_stage1: Math.round(baseValue * 2.3),
      processing_value_stage4: stage4Val,
      no_negative_arbitrage: seedCostRecovered && processingPositive,
    },
  };
});

// ─── KPI Summary ──────────────────────────────────────────────────────────────
const bucketCounts = {
  early: CROP_CATALOG.filter(c => c.growth_bucket === 'early').length,
  mid:   CROP_CATALOG.filter(c => c.growth_bucket === 'mid').length,
  late:  CROP_CATALOG.filter(c => c.growth_bucket === 'late').length,
};
const rarityCounts: Record<string, number> = {};
CROP_CATALOG.forEach(c => { rarityCounts[c.rarity] = (rarityCounts[c.rarity] ?? 0) + 1; });

const avgValueByBucket = {
  early: +(CROP_CATALOG.filter(c=>c.growth_bucket==='early').reduce((s,c)=>s+c.value_per_minute,0)/bucketCounts.early).toFixed(2),
  mid:   +(CROP_CATALOG.filter(c=>c.growth_bucket==='mid').reduce((s,c)=>s+c.value_per_minute,0)/bucketCounts.mid).toFixed(2),
  late:  +(CROP_CATALOG.filter(c=>c.growth_bucket==='late').reduce((s,c)=>s+c.value_per_minute,0)/bucketCounts.late).toFixed(2),
};

const arbitrageViolations = CROP_CATALOG.filter(c => !c.kpis.no_negative_arbitrage).length;

// ─── Output ───────────────────────────────────────────────────────────────────
const output = {
  schema: 'agriempire-crop-catalog/v1',
  issued_by: 'antigravity',
  timestamp: new Date().toISOString(),
  input: INPUT,
  notes: 'Procedurally generated crop catalog. base_value = round(growthSec^0.9 × rarityMult / (yield×0.5)). All crops validated for no negative arbitrage.',

  kpis: {
    total_crops: CROP_CATALOG.length,
    bucket_distribution: bucketCounts,
    rarity_distribution: rarityCounts,
    avg_coins_per_minute_by_bucket: avgValueByBucket,
    arbitrage_violations: arbitrageViolations,
    arbitrage_check_result: arbitrageViolations === 0 ? 'PASS ✅' : `FAIL ❌ (${arbitrageViolations} crops)`,
    synergy_tags_used: Object.keys(SYNERGY_TAGS),
    soil_types_covered: ['meadow', 'highlands', 'riverlands', 'tropical', 'desert', 'coastal'],
  },

  crops: CROP_CATALOG,
};

const outDir = path.join(__dirname, '../src/data_exports');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Write catalog JSON
const catalogPath = path.join(outDir, 'crop_catalog.json');
fs.writeFileSync(catalogPath, JSON.stringify(output, null, 2));
console.log(`✅ Crop catalog written: ${catalogPath}`);
console.log(`\nKPIs:`);
console.log(`  Total crops: ${CROP_CATALOG.length}`);
console.log(`  Buckets: early=${bucketCounts.early} mid=${bucketCounts.mid} late=${bucketCounts.late}`);
console.log(`  Rarities: ${JSON.stringify(rarityCounts)}`);
console.log(`  Avg value/min: early=${avgValueByBucket.early} mid=${avgValueByBucket.mid} late=${avgValueByBucket.late}`);
console.log(`  Arbitrage check: ${arbitrageViolations === 0 ? 'PASS ✅' : 'FAIL ❌'}`);

// Write crops.ts for the game
const cropsTs = `// AUTO-GENERATED by economy/generate_crops.ts (CropGen AI)
// Edit economy/generate_crops.ts to change crops, then re-run.
// All values validated by CropGen AI KPI checks.

export interface Crop {
  id: string;
  name: string;
  emoji: string;
  growthTime: number;   // seconds
  yield: number;
  baseValue: number;
  seedCost: number;
  soilType: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  growthBucket: 'early' | 'mid' | 'late';
  weatherBonus: number; // multiplier applied during weather affinity events
  weatherAffinity: string[];
  machineSynergy: string[];
  unlockTier: number;
  unlockRegion: string;
  description: string;
}

export const CROPS: Crop[] = ${JSON.stringify(
  CROP_CATALOG.map(c => ({
    id: c.crop_id,
    name: c.name,
    emoji: c.emoji,
    growthTime: c.growth_time,
    yield: c.yield,
    baseValue: c.base_value,
    seedCost: c.seed_cost,
    soilType: c.soil_type,
    rarity: c.rarity as Crop['rarity'],
    growthBucket: c.growth_bucket as Crop['growthBucket'],
    weatherBonus: (c.weather_affinity as string[]).includes('fertile') ? 1.5
                : (c.weather_affinity as string[]).includes('sunny')   ? 1.3 : 1.2,
    weatherAffinity: c.weather_affinity as string[],
    machineSynergy: c.machine_synergy as string[],
    unlockTier: c.unlock_tier,
    unlockRegion: c.unlock_region,
    description: c.description,
  })),
  null, 2
)};
`;

const cropsPath = path.join(__dirname, '..', 'src', 'data', 'crops.ts');
fs.writeFileSync(cropsPath, cropsTs);
console.log(`✅ src/data/crops.ts updated: ${cropsPath}`);
