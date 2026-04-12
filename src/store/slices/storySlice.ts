// ============================================================
// COZY GARDEN — Story Slice
// Manages chapter progress, boss HP, quest completion, weapon ownership.
// Story Book is the single source of truth for all unlocks.
// ============================================================
import type { StateCreator } from 'zustand';
import type { GameState } from '../../types/game';
import { CHAPTERS } from '../../data/chapters';
import { getWeapon } from '../../data/cropWeapons';
import { eventBus } from '../../services/eventBus';
import { VILLAGE_FOLK } from '../../data/villageFolk';
import { applyBossHit, runBossTick } from '../../engine/bossEngine';
import { applyUCW, getUcwsByRegion } from '../../engine/ucwEngine';
import { getBossAttacks } from '../../data/bossAttacks';
import {
  createBossAttackRuntime,
  createBossDebuffState,
  getEffectiveProductionMultiplier,
  processBossAttacks,
  tickBossDebuffs,
  type BossAttackRuntime,
  type BossDebuffState,
} from '../../engine/bossAttackEngine';
import { applyAdaptiveDifficulty } from '../../engine/adaptiveAI';
import { evaluateBossAI } from '../../engine/bossAI';
import {
  adaptBossToPlayer,
  detectPlayerStrategy,
  type PlayerStrategy,
} from '../../engine/playerAI';
import { processPuzzleBoss } from '../../engine/puzzleBoss';
import { getPuzzleRequirement } from '../../data/puzzleBosses';

export interface ChapterProgressEntry {
  bossHp: number;        // remaining HP (decremented on harvest)
  questsComplete: string[]; // quest IDs that have been checked off
  isDefeated: boolean;
}

export interface StorySlice {
  // ── Chapter state ─────────────────────────────────
  currentChapterId: string;
  chapterProgress: Record<string, ChapterProgressEntry>;
  unlockedFeatures: string[];
  pendingUnlocks: Array<{ id: string; reqs: string[]; cost?: number }>;
  futureUnlocksPreview: Array<{ id: string; unlockCondition: string }>;
  bossElapsedTracking: Record<string, number>;
  bossShieldTracking: Record<string, number>;
  bossAttackTracking: Record<string, BossAttackRuntime[]>;
  bossDebuffTracking: Record<string, BossDebuffState>;
  rewardMultiplierTracking: Record<string, number>;
  bossEnrageTracking: Record<string, boolean>;
  bossVulnerabilityTracking: Record<string, boolean>;
  playerStrategyTracking: Record<string, PlayerStrategy>;
  unlockedUcws: string[];
  activeUCW: string[];

  // ── Weapon state ──────────────────────────────────
  ownedWeapons: string[];
  equippedWeaponId: string | null;

  // ── Actions ───────────────────────────────────────
  damageChapterBoss: (cropId: string, harvestCount: number) => void;
  tickChapterBoss: (deltaSec: number, baseDps: number) => void;
  tickBossCombatState: (deltaSec: number) => void;
  getBossProductionMultiplier: () => number;
  getBossRewardMultiplier: () => number;
  unlockUCW: (ucwId: string) => void;
  equipUCW: (ucwId: string) => void;
  checkQuestProgress: () => void;
  buyWeapon: (weaponId: string) => void;
  equipWeapon: (weaponId: string | null) => void;
  advanceChapter: () => void;
  refreshProgressionBuckets: () => void;
}

// Initialise progress entries for all chapters
const initialProgress = (): Record<string, ChapterProgressEntry> => {
  const map: Record<string, ChapterProgressEntry> = {};
  for (const ch of CHAPTERS) {
    map[ch.id] = {
      bossHp: ch.boss.maxHp,
      questsComplete: [],
      isDefeated: false,
    };
  }
  return map;
};

const initialBossElapsed = (): Record<string, number> => {
  const map: Record<string, number> = {};
  for (const ch of CHAPTERS) map[ch.id] = 0;
  return map;
};

const SHIELDED_MECHANICS = new Set(['hardened_cores', 'core_harden', 'acid_resist', 'fire_shell']);

