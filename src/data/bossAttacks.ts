import BOSSES_DATA from './bosses.json';
import type { BossAttackDefinition } from '../engine/bossAttackEngine';

interface BossAttackEntry {
  id: string;
  attacks: BossAttackDefinition[];
}

const BOSS_ATTACKS = BOSSES_DATA as BossAttackEntry[];

export function getBossAttacks(bossId: string): BossAttackDefinition[] {
  return BOSS_ATTACKS.find((boss) => boss.id === bossId)?.attacks ?? [];
}
