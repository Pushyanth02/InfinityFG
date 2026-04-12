export type PuzzleRequirement =
  | { type: 'diversity'; value: number }
  | { type: 'overclock'; value: boolean };

export interface PuzzleBossContext {
  requirement?: PuzzleRequirement;
  cropDiversity: number;
  overclockActive: boolean;
}

export interface PuzzleBossResult {
  vulnerable: boolean;
}

export function processPuzzleBoss(ctx: PuzzleBossContext): PuzzleBossResult {
  const required = ctx.requirement;
  if (!required) return { vulnerable: true };

  if (required.type === 'diversity') {
    return { vulnerable: ctx.cropDiversity >= required.value };
  }

  if (required.type === 'overclock') {
    return { vulnerable: required.value ? ctx.overclockActive : !ctx.overclockActive };
  }

  return { vulnerable: true };
}