const initialBossShield = (): Record<string, number> => {
  const map: Record<string, number> = {};
  for (const ch of CHAPTERS) {
    const shielded = ch.boss.mechanics?.some((m) => SHIELDED_MECHANICS.has(m)) ?? false;
    map[ch.id] = shielded ? Math.floor(ch.boss.maxHp * 0.2) : 0;
  }
  return map;
};

const initialBossAttacks = (): Record<string, BossAttackRuntime[]> => {
  const map: Record<string, BossAttackRuntime[]> = {};
  for (const ch of CHAPTERS) {
    map[ch.id] = createBossAttackRuntime(getBossAttacks(ch.boss.id));
  }
  return map;
};

const initialBossDebuffs = (): Record<string, BossDebuffState> => {
  const map: Record<string, BossDebuffState> = {};
  for (const ch of CHAPTERS) map[ch.id] = createBossDebuffState();
  return map;
};

const initialRewardMultipliers = (): Record<string, number> => {
  const map: Record<string, number> = {};
  for (const ch of CHAPTERS) map[ch.id] = 1;
  return map;
};

const initialBossEnrage = (): Record<string, boolean> => {
  const map: Record<string, boolean> = {};
  for (const ch of CHAPTERS) map[ch.id] = false;
  return map;
};

const initialBossVulnerability = (): Record<string, boolean> => {
  const map: Record<string, boolean> = {};
  for (const ch of CHAPTERS) map[ch.id] = true;
  return map;
};

const initialPlayerStrategies = (): Record<string, PlayerStrategy> => {
  const map: Record<string, PlayerStrategy> = {};
  for (const ch of CHAPTERS) map[ch.id] = 'balanced';
  return map;
};

function getActiveUcwsForChapter(chapterNumber: number, unlockedUcws: string[], activeUCW: string[]) {
  const chapterUcws = getUcwsByRegion(chapterNumber);
  const unlockedForChapter = chapterUcws.filter((ucw) => unlockedUcws.includes(ucw.id));
  if (unlockedForChapter.length === 0) return [];

  const manuallyActive = unlockedForChapter.filter((ucw) => activeUCW.includes(ucw.id));
  if (manuallyActive.length > 0) return manuallyActive;

  // Fallback: automatically use the highest-region unlocked UCW available.
  const fallback = unlockedForChapter.sort((a, b) => b.region - a.region)[0];
  return fallback ? [fallback] : [];
}

function getPlayTimeHours(state: GameState): number {
  return Math.max(1 / 60, state.totalPlayTimeSec / 3600);
}

function getCropDiversity(state: GameState): number {
  const harvestedDiversity = Object.values(state.harvestTracking ?? {}).filter((count) => count > 0).length;
  if (harvestedDiversity > 0) return harvestedDiversity;
  return new Set(
    state.plots
      .map((plot) => plot.cropId)
      .filter((cropId): cropId is string => Boolean(cropId)),
  ).size;
}

function getAdaptiveProfile(state: GameState, chapterNumber: number, bossBaseHp: number) {
  const latestCoinsPerMinute = state.coinsPerMinuteSamples.at(-1) ?? 0;
  return applyAdaptiveDifficulty({
    coinsPerSecond: latestCoinsPerMinute / 60,
    lifetimeCoins: state.lifetimeCoins,
    chapterNumber,
    playTimeHours: getPlayTimeHours(state),
    bossBaseHp,
  });
}

function ensureAttackRuntime(
  attacks: BossAttackRuntime[],
  extraAttack?: { id: string; type: BossAttackRuntime['type']; cooldown: number; power: number },
): BossAttackRuntime[] {
  if (!extraAttack) return attacks;
  if (attacks.some((attack) => attack.id === extraAttack.id)) return attacks;
  return [
    ...attacks,
    {
      ...extraAttack,
      timer: Math.max(1, extraAttack.cooldown),
    },
  ];
}

