# InfinityFG

InfinityFG is a farming automation and story progression game built with React, TypeScript, Vite, and Zustand. The repository includes gameplay systems, content generation pipelines, and simulation tooling for economy and progression QA.

## Tech Stack

- Frontend: React 19, TypeScript, Vite
- State: Zustand slices
- Tooling: ESLint, TS build mode
- Simulation: TypeScript runners via `tsx`

## Project Structure

- `src/`: game UI, state slices, gameplay engine, services
- `simulation/`: deterministic simulation and QA runners
- `economy/`: economy and progression source models
- `scripts/`: orchestration scripts
- `src/data_exports/`: canonical exported content datasets consumed by runtime data modules
- `patches/`: content/economy patch artifacts

## Getting Started

Install dependencies:

```bash
npm install
```

Run app locally:

```bash
npm run dev
```

Build production bundle:

```bash
npm run build
```

Run lint checks:

```bash
npm run lint
```

## Simulation and QA Commands

The simulation suite is deterministic and reproducible by seed.

```bash
npm run simulate:qa
npm run simulate:qa:strict
npm run simulate:progression
npm run simulate:balance
npm run simulate:roi
```

### QA Runner Details

Main entry:

```bash
npx tsx simulation/qa_runner.ts
```

Useful flags:

- `--sessions=<n>`: number of simulated sessions (default `1000`)
- `--profiles=casual,active,whale_sim`: profile mix
- `--hours=<n>`: simulation duration per session in hours (default `720`)
- `--seed=<n>`: deterministic seed
- `--failOnRegression=true`: exits non-zero if regression or sanity fails (CI mode)
- `--silent=true`: reduce console logs

Examples:

```bash
npx tsx simulation/qa_runner.ts --sessions=2000 --seed=20260316
npx tsx simulation/qa_runner.ts --profiles=casual,active --sessions=1200 --hours=480
npx tsx simulation/qa_runner.ts --failOnRegression=true
```

### QA Outputs

Each run generates:

- JSON report: `simulation/reports/qa_report_<timestamp>.json`
- Latest markdown summary: `simulation/reports/qa_summary_latest.md`

The report now includes:

- Expanded regression suite (timing, inflation, exploit rates, profile behavior)
- Threshold registry for test governance
- Failed test list
- Run metadata (runtime timing, strict mode status)

## Recommended QA Workflow

1. Run `npm run simulate:qa` while iterating on gameplay balance.
2. Inspect `simulation/reports/qa_summary_latest.md` for quick pass/fail overview.
3. Validate deep metrics in the latest JSON report.
4. Gate merges with `npm run simulate:qa:strict` in CI.

## Notes

- Simulation logic is deterministic per session seed and profile.
- The strict QA script is intended for CI and release candidate validation.
