// ============================================================
// AGRIEMPIRE — WORKERS, REGIONS, UPGRADES, ACHIEVEMENTS
// ============================================================

// ─────────────── WORKERS (40 types) ─────────────────────────
export interface Worker {
  id: string;
  name: string;
  emoji: string;
  role: string;
  baseCost: number;
  hireCoins: number;
  baseBonus: number;    // flat bonus to production
  levelBonus: number;   // bonus per level (0.05 default)
  specialty: string;    // what they boost
  description: string;
}

export const WORKERS: Worker[] = [
  { id:'farmer1',      name:'Village Farmer',       emoji:'👨‍🌾', role:'Farmer',     baseCost:50,      hireCoins:100,      baseBonus:0.05, levelBonus:0.05, specialty:'crop_growth',    description:'Speeds up crop growth.' },
  { id:'farmer2',      name:'Expert Farmer',         emoji:'🧑‍🌾', role:'Farmer',     baseCost:500,     hireCoins:1000,     baseBonus:0.12, levelBonus:0.06, specialty:'crop_growth',    description:'Faster and more efficient.' },
  { id:'farmer3',      name:'Master Agriculturist',  emoji:'👩‍🌾', role:'Farmer',     baseCost:5000,    hireCoins:10000,    baseBonus:0.25, levelBonus:0.08, specialty:'crop_growth',    description:'Maximises crop potential.' },
  { id:'harvester1',   name:'Field Hand',            emoji:'👷', role:'Harvester',  baseCost:75,      hireCoins:150,      baseBonus:0.05, levelBonus:0.05, specialty:'harvest_speed',  description:'Speeds up harvesting.' },
  { id:'harvester2',   name:'Combine Operator',      emoji:'👷‍♀️', role:'Harvester',  baseCost:750,     hireCoins:1500,     baseBonus:0.15, levelBonus:0.06, specialty:'harvest_speed',  description:'Operates heavy machinery.' },
  { id:'harvester3',   name:'Harvest Commander',     emoji:'🦺', role:'Harvester',  baseCost:7500,    hireCoins:15000,    baseBonus:0.30, levelBonus:0.09, specialty:'harvest_speed',  description:'Commands full harvest operations.' },
  { id:'engineer1',    name:'Mechanic',              emoji:'🔧', role:'Engineer',   baseCost:200,     hireCoins:400,      baseBonus:0.08, levelBonus:0.05, specialty:'machine_eff',    description:'Improves machine efficiency.' },
  { id:'engineer2',    name:'Agricultural Engineer', emoji:'⚙️', role:'Engineer',   baseCost:2000,    hireCoins:4000,     baseBonus:0.18, levelBonus:0.07, specialty:'machine_eff',    description:'Optimises machine systems.' },
  { id:'engineer3',    name:'Robotics Expert',       emoji:'🤖', role:'Engineer',   baseCost:20000,   hireCoins:40000,    baseBonus:0.35, levelBonus:0.10, specialty:'machine_eff',    description:'Automates farm robotics.' },
  { id:'scientist1',   name:'Agronomist',            emoji:'🔬', role:'Scientist',  baseCost:500,     hireCoins:1000,     baseBonus:0.10, levelBonus:0.06, specialty:'research_speed', description:'Accelerates research.' },
  { id:'scientist2',   name:'Biologist',             emoji:'🧬', role:'Scientist',  baseCost:5000,    hireCoins:10000,    baseBonus:0.20, levelBonus:0.08, specialty:'research_speed', description:'Advances crop genetics.' },
  { id:'scientist3',   name:'Lead Geneticist',       emoji:'🧫', role:'Scientist',  baseCost:50000,   hireCoins:100000,   baseBonus:0.40, levelBonus:0.12, specialty:'research_speed', description:'Pioneers gene editing.' },
  { id:'trader1',      name:'Market Vendor',         emoji:'🛒', role:'Trader',     baseCost:300,     hireCoins:600,      baseBonus:0.08, levelBonus:0.05, specialty:'sell_price',     description:'Gets better market prices.' },
  { id:'trader2',      name:'Commodity Broker',      emoji:'📊', role:'Trader',     baseCost:3000,    hireCoins:6000,     baseBonus:0.18, levelBonus:0.07, specialty:'sell_price',     description:'Trades on commodity markets.' },
  { id:'trader3',      name:'Global Trade Director', emoji:'🌐', role:'Trader',     baseCost:30000,   hireCoins:60000,    baseBonus:0.35, levelBonus:0.10, specialty:'sell_price',     description:'Controls international trade.' },
  { id:'manager1',     name:'Farm Supervisor',       emoji:'📋', role:'Manager',    baseCost:1000,    hireCoins:2000,     baseBonus:0.12, levelBonus:0.06, specialty:'all_bonus',      description:'Boosts all farm operations.' },
  { id:'manager2',     name:'Operations Manager',    emoji:'💼', role:'Manager',    baseCost:10000,   hireCoins:20000,    baseBonus:0.22, levelBonus:0.08, specialty:'all_bonus',      description:'Streamlines all workflows.' },
  { id:'manager3',     name:'CEO',                   emoji:'👔', role:'Manager',    baseCost:100000,  hireCoins:200000,   baseBonus:0.45, levelBonus:0.15, specialty:'all_bonus',      description:'Runs the entire empire.' },
  { id:'irrigator',    name:'Irrigation Specialist', emoji:'💧', role:'Farmer',     baseCost:400,     hireCoins:800,      baseBonus:0.10, levelBonus:0.05, specialty:'water_eff',      description:'Reduces water usage, grows faster.' },
  { id:'vet',          name:'Farm Veterinarian',     emoji:'🐄', role:'Farmer',     baseCost:600,     hireCoins:1200,     baseBonus:0.08, levelBonus:0.05, specialty:'animal_bonus',   description:'Keeps livestock healthy.' },
  { id:'chemist',      name:'Soil Chemist',          emoji:'⚗️', role:'Scientist',  baseCost:1500,    hireCoins:3000,     baseBonus:0.15, levelBonus:0.06, specialty:'soil_quality',   description:'Improves soil chemistry.' },
  { id:'drone_pilot',  name:'Drone Pilot',           emoji:'🚁', role:'Engineer',   baseCost:3000,    hireCoins:6000,     baseBonus:0.20, levelBonus:0.07, specialty:'drone_eff',      description:'Maximises drone productivity.' },
  { id:'weather_exp',  name:'Meteorologist',         emoji:'🌦️', role:'Scientist',  baseCost:2000,    hireCoins:4000,     baseBonus:0.15, levelBonus:0.06, specialty:'weather_resist', description:'Mitigates bad weather events.' },
  { id:'logistics',    name:'Logistics Coordinator', emoji:'📦', role:'Manager',    baseCost:4000,    hireCoins:8000,     baseBonus:0.18, levelBonus:0.07, specialty:'processing_spd', description:'Speeds up supply chain.' },
  { id:'accountant',   name:'Farm Accountant',       emoji:'💰', role:'Trader',     baseCost:1500,    hireCoins:3000,     baseBonus:0.12, levelBonus:0.06, specialty:'coin_bonus',     description:'Reduces operating costs.' },
  { id:'horticulturist',name:'Horticulturist',       emoji:'🌺', role:'Scientist',  baseCost:2500,    hireCoins:5000,     baseBonus:0.16, levelBonus:0.07, specialty:'rare_chance',    description:'Increases rare crop chance.' },
  { id:'ecologist',    name:'Ecologist',             emoji:'🌍', role:'Scientist',  baseCost:4000,    hireCoins:8000,     baseBonus:0.18, levelBonus:0.07, specialty:'eco_bonus',      description:'Boosts organic crop value.' },
  { id:'chef',         name:'Executive Chef',        emoji:'👨‍🍳', role:'Trader',     baseCost:8000,    hireCoins:16000,    baseBonus:0.22, levelBonus:0.08, specialty:'food_chain',     description:'Boosts processed food value.' },
  { id:'ai_specialist',name:'AI Specialist',         emoji:'🤖', role:'Engineer',   baseCost:50000,   hireCoins:100000,   baseBonus:0.40, levelBonus:0.12, specialty:'ai_systems',     description:'Optimises AI farm systems.' },
  { id:'aerospace_eng',name:'Aerospace Engineer',    emoji:'🚀', role:'Engineer',   baseCost:200000,  hireCoins:400000,   baseBonus:0.60, levelBonus:0.15, specialty:'space_farms',    description:'Manages orbital operations.' },
  { id:'nano_tech',    name:'Nanotechnology Expert', emoji:'⚛️', role:'Scientist',  baseCost:150000,  hireCoins:300000,   baseBonus:0.55, levelBonus:0.14, specialty:'nano_systems',   description:'Deploys nanobot farm workers.' },
  { id:'quantum_phys', name:'Quantum Physicist',     emoji:'🌀', role:'Scientist',  baseCost:500000,  hireCoins:1000000,  baseBonus:0.80, levelBonus:0.20, specialty:'quantum_yield',  description:'Unlocks quantum harvesting bonus.' },
  { id:'foreman',      name:'Construction Foreman',  emoji:'🏗️', role:'Manager',    baseCost:5000,    hireCoins:10000,    baseBonus:0.18, levelBonus:0.07, specialty:'build_speed',    description:'Speeds up machine construction.' },
  { id:'security',     name:'Farm Security Guard',   emoji:'💂', role:'Manager',    baseCost:300,     hireCoins:600,      baseBonus:0.05, levelBonus:0.04, specialty:'pest_resist',    description:'Reduces pest attack losses.' },
  { id:'app_dev',      name:'AgriApp Developer',     emoji:'💻', role:'Engineer',   baseCost:25000,   hireCoins:50000,    baseBonus:0.30, levelBonus:0.09, specialty:'automation',     description:'Builds farm management apps.' },
  { id:'geneticist',   name:'Crop Geneticist',       emoji:'🧬', role:'Scientist',  baseCost:80000,   hireCoins:160000,   baseBonus:0.45, levelBonus:0.12, specialty:'crop_quality',   description:'Engineers crops for max yield.' },
  { id:'climateeng',   name:'Climate Engineer',      emoji:'🌡️', role:'Engineer',   baseCost:100000,  hireCoins:200000,   baseBonus:0.50, levelBonus:0.13, specialty:'climate_ctrl',   description:'Controls farm microclimate.' },
  { id:'trader4',      name:'Futures Trader',        emoji:'📈', role:'Trader',     baseCost:15000,   hireCoins:30000,    baseBonus:0.25, levelBonus:0.08, specialty:'market_timing',  description:'Times market sales perfectly.' },
  { id:'pres_advisor', name:'Prestige Advisor',      emoji:'🏆', role:'Manager',    baseCost:500000,  hireCoins:1000000,  baseBonus:1.00, levelBonus:0.25, specialty:'prestige_bonus', description:'Maximises prestige gains.' },
  { id:'intern',       name:'Farm Intern',           emoji:'🎒', role:'Farmer',     baseCost:10,      hireCoins:20,       baseBonus:0.02, levelBonus:0.03, specialty:'all_bonus',      description:'Does a bit of everything, badly.' },
];