function forceAttack(attacks: BossAttackRuntime[], type: BossAttackRuntime['type'] | undefined): BossAttackRuntime[] {
  if (!type) return attacks;
  return attacks.map((attack) => {
    if (attack.type !== type) return attack;
    return {
      ...attack,
      timer: 0,
    };
  });
}

export const createStorySlice: StateCreator<
  GameState,
  [],
  [],
  StorySlice
> = (set, get) => ({
  currentChapterId: 'ch_01',
  chapterProgress: initialProgress(),
  unlockedFeatures: ['chapter_ch_01'],
  pendingUnlocks: VILLAGE_FOLK.filter((w) => w.tier <= 1).map((w) => ({
    id: w.worker_id,
    reqs: [`Reach Chapter ${w.tier}`],
    cost: w.hireCost,
  })),
  futureUnlocksPreview: VILLAGE_FOLK.filter((w) => w.tier > 1).map((w) => ({
    id: w.worker_id,
    unlockCondition: `Reach Chapter ${w.tier}`,
  })),
  bossElapsedTracking: initialBossElapsed(),
  bossShieldTracking: initialBossShield(),
  bossAttackTracking: initialBossAttacks(),
  bossDebuffTracking: initialBossDebuffs(),
  rewardMultiplierTracking: initialRewardMultipliers(),
  bossEnrageTracking: initialBossEnrage(),
  bossVulnerabilityTracking: initialBossVulnerability(),
  playerStrategyTracking: initialPlayerStrategies(),
  unlockedUcws: [],
  activeUCW: [],
  ownedWeapons: [],
  equippedWeaponId: null,

  // ── damageChapterBoss ──────────────────────────────────
  damageChapterBoss: (cropId, harvestCount) => {
    const snapshot = get();
    const { currentChapterId, chapterProgress, equippedWeaponId } = snapshot;
    const chapter = CHAPTERS.find(c => c.id === currentChapterId);
    if (!chapter) return;

    const progress = chapterProgress[currentChapterId];
    if (!progress || progress.isDefeated) return;

    const boss = chapter.boss;

    // Weak crop bonus
    const isWeak = boss.weakCropIds.includes(cropId);
    const weakMult = isWeak ? 3 : 1;

    // Equipped weapon bonus (boss_damage_mult or all_mult only)
    let weaponMult = 1;
    if (equippedWeaponId && equippedWeaponId === chapter.cropWeaponId) {
      const weapon = getWeapon(equippedWeaponId);
      if (weapon && (weapon.effect.type === 'boss_damage_mult' || weapon.effect.type === 'all_mult')) {
        weaponMult = weapon.effect.value;
      }
    }

    const rawDamage = harvestCount * boss.damagePerCrop * weakMult * weaponMult;
    const elapsed = get().bossElapsedTracking[currentChapterId] ?? 0;
    const activeUcws = getActiveUcwsForChapter(chapter.number, get().unlockedUcws, get().activeUCW);
    const puzzle = processPuzzleBoss({
      requirement: getPuzzleRequirement(boss.id),
      cropDiversity: getCropDiversity(snapshot),
      overclockActive: activeUcws.length > 0,
    });
    const ucwState = {
      bossHP: progress.bossHp,
      bossShield: get().bossShieldTracking[currentChapterId] ?? 0,
      activeUCW: activeUcws,
    };
    const boostedDamage = applyUCW(ucwState, rawDamage, 1);
    let postShieldDamage = boostedDamage;
    if (ucwState.bossShield > 0) {
      const absorbed = Math.min(ucwState.bossShield, postShieldDamage);
      ucwState.bossShield -= absorbed;
      postShieldDamage -= absorbed;
    }
    const difficulty = getAdaptiveProfile(snapshot, chapter.number, boss.maxHp);
    const hpScale = Math.max(0.25, difficulty.bossMaxHp / Math.max(1, boss.maxHp));
    const { nextHp: newHp, damageApplied } = applyBossHit(
      boss,
      ucwState.bossHP,
      (puzzle.vulnerable ? postShieldDamage : 0) / hpScale,
      elapsed,
    );
    const isDefeated = newHp === 0;
    const rewardMult = snapshot.rewardMultiplierTracking[currentChapterId] ?? difficulty.rewardMultiplier;
    const rewardCoins = isDefeated ? boss.defeatReward.coinsBonus * rewardMult : 0;

    if (damageApplied > 0) {
      get().trackBossDamage(boss.id, damageApplied);
    }

    set(state => ({
      chapterProgress: {
        ...state.chapterProgress,
        [currentChapterId]: {
          ...progress,
          bossHp: newHp,
          isDefeated,
        },
      },
      bossShieldTracking: {
        ...state.bossShieldTracking,
        [currentChapterId]: ucwState.bossShield,
      },
      rewardMultiplierTracking: {
        ...state.rewardMultiplierTracking,
        [currentChapterId]: difficulty.rewardMultiplier,
      },
      bossVulnerabilityTracking: {
        ...state.bossVulnerabilityTracking,
        [currentChapterId]: puzzle.vulnerable,
      },
      // Defeat reward: add coins and unlock via advanceChapter
      coins: state.coins + rewardCoins,
    }));

    // Auto-advance chapter on defeat
    if (isDefeated) {
      // Emit boss defeated event
      eventBus.emit('BOSS_DEFEATED', {
        bossId: boss.id,
        bossName: boss.name,
        reward: boss.defeatReward.coinsBonus,
      });

      get().advanceChapter();
    }
  },

  tickChapterBoss: (deltaSec, baseDps) => {
    if (deltaSec <= 0 || baseDps <= 0) return;
    const snapshot = get();
    const { currentChapterId, chapterProgress, bossElapsedTracking } = snapshot;
    const chapter = CHAPTERS.find((c) => c.id === currentChapterId);
    if (!chapter) return;
    const progress = chapterProgress[currentChapterId];
    if (!progress || progress.isDefeated) return;

    const elapsed = bossElapsedTracking[currentChapterId] ?? 0;
    const difficulty = getAdaptiveProfile(snapshot, chapter.number, chapter.boss.maxHp);
    const hpScale = Math.max(0.25, difficulty.bossMaxHp / Math.max(1, chapter.boss.maxHp));

    const totalMachines = snapshot.machines.reduce((sum, machine) => sum + machine.count, 0);
    const strategy = detectPlayerStrategy({
      totalMachines,
      cropDiversity: getCropDiversity(snapshot),
      prestigeCount: snapshot.prestigeCount,
      playTimeHours: getPlayTimeHours(snapshot),
    });
    const adaptation = adaptBossToPlayer(strategy);

    let attacks = snapshot.bossAttackTracking[currentChapterId]
      ?? createBossAttackRuntime(getBossAttacks(chapter.boss.id));
    attacks = ensureAttackRuntime(attacks, adaptation.extraAttack);
    const debuffs = snapshot.bossDebuffTracking[currentChapterId] ?? createBossDebuffState();
    const aiState = evaluateBossAI(
      chapter.boss.id,
      {
        hp: progress.bossHp,
        maxHP: chapter.boss.maxHp,
        playerDPS: baseDps,
        playerCoins: snapshot.coins,
        debuffed: debuffs.stunned || debuffs.productionMultiplier < 1,
      },
      {
        enraged: snapshot.bossEnrageTracking[currentChapterId] ?? false,
        cooldownMultiplier: 1,
        forcedAttackType: undefined,
        shieldGain: 0,
      },
    );
    attacks = forceAttack(attacks, aiState.forcedAttackType);

    let additionalShield = aiState.shieldGain;
    if (adaptation.shieldGain > 0) {
      const intervalSec = 20;
      const crossedInterval = Math.floor((elapsed + deltaSec) / intervalSec) > Math.floor(elapsed / intervalSec);
      if (crossedInterval) additionalShield += adaptation.shieldGain;
    }

    const effectiveCooldownMultiplier =
      difficulty.attackCooldownMultiplier * adaptation.cooldownMultiplier * aiState.cooldownMultiplier;

    const attackResult = processBossAttacks({
      coins: snapshot.coins,
      bossShield: (snapshot.bossShieldTracking[currentChapterId] ?? 0) + additionalShield,
      attacks,
      debuffs,
    }, deltaSec, effectiveCooldownMultiplier);

    const activeUcws = getActiveUcwsForChapter(chapter.number, get().unlockedUcws, get().activeUCW);
    const puzzle = processPuzzleBoss({
      requirement: getPuzzleRequirement(chapter.boss.id),
      cropDiversity: getCropDiversity(snapshot),
      overclockActive: activeUcws.length > 0,
    });
    const ucwState = {
      bossHP: progress.bossHp,
      bossShield: attackResult.bossShield,
      activeUCW: activeUcws,
    };
    const shieldPenalty = ucwState.bossShield > 0 ? 0.35 : 1;
    const boostedDps = applyUCW(ucwState, baseDps * shieldPenalty, deltaSec);
    const result = runBossTick({
      boss: chapter.boss,
      currentHp: ucwState.bossHP,
      baseDps: (puzzle.vulnerable ? boostedDps : 0) / hpScale,
      deltaSec,
      elapsedSec: elapsed,
    });
    const isDefeated = result.nextHp === 0;
    const rewardCoins = isDefeated ? chapter.boss.defeatReward.coinsBonus * difficulty.rewardMultiplier : 0;

    if (result.damageApplied > 0) {
      get().trackBossDamage(chapter.boss.id, result.damageApplied);
    }

    set((state) => ({
      coins: Math.max(0, state.coins - attackResult.coinDrainApplied - result.coinDrain + rewardCoins),
      chapterProgress: {
        ...state.chapterProgress,
        [currentChapterId]: {
          ...progress,
          bossHp: result.nextHp,
          isDefeated,
        },
      },
      bossShieldTracking: {
        ...state.bossShieldTracking,
        [currentChapterId]: ucwState.bossShield,
      },
      bossAttackTracking: {
        ...state.bossAttackTracking,
        [currentChapterId]: attackResult.attacks,
      },
      bossDebuffTracking: {
        ...state.bossDebuffTracking,
        [currentChapterId]: attackResult.debuffs,
      },
      bossElapsedTracking: {
        ...state.bossElapsedTracking,
        [currentChapterId]: result.nextElapsedSec,
      },
      rewardMultiplierTracking: {
        ...state.rewardMultiplierTracking,
        [currentChapterId]: difficulty.rewardMultiplier,
      },
      bossEnrageTracking: {
        ...state.bossEnrageTracking,
        [currentChapterId]: aiState.enraged,
      },
      bossVulnerabilityTracking: {
        ...state.bossVulnerabilityTracking,
        [currentChapterId]: puzzle.vulnerable,
      },
      playerStrategyTracking: {
        ...state.playerStrategyTracking,
        [currentChapterId]: strategy,
      },
    }));

    if (isDefeated) {
      eventBus.emit('BOSS_DEFEATED', {
        bossId: chapter.boss.id,
        bossName: chapter.boss.name,
        reward: chapter.boss.defeatReward.coinsBonus,
      });
      get().advanceChapter();
    }
  },

  tickBossCombatState: (deltaSec) => {
    if (deltaSec <= 0) return;
    const { currentChapterId, chapterProgress, bossDebuffTracking } = get();
    const progress = chapterProgress[currentChapterId];
    if (!progress || progress.isDefeated) return;
    const currentDebuff = bossDebuffTracking[currentChapterId] ?? createBossDebuffState();
    const nextDebuff = tickBossDebuffs(currentDebuff, deltaSec);
    set((state) => ({
      bossDebuffTracking: {
        ...state.bossDebuffTracking,
        [currentChapterId]: nextDebuff,
      },
    }));
  },

  getBossProductionMultiplier: () => {
    const { currentChapterId, chapterProgress, bossDebuffTracking } = get();
    const progress = chapterProgress[currentChapterId];
    if (!progress || progress.isDefeated) return 1;
    const debuff = bossDebuffTracking[currentChapterId] ?? createBossDebuffState();
    return getEffectiveProductionMultiplier(debuff);
  },

  getBossRewardMultiplier: () => {
    const { currentChapterId, rewardMultiplierTracking } = get();
    return rewardMultiplierTracking[currentChapterId] ?? 1;
  },

  unlockUCW: (ucwId) => {
    const ucw = getUcwsByRegion(CHAPTERS.length).find((entry) => entry.id === ucwId);
    const chapter = CHAPTERS.find((c) => c.id === get().currentChapterId);
    if (!ucw || !chapter) return;
    if (ucw.region > chapter.number) return;
    const { coins, unlockedUcws } = get();
    if (unlockedUcws.includes(ucwId) || coins < ucw.cost) return;

    set((state) => ({
      coins: state.coins - ucw.cost,
      unlockedUcws: [...state.unlockedUcws, ucwId],
      activeUCW: state.activeUCW.includes(ucwId) ? state.activeUCW : [...state.activeUCW, ucwId],
    }));
  },

  equipUCW: (ucwId) => {
    const { unlockedUcws } = get();
    if (!unlockedUcws.includes(ucwId)) return;
    set((state) => ({
      activeUCW: state.activeUCW.includes(ucwId)
        ? state.activeUCW
        : [...state.activeUCW, ucwId],
    }));
  },

  // ── checkQuestProgress ────────────────────────────────────
  checkQuestProgress: () => {
    const {
      currentChapterId, chapterProgress,
      lifetimeCoins, machines, workers,
    } = get();

    const chapter = CHAPTERS.find(c => c.id === currentChapterId);
    if (!chapter) return;

    const progress = chapterProgress[currentChapterId];
    const newlyComplete: string[] = [];

    for (const quest of chapter.quests) {
      if (progress.questsComplete.includes(quest.id)) continue;

      let met = false;
      switch (quest.objective.type) {
        case 'earn':
          met = lifetimeCoins >= quest.objective.amount;
          break;
        case 'deploy': {
          const total = machines.reduce((s, m) => s + m.count, 0);
          met = total >= quest.objective.amount;
          break;
        }
        case 'hire': {
          const total = Object.values(workers).reduce((s, n) => s + n, 0);
          met = total >= quest.objective.amount;
          break;
        }
        case 'harvest': {
          // Use tracking slice for harvest quests
          const harvestTracking = get().harvestTracking ?? {};
          if (quest.objective.targetId) {
            // Specific crop harvest tracking
            const harvested = harvestTracking[quest.objective.targetId] ?? 0;
            met = harvested >= quest.objective.amount;
          } else {
            // Total harvest tracking
            const totalHarvested = Object.values(harvestTracking).reduce((s, n) => s + n, 0);
            met = totalHarvested >= quest.objective.amount;
          }
          break;
        }
        default:
          break;
      }

      if (met) newlyComplete.push(quest.id);
    }

    if (!newlyComplete.length) return;

    // Award quest coins
    const bonusCoins = newlyComplete.reduce((sum, qId) => {
      const q = chapter.quests.find(q => q.id === qId);
      return sum + (q?.reward.coins ?? 0);
    }, 0);

    set(state => ({
      coins: state.coins + bonusCoins,
      chapterProgress: {
        ...state.chapterProgress,
        [currentChapterId]: {
          ...progress,
          questsComplete: [...progress.questsComplete, ...newlyComplete],
        },
      },
    }));

    // Emit quest completed events
    for (const questId of newlyComplete) {
      const quest = chapter.quests.find(q => q.id === questId);
      if (quest) {
        eventBus.emit('QUEST_COMPLETED', {
          questId,
          title: quest.title,
          reward: quest.reward.coins,
        });
      }
    }

    get().refreshProgressionBuckets();
  },

  // ── buyWeapon ─────────────────────────────────────────────
  buyWeapon: (weaponId) => {
    const weapon = getWeapon(weaponId);
    const { coins, ownedWeapons } = get();
    if (!weapon || ownedWeapons.includes(weaponId) || coins < weapon.cost) return;

    set(state => ({
      coins: state.coins - weapon.cost,
      ownedWeapons: [...state.ownedWeapons, weaponId],
      equippedWeaponId: weaponId,
    }));
  },

  // ── equipWeapon ───────────────────────────────────────────
  equipWeapon: (weaponId) => {
    set({ equippedWeaponId: weaponId });
  },

  // ── advanceChapter ────────────────────────────────────────
  advanceChapter: () => {
    const { currentChapterId } = get();
    const currentIdx = CHAPTERS.findIndex(c => c.id === currentChapterId);
    const currentChapter = CHAPTERS[currentIdx];

    if (currentIdx === -1 || currentIdx >= CHAPTERS.length - 1) return;

    const nextChapter = CHAPTERS[currentIdx + 1];

    // Emit chapter completed event
    eventBus.emit('CHAPTER_COMPLETED', {
      chapterId: currentChapterId,
      chapterNumber: currentChapter?.number ?? currentIdx + 1,
      bossName: currentChapter?.boss.name ?? 'Unknown Boss',
    });

    // Unlock the next region
    set(state => ({
      currentChapterId: nextChapter.id,
      currentRegion: nextChapter.regionId,
      unlockedRegions: state.unlockedRegions.includes(nextChapter.regionId)
        ? state.unlockedRegions
        : [...state.unlockedRegions, nextChapter.regionId],
      chapterTokens: state.chapterTokens.includes(`${nextChapter.regionId}_token`)
        ? state.chapterTokens
        : [...state.chapterTokens, `${nextChapter.regionId}_token`],
    }));

    // Emit region unlocked event
    eventBus.emit('REGION_UNLOCKED', {
      regionId: nextChapter.regionId,
      regionName: nextChapter.title,
    });
    get().trackRegionTransition(currentChapter.regionId, nextChapter.regionId);

    // Emit chapter started event
    eventBus.emit('CHAPTER_STARTED', {
      chapterId: nextChapter.id,
      chapterNumber: nextChapter.number,
      title: nextChapter.title,
    });

    get().refreshProgressionBuckets();
  },

  // ── refreshProgressionBuckets ───────────────────────────
  refreshProgressionBuckets: () => {
    const state = get();
    const chapter = CHAPTERS.find((c) => c.id === state.currentChapterId) ?? CHAPTERS[0];
    const previousPending = new Set(state.pendingUnlocks.map((p) => p.id));

    const unlockedFeatures = [
      `chapter_${chapter.id}`,
      ...state.unlockedSkills,
      ...state.unlockedRegions,
      ...state.ownedWeapons,
    ];

    const pendingUnlocks: Array<{ id: string; reqs: string[]; cost?: number }> = [];
    const futureUnlocksPreview: Array<{ id: string; unlockCondition: string }> = [];

    for (const worker of VILLAGE_FOLK) {
      if (state.workers[worker.worker_id]) {
        unlockedFeatures.push(worker.worker_id);
        continue;
      }

      if (chapter.number >= worker.tier) {
        pendingUnlocks.push({
          id: worker.worker_id,
          reqs: [`Reach Chapter ${worker.tier}`],
          cost: worker.hireCost,
        });
      } else {
        futureUnlocksPreview.push({
          id: worker.worker_id,
          unlockCondition: `Reach Chapter ${worker.tier}`,
        });
      }
    }

    set({
      unlockedFeatures: Array.from(new Set(unlockedFeatures)),
      pendingUnlocks,
      futureUnlocksPreview,
    });

    for (const entry of pendingUnlocks) {
      if (!previousPending.has(entry.id)) {
        const worker = VILLAGE_FOLK.find((w) => w.worker_id === entry.id);
        if (worker) {
          eventBus.emit('WORKER_UNLOCKED', {
            workerId: worker.worker_id,
            workerName: worker.name,
          });
        }
      }
    }
  },
});
