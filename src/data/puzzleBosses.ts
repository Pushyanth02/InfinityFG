import PUZZLE_BOSSES from './puzzleBosses.json';
import type { PuzzleRequirement } from '../engine/puzzleBoss';

interface PuzzleBossEntry {
  id: string;
  requirements: PuzzleRequirement;
}

const PUZZLE_BOSS_DATA = PUZZLE_BOSSES as PuzzleBossEntry[];

export function getPuzzleRequirement(bossId: string): PuzzleRequirement | undefined {
  return PUZZLE_BOSS_DATA.find((entry) => entry.id === bossId)?.requirements;
}
