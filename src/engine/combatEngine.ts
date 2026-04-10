export function calculateDPS(
  production: number,
  diversity: number,
  worker: number,
  machine: number,
): number {
  return production * diversity * worker * machine;
}
