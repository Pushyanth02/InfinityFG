import type { BossAttackType } from './bossAttackEngine';

export type BossContext = {
  hp: number;
  maxHP: number;
  playerDPS: number;
  playerCoins: number;
  debuffed: boolean;
};

export interface BossAiRuntimeState {
  enraged: boolean;
  cooldownMultiplier: number;
  forcedAttackType?: BossAttackType;
  shieldGain: number;
}

type Action = (state: BossAiRuntimeState) => void;

type Node =
  | { type: 'selector'; children: Node[] }
  | { type: 'sequence'; children: Node[] }
  | { type: 'condition'; check: (ctx: BossContext) => boolean }
  | { type: 'action'; act: Action };

export function runBehaviorTree(node: Node, ctx: BossContext, state: BossAiRuntimeState): boolean {
  switch (node.type) {
    case 'selector':
      return node.children.some((child) => runBehaviorTree(child, ctx, state));
    case 'sequence':
      return node.children.every((child) => runBehaviorTree(child, ctx, state));
    case 'condition':
      return node.check(ctx);
    case 'action':
      node.act(state);
      return true;
    default:
      return false;
  }
}

export const voidTitanTree: Node = {
  type: 'selector',
  children: [
    {
      type: 'sequence',
      children: [
        { type: 'condition', check: (ctx) => ctx.hp < ctx.maxHP * 0.3 },
        {
          type: 'action',
          act: (state) => {
            state.enraged = true;
            state.cooldownMultiplier = Math.min(state.cooldownMultiplier, 0.75);
          },
        },
      ],
    },
    {
      type: 'sequence',
      children: [
        { type: 'condition', check: (ctx) => ctx.playerDPS > ctx.hp * 0.1 },
        {
          type: 'action',
          act: (state) => {
            state.shieldGain += 10_000;
          },
        },
      ],
    },
    {
      type: 'action',
      act: (state) => {
        state.forcedAttackType = 'burst';
      },
    },
  ],
};

const defaultBossTree: Node = {
  type: 'selector',
  children: [
    {
      type: 'sequence',
      children: [
        { type: 'condition', check: (ctx) => ctx.hp < ctx.maxHP * 0.35 },
        {
          type: 'action',
          act: (state) => {
            state.enraged = true;
            state.cooldownMultiplier = Math.min(state.cooldownMultiplier, 0.85);
          },
        },
      ],
    },
    {
      type: 'action',
      act: (state) => {
        if (state.forcedAttackType === undefined) state.forcedAttackType = 'burst';
      },
    },
  ],
};

function getBossTree(bossId: string): Node {
  if (bossId === 'boss_void_blight') return voidTitanTree;
  return defaultBossTree;
}

export function evaluateBossAI(
  bossId: string,
  ctx: BossContext,
  state: BossAiRuntimeState,
): BossAiRuntimeState {
  const nextState: BossAiRuntimeState = {
    enraged: state.enraged,
    cooldownMultiplier: state.cooldownMultiplier,
    forcedAttackType: state.forcedAttackType,
    shieldGain: state.shieldGain,
  };

  runBehaviorTree(getBossTree(bossId), ctx, nextState);
  return nextState;
}
