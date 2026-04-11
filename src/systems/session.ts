export function getSessionBonus(hoursPlayed: number) {
  return 1 + Math.min(Math.max(0, hoursPlayed) * 0.05, 2);
}

export function getSessionStreakMultiplier(streakDays: number) {
  return 1 + Math.min(Math.max(0, streakDays) * 0.03, 0.5);
}

