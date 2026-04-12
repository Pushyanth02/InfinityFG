declare global {
  interface Window {
    __INFINITYFG_TIME_SOURCE__?: () => number;
    __INFINITYFG_RANDOM_SOURCE__?: () => number;
  }
  var __INFINITYFG_TIME_SOURCE__: (() => number) | undefined;
  var __INFINITYFG_RANDOM_SOURCE__: (() => number) | undefined;
}

let simulationNow = 0;
let simulationSeed = 0x9e3779b9;
let idCounter = 0;

const isSimulationMode =
  import.meta.env.MODE === 'test' || import.meta.env.VITE_SIMULATION_MODE === 'true';

const deterministicRandom = () => {
  simulationSeed = (simulationSeed * 1664525 + 1013904223) >>> 0;
  return simulationSeed / 0x100000000;
};

let nowProvider: () => number = isSimulationMode
  ? () => {
      simulationNow += 1;
      return simulationNow;
    }
  : () => Date.now();

let randomProvider: () => number = isSimulationMode ? deterministicRandom : () => Math.random();

const globalNowSource =
  typeof globalThis.__INFINITYFG_TIME_SOURCE__ === 'function'
    ? globalThis.__INFINITYFG_TIME_SOURCE__
    : typeof window !== 'undefined' && typeof window.__INFINITYFG_TIME_SOURCE__ === 'function'
    ? window.__INFINITYFG_TIME_SOURCE__
    : undefined;

const globalRandomSource =
  typeof globalThis.__INFINITYFG_RANDOM_SOURCE__ === 'function'
    ? globalThis.__INFINITYFG_RANDOM_SOURCE__
    : typeof window !== 'undefined' && typeof window.__INFINITYFG_RANDOM_SOURCE__ === 'function'
    ? window.__INFINITYFG_RANDOM_SOURCE__
    : undefined;

if (globalNowSource) nowProvider = globalNowSource;
if (globalRandomSource) randomProvider = globalRandomSource;

export function configureDeterministicSources(sources: {
  now?: () => number;
  random?: () => number;
}): void {
  if (sources.now) nowProvider = sources.now;
  if (sources.random) randomProvider = sources.random;
  if (sources.now) globalThis.__INFINITYFG_TIME_SOURCE__ = sources.now;
  if (sources.random) globalThis.__INFINITYFG_RANDOM_SOURCE__ = sources.random;
}

export function nowMs(): number {
  return nowProvider();
}

export function randomUnit(): number {
  return randomProvider();
}

export function createStableId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${nowMs().toString(36)}_${Math.floor(randomUnit() * 1_000_000_000).toString(36)}_${idCounter.toString(36)}`;
}
