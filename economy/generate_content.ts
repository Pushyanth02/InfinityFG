import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📝 Content & Narrative AI — Generating Game Text & Lore...');

// ── Configuration ────────────────────────────────────────────────────────────
const TONE = 'whimsical';
const MAX_MICROCOPY_LENGTH = 140;

// ── 1. Generated NPCs (20) ───────────────────────────────────────────────────
// A mix of helpful guides, quirky merchants, and rivals.
const npcs = [
  { id: "npc_01", name: "Mayor Barley", role: "Guide", hook: "Welcome to AgriEmpire! I'm the Mayor. Want to turn this dirt into a sparkling empire?" },
  { id: "npc_02", name: "Daisy the Botanist", role: "Crop Scientist", hook: "Fascinating! Have you tried cross-pollinating the Solar Corn with Moon Melons yet?" },
  { id: "npc_03", name: "Rusty cog-smith", role: "Mechanic", hook: "Machines got soul, kid. Treat your Auto-Planter right, and it'll never jam." },
  { id: "npc_04", name: "Count Cashcrop", role: "Rival Tycoon", hook: "Ha! You call that a farm? My industrial synthesizers make more in an hour than you do in a lifetime." },
  { id: "npc_05", name: "Gale the Forecaster", role: "Weather Oracle", hook: "I smell a Rainstorm brewing. Better plant your thirsty seeds now!" },
  { id: "npc_06", name: "Pip the Trader", role: "Market Broker", hook: "Prices are soaring on Desert Wheat! Got any to sell, friend?" },
  { id: "npc_07", name: "Dr. Sprout", role: "Gene Splicer", hook: "Science and soil! Give me enough gems, and I'll unlock the secrets of the Legendary seeds." },
  { id: "npc_08", name: "Grandma Hazel", role: "Elder Farmer", hook: "Back in my day, we harvested by hand. Still, those drones of yours are mighty pretty." },
  { id: "npc_09", name: "Barnaby the Drone Pilot", role: "Tech Pilot", hook: "Whoosh! My aero-drones can water a whole field before you can blink!" },
  { id: "npc_10", name: "Silas the Processor", role: "Refiner", hook: "Raw crops are for amateurs. Value is in the processing, my friend." },
  { id: "npc_11", name: "Inspector Thistle", role: "Farm Inspector", hook: "I'm looking for weeds and inefficiency. So far... hmm, needs more automation." },
  { id: "npc_12", name: "Breezy the Nomad", role: "Explorer", hook: "I've seen the Volcanic Soils. The crops there defy logic!" },
  { id: "npc_13", name: "Captain Cloud", role: "Sky Pilot", hook: "Ready to soar? The Sky Farmlands await those with deep pockets." },
  { id: "npc_14", name: "Penny the Intern", role: "Worker", hook: "I'll harvest as fast as I can, boss! Just promise me a coffee break." },
  { id: "npc_15", name: "Chief Engineer Brix", role: "Upgrade Vendor", hook: "I can optimize those conveyor belts, but it's gonna cost you Tech Tokens." },
  { id: "npc_16", name: "Madame Flora", role: "Prestige Master", hook: "Your farm spans the horizon. Are you ready to reset it all for cosmic power?" },
  { id: "npc_17", name: "Oasis Omar", role: "Desert Guide", hook: "Water is life here. Don't waste a drop." },
  { id: "npc_18", name: "Frosty Fred", role: "Tundra Vendor", hook: "Brrr! Only the hardiest chill-seeds grow out here." },
  { id: "npc_19", name: "Spark the Electrician", role: "Overclocker", hook: "Wanna push that machine past its limits? I can flip the safety switch... if you dare." },
  { id: "npc_20", name: "Lily the Lorekeeper", role: "Achievement Guide", hook: "Every seed planted writes a line in the history books." }
];