// ─────────────── REGIONS (12 regions) ─────────────────────────
export interface Region {
  id: string;
  name: string;
  emoji: string;
  unlockCost: number;
  soilType: string;
  description: string;
  weatherModifier: number;
  cropMultiplier: number;
}

export const REGIONS: Region[] = [
  { id:'meadow',      name:'Meadow Fields',      emoji:'🌾', unlockCost:0,          soilType:'meadow',     description:'Your starting farmland. Fertile and flat.',              weatherModifier:1.0,  cropMultiplier:1.0  },
  { id:'riverlands',  name:'Riverlands',         emoji:'🏞️', unlockCost:5000,       soilType:'riverlands', description:'Water-rich lands along the great river.',                weatherModifier:1.3,  cropMultiplier:1.2  },
  { id:'highlands',   name:'Highlands',          emoji:'⛰️', unlockCost:50000,      soilType:'highlands',  description:'Cool elevated terrain for premium crops.',               weatherModifier:1.1,  cropMultiplier:1.5  },
  { id:'desert',      name:'Desert Oasis',       emoji:'🏜️', unlockCost:250000,     soilType:'desert',     description:'Harsh but exotic crops thrive here.',                    weatherModifier:0.7,  cropMultiplier:2.0  },
  { id:'volcanic',    name:'Volcanic Plains',    emoji:'🌋', unlockCost:1000000,    soilType:'volcanic',   description:'Mineral-rich volcanic soil. Legendary crops await.',       weatherModifier:1.5,  cropMultiplier:3.0  },
  { id:'celestial',   name:'Celestial Farm',     emoji:'🌟', unlockCost:50000000,   soilType:'celestial',  description:'Post-prestige mythic farmland beyond reality.',           weatherModifier:3.0,  cropMultiplier:10.0 },
  { id:'arctic',      name:'Arctic Tundra',      emoji:'🧊', unlockCost:150000,     soilType:'highlands',  description:'Extreme cold unlocks rare frost crops.',                  weatherModifier:0.8,  cropMultiplier:1.8  },
  { id:'rainforest',  name:'Rainforest Canopy',  emoji:'🌿', unlockCost:400000,     soilType:'riverlands', description:'Lush biodiversity for exotic botanicals.',               weatherModifier:2.0,  cropMultiplier:2.5  },
  { id:'coral_atoll', name:'Coral Atoll Farm',   emoji:'🌊', unlockCost:700000,     soilType:'riverlands', description:'Island farming with ocean-boosted minerals.',            weatherModifier:1.8,  cropMultiplier:2.8  },
  { id:'underground', name:'Underground Cave Farm',emoji:'⛏️',unlockCost:2000000,   soilType:'volcanic',   description:'Geothermal caves with bioluminescent crops.',            weatherModifier:1.0,  cropMultiplier:4.0  },
  { id:'moon_colony', name:'Lunar Colony',       emoji:'🌙', unlockCost:10000000,   soilType:'celestial',  description:'Low-gravity farming on the Moon.',                       weatherModifier:2.5,  cropMultiplier:7.0  },
  { id:'mars_base',   name:'Mars Agricultural Base',emoji:'🔴',unlockCost:30000000, soilType:'celestial',  description:'Red planet farming with terraforming tech.',             weatherModifier:2.0,  cropMultiplier:8.5  },
];

