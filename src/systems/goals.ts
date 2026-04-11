export interface GoalDefinition {
  id: string;
  target: number;
  reward: number;
}

export const GOALS: GoalDefinition[] = [
  { id: 'buy_10_machines', target: 10, reward: 500 },
  { id: 'earn_1000_coins', target: 1000, reward: 200 },
  { id: 'harvest_50_crops', target: 50, reward: 300 },
];

