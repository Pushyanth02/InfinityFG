// ============================================================
// COZY GARDEN — Story Slice
// Manages chapter progress, boss HP, quest completion, weapon ownership.
// ============================================================
import type { StateCreator } from 'zustand';
import type { GameState } from '../../types/game';
import { CHAPTERS } from '../../data/chapters';
import { getWeapon } from '../../data/cropWeapons';

export interface ChapterProgressEntry {
  bossHp: number;        // remaining HP (decremented on harvest)
  questsComplete: string[]; // quest IDs that have been checked off
  isDefeated: boolean;
}

export interface StorySlice {
  // ── Chapter state ─────────────────────────────────
  currentChapterId: string;
  chapterProgress: Record<string, ChapterProgressEntry>;

  // ── Weapon state ──────────────────────────────────
  ownedWeapons: string[];
  equippedWeaponId: string | null;

  // ── Actions ───────────────────────────────────────
  damageChapterBoss: (cropId: string, harvestCount: number) => void;
  checkQuestProgress: () => void;
  buyWeapon: (weaponId: string) => void;
  equipWeapon: (weaponId: string | null) => void;
  advanceChapter: () => void;
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

export const createStorySlice: StateCreator<
  GameState,
  [],
  [],
  StorySlice
> = (set, get) => ({
  currentChapterId: 'ch_01',
  chapterProgress: initialProgress(),
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
    const newHp = Math.max(0, progress.bossHp - rawDamage);
    const isDefeated = newHp === 0;

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
        // 'harvest' is handled externally via harvestCrop hook
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
    if (currentIdx === -1 || currentIdx >= CHAPTERS.length - 1) return;

    const nextChapter = CHAPTERS[currentIdx + 1];
    // Unlock the next region
    set(state => ({
      currentChapterId: nextChapter.id,
      unlockedRegions: state.unlockedRegions.includes(nextChapter.regionId)
        ? state.unlockedRegions
        : [...state.unlockedRegions, nextChapter.regionId],
    }));
  },
});