// ─────────────── UPGRADES (150 — representative set) ─────────────────────────
export interface Upgrade {
  id: string;
  name: string;
  emoji: string;
  category: string;
  level: number;
  baseCost: number;
  maxLevel: number;
  effectType: string;
  effectValue: number;
  description: string;
}

const makeUpgrade = (
  id: string, name: string, emoji: string, category: string,
  baseCost: number, maxLevel: number, effectType: string, effectValue: number, description: string
): Upgrade[] =>
  Array.from({ length: maxLevel }, (_, i) => ({
    id: `${id}_${i + 1}`,
    name: `${name} ${['I','II','III','IV','V','VI','VII','VIII','IX','X'][i] || `Lv${i+1}`}`,
    emoji,
    category,
    level: i + 1,
    baseCost: Math.round(baseCost * Math.pow(1.15, i)),
    maxLevel,
    effectType,
    effectValue: effectValue * (i + 1),
    description: `${description} (Level ${i + 1})`,
  }));

export const UPGRADES: Upgrade[] = [
  ...makeUpgrade('soil_quality',  'Soil Quality',       '🌱', 'farming',    100,    10, 'crop_yield',     0.05, 'Increases crop yield'),
  ...makeUpgrade('water_save',    'Water Conservation', '💧', 'farming',    200,    10, 'growth_speed',   0.04, 'Speeds crop growth'),
  ...makeUpgrade('seed_genetics', 'Seed Genetics',      '🧬', 'farming',    500,    10, 'crop_value',     0.06, 'Improves crop base value'),
  ...makeUpgrade('mach_lubri',    'Machine Lubrication','⚙️', 'automation', 300,    10, 'machine_eff',    0.05, 'Improves machine efficiency'),
  ...makeUpgrade('auto_timing',   'Auto Timing',        '⏱️', 'automation', 800,    10, 'automation_spd', 0.07, 'Speeds automation cycle'),
  ...makeUpgrade('factory_line',  'Factory Line',       '🏭', 'automation', 2000,   10, 'processing_spd', 0.06, 'Speeds processing chains'),
  ...makeUpgrade('market_intel',  'Market Intelligence','📈', 'economy',    400,    10, 'sell_price',     0.05, 'Increases sell prices'),
  ...makeUpgrade('bulk_trade',    'Bulk Trading',       '📦', 'economy',    1000,   10, 'trade_volume',   0.08, 'Increases trade volumes'),
  ...makeUpgrade('drone_range',   'Drone Range',        '🚁', 'automation', 5000,   5,  'drone_eff',      0.10, 'Extends drone range'),
  ...makeUpgrade('prestige_buff', 'Prestige Mastery',   '🏆', 'prestige',   10000,  5,  'prestige_pts',   0.15, 'Boosts prestige points'),
  ...makeUpgrade('rare_seed',     'Rare Seed Finder',   '🌟', 'farming',    2000,   5,  'rare_chance',    0.05, 'Increases rare crop chance'),
  ...makeUpgrade('worker_train',  'Worker Training',    '📚', 'workers',    800,    10, 'worker_bonus',   0.03, 'Boosts all worker bonuses'),
  ...makeUpgrade('cold_chain',    'Cold Chain Logistics','❄️','economy',    3000,   5,  'market_bonus',   0.08, 'Reduces spoilage in trade'),
  ...makeUpgrade('solar_power',   'Solar Power Grid',   '☀️', 'automation', 6000,   5,  'machine_cost',  -0.05, 'Reduces machine running costs'),
  ...makeUpgrade('gps_planting',  'GPS Planting',       '📡', 'farming',    1500,   5,  'plant_eff',      0.08, 'Precision planting layout'),
];

