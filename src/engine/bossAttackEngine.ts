export type BossAttackType = 'burst' | 'drain' | 'shield' | 'stun';

export interface BossAttackDefinition {
  id: string;
  type: BossAttackType;
  cooldown: number;
  power: number;
}

export interface BossAttackRuntime extends BossAttackDefinition {
  timer: number;
}

export interface BossDebuffState {
  productionMultiplier: number;
  productionDurationSec: number;
  stunned: boolean;
  stunDurationSec: number;
}

export interface BossAttackProcessInput {
  coins: number;
  bossShield: number;
  attacks: BossAttackRuntime[];
  debuffs: BossDebuffState;
}

export interface BossAttackProcessResult {
  coins: number;
  coinDrainApplied: number;
  bossShield: number;
  attacks: BossAttackRuntime[];
  debuffs: BossDebuffState;
}

const DEFAULT_BURST_DURATION_SEC = 5;
const DEFAULT_STUN_DURATION_SEC = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function createBossDebuffState(): BossDebuffState {
  return {
    productionMultiplier: 1,
    productionDurationSec: 0,
    stunned: false,
    stunDurationSec: 0,
  };
}

export function createBossAttackRuntime(attacks: BossAttackDefinition[]): BossAttackRuntime[] {
  return attacks.map((attack) => ({
    ...attack,
    timer: Math.max(0.5, attack.cooldown),
  }));
}

export function tickBossDebuffs(debuffs: BossDebuffState, dt: number): BossDebuffState {
  if (dt <= 0) return debuffs;

  const nextProductionDuration = Math.max(0, debuffs.productionDurationSec - dt);
  const nextStunDuration = Math.max(0, debuffs.stunDurationSec - dt);
  return {
    productionMultiplier: nextProductionDuration > 0 ? debuffs.productionMultiplier : 1,
    productionDurationSec: nextProductionDuration,
    stunned: nextStunDuration > 0,
    stunDurationSec: nextStunDuration,
  };
}

function executeAttack(state: BossAttackProcessResult, attack: BossAttackRuntime): void {
  switch (attack.type) {
    case 'burst': {
      const nextMult = clamp(1 - attack.power, 0.1, 1);
      state.debuffs.productionMultiplier = Math.min(state.debuffs.productionMultiplier, nextMult);
      state.debuffs.productionDurationSec = Math.max(
        state.debuffs.productionDurationSec,
        DEFAULT_BURST_DURATION_SEC,
      );
      break;
    }
    case 'drain': {
      const drainRate = clamp(attack.power, 0, 0.95);
      const drained = state.coins * drainRate;
      state.coins = Math.max(0, state.coins - drained);
      state.coinDrainApplied += drained;
      break;
    }
    case 'shield': {
      state.bossShield += Math.max(0, attack.power);
      break;
    }
    case 'stun': {
      state.debuffs.stunned = true;
      state.debuffs.stunDurationSec = Math.max(state.debuffs.stunDurationSec, DEFAULT_STUN_DURATION_SEC);
      break;
    }
    default:
      break;
  }
}

export function processBossAttacks(
  input: BossAttackProcessInput,
  dt: number,
  cooldownMultiplier = 1,
): BossAttackProcessResult {
  if (dt <= 0 || input.attacks.length === 0) {
    return {
      coins: input.coins,
      coinDrainApplied: 0,
      bossShield: input.bossShield,
      attacks: input.attacks,
      debuffs: input.debuffs,
    };
  }

  const mutable: BossAttackProcessResult = {
    coins: input.coins,
    coinDrainApplied: 0,
    bossShield: input.bossShield,
    attacks: [],
    debuffs: { ...input.debuffs },
  };

  for (const attack of input.attacks) {
    const adjustedCooldown = Math.max(1, attack.cooldown * Math.max(0.2, cooldownMultiplier));
    const nextTimer = attack.timer - dt;
    if (nextTimer <= 0) {
      executeAttack(mutable, attack);
      mutable.attacks.push({
        ...attack,
        timer: adjustedCooldown,
      });
      continue;
    }

    mutable.attacks.push({
      ...attack,
      timer: nextTimer,
    });
  }

  return mutable;
}

export function getEffectiveProductionMultiplier(debuffs: BossDebuffState): number {
  if (debuffs.stunned) return 0;
  return clamp(debuffs.productionMultiplier, 0, 1);
}
