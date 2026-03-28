# Testing Patterns

**Analysis Date:** 2026-03-28

## Test Framework

**Runner:**
- Not detected - no unit test framework configured (Jest, Vitest, etc.)
- No `.test.ts`, `.spec.ts` files in source tree (`src/`)
- Testing is performed via simulation/QA scripts, not traditional unit tests

**Assertion Library:**
- Not applicable - no traditional test framework

**Run Commands:**
```bash
npm run lint                          # Run ESLint validation
npm run build                         # Build TypeScript and bundle
npm run validate:system               # Comprehensive validation (lint + build + qa:strict)
npx tsx simulation/qa_runner.ts      # Run deterministic QA simulation
npx tsx simulation/qa_runner.ts --failOnRegression=true # Strict failure mode
npm run simulate:progression          # Pacing/progression simulator
npm run simulate:balance              # Economy balance simulator
npm run simulate:roi                  # Machine ROI simulator
```

## Test File Organization

**Location:**
- Production testing: `simulation/` directory (not `src/`)
- QA/validation runner: `simulation/qa_runner.ts`
- Progression simulator: `simulation/progression_sim.ts`
- Balance simulator: `simulation/balance_sim.ts`
- ROI simulator: `simulation/machine_roi_sim.ts`
- Test live ops: `simulation/test_live_ops.ts`
- QA thresholds config: `simulation/qa_thresholds.json`
- Reports generated to: `simulation/reports/qa_report_<timestamp>.json`

**Naming:**
- Simulation files named descriptively: `*_sim.ts` for simulation runners
- QA runner: `qa_runner.ts` with optional output naming

**Structure:**
```
simulation/
├── qa_runner.ts                  # Main deterministic QA simulation
├── qa_thresholds.json            # Pass/fail thresholds
├── balance_sim.ts                # Economy balance testing
├── progression_sim.ts            # Pacing validation
├── machine_roi_sim.ts            # ROI calculation testing
├── test_live_ops.ts              # Live ops rule validation
└── reports/                      # Generated QA reports
    └── qa_report_<timestamp>.json
```

## Test Structure

**QA Simulation Pattern:**
The `qa_runner.ts` implements a deterministic multi-player simulation with configurable profiles and thresholds.

```typescript
// From simulation/qa_runner.ts:
// 1. CLI argument parsing for configuration
const args = Object.fromEntries(
  process.argv.slice(2).map(a => a.startsWith('--') ? a.slice(2).split('=') : [a, 'true'])
);

// 2. Input schema with defaults
const INPUT = {
  num_simulations: parseInt(args['sessions'] ?? '1000'),
  player_profiles: (args['profiles'] ?? 'casual,active,whale_sim').split(','),
  duration_hours: parseInt(args['hours'] ?? '720'),
  random_seed: parseInt(args['seed'] ?? '20260315'),
};

// 3. QA thresholds loaded from config file with fallback defaults
const QA_THRESHOLDS = loadQaThresholds();

// 4. Deterministic seeded PRNG (Mulberry32) for reproducible results
function makePrng(seed: number) {
  let s = seed >>> 0;
  return (): number => {
    s += 0x6D2B79F5;
    // ... bit manipulation
    return ((t ^ (t >>> 14)) >>> 0) / 0xFFFFFFFF;
  };
}
```

**Simulation Profiles:**
- `casual`: Low play time, high passive income dependency
- `active`: Regular active play, balanced income
- `whale_sim`: Heavy spending, maximum optimization

**Metrics Tracked:**
- `ACTIVE_FIRST_HARVEST_P50_SEC_MAX`: Median time to first harvest (max 300s for active players)
- `ACTIVE_AUTOMATION_P50_MIN_MAX`: Time to establish automation (max 40 minutes)
- `INFLATION_INDEX_MAX`: Economy price scaling (max 20x baseline)
- `NO_NEGATIVE_COST_ITEMS_EQ`: Items with negative cost (must be 0)
- `INFINITE_LOOP_EQ`: Infinite resource loops (must be 0)
- `CASUAL_PRESTIGE_RATE_MAX_PCT`: Casual prestige availability (max 50%)
- `HIGH_EXPLOITS_EQ`: Known exploits triggered (must be 0)
- `CPS_SOFTCAP_BYPASS_EQ`: Bypasses to CPS soft cap (must be 0)
- `PRESTIGE_ABUSE_EQ`: Prestige abuse patterns (must be 0)
- `PROCESSOR_ARBITRAGE_MAX_PCT`: Crafting arbitrage gap (max 2%)
- `ANY_EXPLOIT_SESSIONS_MAX_PCT`: Sessions with any exploit (max 10%)

## Mocking

**Framework:** Not applicable - simulations use actual game state and mechanics

**Patterns:**
- No mocking; simulations instantiate real game mechanics
- Deterministic seeded PRNG ensures reproducibility
- Configuration loaded from JSON files (crops, machines, game config)
- Test data embedded in simulation files for portability

**What to Mock:**
- Not relevant - simulation-based testing doesn't use mocks
- Real mechanics are tested in isolation via simulation

**What NOT to Mock:**
- Core game mechanics (must test actual behavior)
- Economy calculations (must be byte-accurate)
- Event system (must validate event ordering)

