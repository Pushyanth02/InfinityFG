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

  // ── Weapon state ──────────────────────────────────
  ownedWeapons: string[];
  equippedWeaponId: string | null;

  // ── Actions ───────────────────────────────────────
  damageChapterBoss: (cropId: string, harvestCount: number) => void;
  tickChapterBoss: (deltaSec: number, baseDps: number) => void;
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
  ownedWeapons: [],
  equippedWeaponId: null,

  // ── damageChapterBoss ──────────────────────────────────
  damageChapterBoss: (cropId, harvestCount) => {
    const { currentChapterId, chapterProgress, equippedWeaponId } = get();
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
    const { nextHp: newHp, damageApplied } = applyBossHit(boss, progress.bossHp, rawDamage, elapsed);
    const isDefeated = newHp === 0;

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
      // Defeat reward: add coins and unlock via advanceChapter
      coins: isDefeated
        ? state.coins + boss.defeatReward.coinsBonus
        : state.coins,
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
    const { currentChapterId, chapterProgress, bossElapsedTracking } = get();
    const chapter = CHAPTERS.find((c) => c.id === currentChapterId);
    if (!chapter) return;
    const progress = chapterProgress[currentChapterId];
    if (!progress || progress.isDefeated) return;

    const elapsed = bossElapsedTracking[currentChapterId] ?? 0;
    const result = runBossTick({
      boss: chapter.boss,
      currentHp: progress.bossHp,
      baseDps,
      deltaSec,
      elapsedSec: elapsed,
    });
    const isDefeated = result.nextHp === 0;

    if (result.damageApplied > 0) {
      get().trackBossDamage(chapter.boss.id, result.damageApplied);
    }

    set((state) => ({
      coins: Math.max(0, state.coins - result.coinDrain),
      chapterProgress: {
        ...state.chapterProgress,
        [currentChapterId]: {
          ...progress,
          bossHp: result.nextHp,
          isDefeated,
        },
      },
      bossElapsedTracking: {
        ...state.bossElapsedTracking,
        [currentChapterId]: result.nextElapsedSec,
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