// ─────────────── ACHIEVEMENTS (representative 300-style set) ─────────────────
export interface Achievement {
  id: string;
  name: string;
  emoji: string;
  description: string;
  condition: string;   // condition key
  target: number;
  reward: { type: string; value: number };
  unlocked: boolean;
}

const ach = (
  id: string, name: string, emoji: string, desc: string,
  cond: string, target: number, rType: string, rVal: number
): Achievement => ({ id, name, emoji, description: desc, condition: cond, target, reward: { type: rType, value: rVal }, unlocked: false });

export const ACHIEVEMENTS: Achievement[] = [
  // Harvesting
  ach('first_harvest',       'First Harvest',          '🌾', 'Harvest your very first crop',                   'total_harvests',    1,         'coins',     50),
  ach('harvest_10',          'Budding Farmer',          '🌱', 'Harvest 10 crops',                               'total_harvests',    10,        'coins',     200),
  ach('harvest_100',         'Seasoned Farmer',         '👨‍🌾', 'Harvest 100 crops',                              'total_harvests',    100,       'coins',     1000),
  ach('harvest_1k',          'Veteran Harvester',       '🏆', 'Harvest 1,000 crops',                            'total_harvests',    1000,      'coins',     5000),
  ach('harvest_10k',         'Grand Reaper',            '⚔️', 'Harvest 10,000 crops',                           'total_harvests',    10000,     'coins',     25000),
  ach('harvest_100k',        'Century Harvester',       '🌟', 'Harvest 100,000 crops',                          'total_harvests',    100000,    'gems',      50),
  ach('harvest_1m',          'Legendary Harvester',     '👑', 'Harvest 1,000,000 crops',                        'total_harvests',    1000000,   'gems',      200),
  // Coins
  ach('earn_1k',             'Pocket Change',           '💰', 'Earn 1,000 coins',                               'lifetime_coins',    1000,      'coins',     100),
  ach('earn_10k',            'Small Savings',           '💵', 'Earn 10,000 coins',                              'lifetime_coins',    10000,     'coins',     500),
  ach('earn_100k',           'Comfortable Wealth',      '💸', 'Earn 100,000 coins',                             'lifetime_coins',    100000,    'coins',     2000),
  ach('earn_1m',             'Millionaire Farmer',      '🏅', 'Earn 1,000,000 coins',                           'lifetime_coins',    1000000,   'gems',      20),
  ach('earn_1b',             'Billionaire Empire',      '👑', 'Earn 1,000,000,000 coins',                       'lifetime_coins',    1000000000,'gems',      500),
  // Machines
  ach('first_machine',       'Getting Mechanical',      '⚙️', 'Build your first machine',                       'total_machines',    1,         'coins',     500),
  ach('machines_10',         'Growing Arsenal',         '🔧', 'Own 10 machines',                                'total_machines',    10,        'coins',     5000),
  ach('machines_50',         'Machine Empire',          '🏭', 'Own 50 machines',                                'total_machines',    50,        'gems',      25),
  ach('machines_100',        'Full Automation',         '🤖', 'Own 100 machines',                               'total_machines',    100,       'gems',      100),
  // Workers
  ach('first_worker',        'First Employee',          '👷', 'Hire your first worker',                         'total_workers',     1,         'coins',     300),
  ach('workers_10',          'Small Team',              '👥', 'Hire 10 workers',                                'total_workers',     10,        'coins',     3000),
  ach('workers_40',          'Full Workforce',          '🏢', 'Hire 40 workers',                                'total_workers',     40,        'gems',      50),
  // Regions
  ach('first_region',        'Expansionist',            '🗺️', 'Unlock your first new region',                   'regions_unlocked',  1,         'coins',     2000),
  ach('regions_3',           'Territory Builder',       '🌍', 'Unlock 3 regions',                               'regions_unlocked',  3,         'gems',      15),
  ach('regions_6',           'Continental Farmer',      '🌐', 'Unlock 6 regions',                               'regions_unlocked',  6,         'gems',      50),
  ach('all_regions',         'Global Agricultural Empire','🏆','Unlock all 12 regions',                          'regions_unlocked',  12,        'gems',      200),
  // Prestige
  ach('first_prestige',      'Agricultural Revolution', '🌟', 'Complete your first prestige',                   'prestige_count',    1,         'gems',      100),
  ach('prestige_5',          'Revolutionary Empire',    '⭐', 'Complete 5 prestiges',                           'prestige_count',    5,         'gems',      500),
  // Speed
  ach('cps_100',             'Coin Shower',             '🚿', 'Reach 100 coins per second',                     'coins_per_sec',     100,       'coins',     10000),
  ach('cps_1k',              'Money River',             '🌊', 'Reach 1,000 coins per second',                   'coins_per_sec',     1000,      'gems',      30),
  ach('cps_100k',            'Money Tsunami',           '💥', 'Reach 100,000 coins per second',                 'coins_per_sec',     100000,    'gems',      200),
  // Crops
  ach('rare_crop',           'Rare Find',               '🌟', 'Grow a rare or better crop',                     'rare_crops_grown',  1,         'coins',     5000),
  ach('legendary_crop',      'Legendary Harvest',       '👑', 'Grow a legendary crop',                          'legendary_crops',   1,         'gems',      50),
  ach('mythic_crop',         'Mythic Farmer',           '🌌', 'Grow a mythic crop',                             'mythic_crops',      1,         'gems',      200),
  // Processing
  ach('first_chain',         'Chain Starter',           '🔗', 'Complete your first processing chain',           'chains_complete',   1,         'coins',     2000),
  ach('chains_10',           'Chain Master',            '⛓️', 'Complete 10 processing chains',                  'chains_complete',   10,        'gems',      20),
  // Weather
  ach('survived_drought',    'Drought Survivor',        '☀️', 'Survive a drought event',                        'droughts_survived', 1,         'coins',     1000),
  ach('rainstorm_bonus',     'Rain Dancer',             '🌧️', 'Benefit from 5 rainstorm events',               'rainstorms',        5,         'coins',     3000),
  // Upgrades
  ach('upgrade_10',          'Upgrade Enthusiast',      '📈', 'Purchase 10 upgrades',                           'upgrades_bought',   10,        'coins',     5000),
  ach('upgrade_50',          'Maximiser',               '🔝', 'Purchase 50 upgrades',                           'upgrades_bought',   50,        'gems',      30),
  // Skills
  ach('skill_5',             'Skilled Farmer',          '🎯', 'Unlock 5 skill nodes',                           'skills_unlocked',   5,         'coins',     3000),
  ach('skill_20',            'Skill Master',            '🧠', 'Unlock 20 skill nodes',                          'skills_unlocked',   20,        'gems',      40),
  // Time played
  ach('played_1h',           'Dedicated Farmer',        '⏰', 'Play for 1 hour',                                'seconds_played',    3600,      'coins',     5000),
  ach('played_10h',          'Farming Addict',          '🎮', 'Play for 10 hours',                              'seconds_played',    36000,     'gems',      50),
];