## Fixtures and Factories

**Test Data:**
Simulations embed representative test data or load from config files:

```typescript
// From qa_runner.ts: Representative crop data
interface CropDef {
  id: string; growthSec: number; yieldAmt: number;
  baseValue: number; seedCost: number; rarity: string;
}

const CROPS: CropDef[] = [
  { id: 'wheat', growthSec: 30, yieldAmt: 4, baseValue: 6, seedCost: 3, rarity: 'common' },
  // ... more crops
];

// Loaded economy config
const CFG = {
  upgradeScaleFactor: 1.15,
  automationSlope: 0.22,
  prestigeDivisor: 8_000_000,
  // ... tunable parameters
};
```

**Location:**
- Test data defined inline in simulation files
- Game configuration in `game_config.json`
- Economy model in `engineering_standards.json`

## Coverage

**Requirements:** No explicit coverage target enforced

**View Coverage:** Not applicable - no traditional test runner

**Validation Approach:**
- Simulations run 1000 sessions by default; pass/fail determined by threshold comparison
- QA report generated as JSON with detailed metrics
- Regression detection via `--failOnRegression=true` flag

## Test Types

**Unit Tests:**
- Not used - testing strategy relies on system-level simulation
- Individual mechanics functions are tested implicitly through simulation

**Integration Tests:**
- QA Runner: Full game simulation with all mechanics, events, and state
- Progression Sim: Economy integration testing pacing/unlock timing
- Balance Sim: Multiplayer economy balance verification

**E2E Tests:**
- Not used in traditional sense
- Simulations serve as end-to-end validation of entire game loop

## Common Patterns

**Deterministic Testing:**
```typescript
// Seeded PRNG ensures same seed = same results
const prng = makePrng(INPUT.random_seed);

// Reproduce specific failure
npx tsx simulation/qa_runner.ts --seed=42 --sessions=100
```

**Multi-Profile Validation:**
```typescript
// Test multiple player archetypes
npx tsx simulation/qa_runner.ts --profiles=casual,active,whale_sim --sessions=1000

// Multiple scenarios
npx tsx simulation/qa_runner.ts --hours=720    // 30-day progression
npx tsx simulation/qa_runner.ts --hours=2160   // 90-day long session
```

**Pacing/Progression Testing:**
```typescript
// From progression_sim.ts: Time-to-unlock calculation
function simulatePacing(profileName: string, cpsMultiplier: number, dailyPlayHours: number) {
  let currentCoins = 0;
  let currentSecs = 0;

  for (const gate of UNLOCKS) {
    const deltaCoins = gate.coinsThreshold - currentCoins;
    const expectedCps = Math.max(1, (currentCoins / 2000)) * cpsMultiplier;
    const timeToReachSec = deltaCoins / expectedCps;
    currentSecs += timeToReachSec;
    currentCoins = gate.coinsThreshold;

    if (gate.tier > currentTier) {
      const hoursInGame = currentSecs / 3600;
      const realtimeDays = hoursInGame / dailyPlayHours;
      console.log(`Reached Tier ${currentTier}: ${hoursInGame.toFixed(2)} hrs (${realtimeDays.toFixed(1)} days)`);
    }
  }
}
```

**QA Failure Reporting:**
QA reports include exploit detection, balance violations, and regression comparisons:
```json
{
  "summary": {
    "total_sessions": 1000,
    "passed": 950,
    "failed": 50
  },
  "metrics": {
    "ACTIVE_FIRST_HARVEST_P50_SEC": 285,
    "INFLATION_INDEX": 18.5,
    "EXPLOITS_FOUND": 12
  },
  "exploits": [
    { "type": "prestige_abuse", "sessions_affected": 5, "cps_multiplier": 1200 }
  ]
}
```

## Validation Scripts

**Live Ops Testing:**
`simulation/test_live_ops.ts` - Validates live ops rule engine
- Tests rule conditions, trigger evaluation
- Validates reward calculations
- Tests rule priority and ordering

**Balance Simulation:**
`simulation/balance_sim.ts` - Economy-wide balance testing
- Tests pricing multipliers
- Validates cost scaling formulas
- Tests market dynamics and price volatility

**ROI Testing:**
`simulation/machine_roi_sim.ts` - Machine investment return validation
- Tests upgrade path ROI
- Validates payback period calculations
- Tests production per coin invested

## Error Handling in Tests

**Assertion Patterns:**
```typescript
// Threshold comparison from qa_runner.ts
if (metrics.INFLATION_INDEX > QA_THRESHOLDS.INFLATION_INDEX_MAX) {
  results.failed = true;
  results.violations.push({
    metric: 'INFLATION_INDEX',
    actual: metrics.INFLATION_INDEX,
    threshold: QA_THRESHOLDS.INFLATION_INDEX_MAX
  });
}
```

**Failure Modes:**
- Regression detection: Compare current metrics to baseline thresholds
- Exploit detection: Flag sessions where exploitable patterns emerge
- Economy validation: Confirm no infinite loops, negative costs, or soft-cap bypasses

---

*Testing analysis: 2026-03-28*