// ── 2. Seasonal Event Storylines (6) ─────────────────────────────────────────
const seasonalEvents = [
  {
    id: "evt_spring_bloom",
    name: "Spring Bloom",
    description: "The frost thaws. Rare petal-seeds emerge from the soil.",
    buffs: { crop_growth_speed: "+20%", rare_seed_chance: "+5%" },
    questline: ["Plant 50 spring seeds", "Harvest the mythical Bloom Rose", "Automate a Blossom processor"]
  },
  {
    id: "evt_harvest_festival",
    name: "Harvest Festival",
    description: "Autumn leaves fall. The town demands massive yields!",
    buffs: { market_prices: "+15%", worker_speed: "+10%" },
    questline: ["Sell 10,000 crops", "Bake 500 Pumpkin Pies", "Defeat Count Cashcrop in the harvest contest"]
  },
  {
    id: "evt_winter_chill",
    name: "Winter Freeze",
    description: "The land freezes over. Only machines and tough roots survive.",
    buffs: { machine_maintenance_cost: "-50%", crop_yield: "-20%" },
    questline: ["Build 10 Heating Drones", "Harvest 100 Frost-Hops", "Survive the blizzard"]
  },
  {
    id: "evt_summer_drought",
    name: "The Great Drought",
    description: "Water is scarce. Irrigation technology is pushed to its limits.",
    buffs: { waterer_efficiency: "-30%", desert_crop_yield: "+50%" },
    questline: ["Upgrade all Waterers to Level 5", "Process 300 Cactus Syrups", "Find the Oasis"]
  },
  {
    id: "evt_tech_expo",
    name: "Annual Tech Expo",
    description: "Inventors from all over gather to show off new automation.",
    buffs: { machine_cost: "-15%", overclock_wear: "-50%" },
    questline: ["Purchase 5 new machines", "Successfully Overclock 3 times without breaking", "Earn 1M coins via pure processing"]
  },
  {
    id: "evt_cosmic_alignment",
    name: "Cosmic Alignment",
    description: "The stars shine bright. Time itself seems to warp.",
    buffs: { prestige_points: "+10%", legendary_crop_chance: "+100%" },
    questline: ["Harvest a Starfruit", "Amass 1 Billion Coins", "Ascend (Prestige)"]
  }
];

// ── 3. Achievements Generation (100) ────────────────────────────────────────
const achievements = [];
const tiers = [
  { rank: "Bronze", mult: 10 },
  { rank: "Silver", mult: 100 },
  { rank: "Gold", mult: 1000 },
  { rank: "Platinum", mult: 10000 },
  { rank: "Diamond", mult: 100000 }
];

let achId = 1;

// Generating volume/grind achievements
for (const target of ['seeds planted', 'crops harvested', 'coins earned', 'total clicks']) {
  const baseReq = target === 'coins earned' ? 1000 : 100;
  tiers.forEach(t => {
    const req = baseReq * t.mult;
    const titleVerb = target.split(' ')[1] || target.split(' ')[0];
    achievements.push({
      id: `ach_${String(achId++).padStart(3, '0')}`,
      category: target,
      title: `${target === 'coins earned' ? 'Tycoon' : 'Master ' + titleVerb} - ${t.rank}`,
      requirement: `Reach ${req.toLocaleString()} ${target}`,
      flavor_text: `Your ${target} are climbing to the stars! (${t.rank} tier)`,
      loc_key: `ach.${target.replace(' ', '_')}.${t.rank.toLowerCase()}`
    });
  });
}

// Generating generic ones to fill out the 100
const funAchievements = [
  { name: "First Steps", desc: "Plant your very first seed.", flavor: "Every empire starts with dirt." },
  { name: "Look Ma, No Hands!", desc: "Buy your first automated machine.", flavor: "The robots are taking over, and you love it." },
  { name: "Pushing the Limits", desc: "Overclock a machine for the first time.", flavor: "Sparks flying? That just means it's working faster!" },
  { name: "Oops, I Broke It", desc: "Have a machine break down due to 100% wear.", flavor: "Maintenance is not just a suggestion, boss." },
  { name: "Rolling in Dough", desc: "Process your first batch of wheat into flour.", flavor: "From farm to table, you control the supply chain." },
  { name: "Taking Flight", desc: "Unlock the Sky Farmlands.", flavor: "Who said farms have to be on the ground?" },
  { name: "Cosmic Rebirth", desc: "Prestige for the very first time.", flavor: "Giving it all up for a fraction of cosmic power. Worth it." },
  { name: "Hired Help", desc: "Assign a worker to a machine.", flavor: "Teamwork makes the dream work (and boosts efficiency)." },
  { name: "The 1%", desc: "Hold 1,000,000 coins at once.", flavor: "Count Cashcrop is officially jealous." },
  { name: "Green Thumb", desc: "Harvest a Legendary Crop.", flavor: "The glowing plants are perfectly safe... probably." }
];

funAchievements.forEach(fa => {
  achievements.push({
    id: `ach_${String(achId++).padStart(3, '0')}`,
    category: 'special',
    title: fa.name,
    requirement: fa.desc,
    flavor_text: fa.flavor,
    loc_key: `ach.special.${fa.name.replace(/[^a-zA-Z]/g, '').toLowerCase()}`
  });
});

// Pad the rest out algebraically until we hit exactly 100
let fillerId = 1;
while (achievements.length < 100) {
  const req = 5 * Math.pow(2, fillerId);
  achievements.push({
    id: `ach_${String(achId++).padStart(3, '0')}`,
    category: 'machines_built',
    title: `Industrialist Rank ${fillerId}`,
    requirement: `Build ${req} total machines`,
    flavor_text: `The factory must grow.`,
    loc_key: `ach.industrialist.rank_${fillerId}`
  });
  fillerId++;
}

// ── 4. UI Microcopy ──────────────────────────────────────────────────────────
const microcopy = {
  "ui.btn.harvest": "Harvest!",
  "ui.btn.plant": "Sow Seed",
  "ui.btn.overclock": "OVERCLOCK (Danger!)",
  "ui.btn.prestige": "Ascend & Reset",
  "ui.tooltip.wear": "Machine wear. At 100%, it breaks and enters forced maintenance.",
  "ui.tooltip.overclock": "Boosts speed by 1.5x, but increases wear by 2.5x! Watch it closely.",
  "ui.tooltip.prestige": "Reset all coins, crops, and machines in exchange for permanent global multipliers.",
  "ui.hint.offline": "Your machines kept working while you were gone! You earned {coins} coins.",
  "ui.hint.market_crash": "Market prices are crashing! Hold your processed goods!",
  "ui.hint.weather_rain": "It's raining! All planted crops are growing 2x faster."
};

// Validate constraint
Object.entries(microcopy).forEach(([key, val]) => {
  if (val.length > MAX_MICROCOPY_LENGTH) {
    throw new Error(`Microcopy for ${key} exceeds 140 chars!`);
  }
});

// ── Output ───────────────────────────────────────────────────────────────────
const outputJson = {
  tone_guidelines: TONE,
  npcs: npcs,
  seasonal_events: seasonalEvents,
  achievements: achievements,
  microcopy: microcopy
};

const outDir = path.join(__dirname, '../src/data_exports');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'narrative_content.json'), JSON.stringify(outputJson, null, 2));

// Generate TS typings and export
const tsContent = `// Auto-generated by economy/generate_content.ts
import narrativeData from '../data_exports/narrative_content.json';

export const NPCs = narrativeData.npcs;
export const SEASONAL_EVENTS = narrativeData.seasonal_events;
export const ACHIEVEMENTS = narrativeData.achievements;
export const MICROCOPY = narrativeData.microcopy as Record<string, string>;

export const t = (key: string, variables?: Record<string, string | number>): string => {
  let text = MICROCOPY[key] || key;
  if (variables) {
    for (const [k, v] of Object.entries(variables)) {
      text = text.replace(\`{\${k}}\`, String(v));
    }
  }
  return text;
};
`;

const tsOutDir = path.join(__dirname, '../src/data');
if (!fs.existsSync(tsOutDir)) fs.mkdirSync(tsOutDir, { recursive: true });
fs.writeFileSync(path.join(tsOutDir, 'narrative.ts'), tsContent);

console.log(`✅ Generated Narrative Content successfully!`);
console.log(`   - 20 NPCs`);
console.log(`   - 6 Seasonal Events`);
console.log(`   - ${achievements.length} Achievements`);
console.log(`   - ${Object.keys(microcopy).length} UI Microcopy Strings`);
console.log(`📁 JSON: src/data_exports/narrative_content.json`);
console.log(`📁 TS:   src/data/narrative.ts`);
