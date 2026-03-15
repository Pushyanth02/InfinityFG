import React, { useEffect, useMemo, useState } from 'react';
import { useGameStore, fmt } from '../store/gameStore';
import { CHAPTERS } from '../data/chapters';
import { CROP_WEAPONS } from '../data/cropWeapons';
import { CROPS } from '../data/crops';
import { getVisibility } from '../services/unlockService';
import { marketService, type MarketPrice } from '../services/marketService';
// Use the JSON achievement shape from narrative_content.json
import narrativeData from '../data_exports/narrative_content.json';

interface NarrativeAchievement {
  id: string;
  category: string;
  title: string;
  requirement: string;
  flavor_text: string;
  loc_key: string;
}

const ACHIEVEMENTS: NarrativeAchievement[] = narrativeData.achievements as NarrativeAchievement[];

// ─── Tab configuration ────────────────────────────────────────
const TABS = [
  { id: 'chapter',      label: 'Active Chapter',    emoji: '📖' },
  { id: 'boss',         label: 'Chapter Boss',       emoji: '🗡️' },
  { id: 'encyclopedia', label: 'Crop Encyclopedia',  emoji: '🌿' },
  { id: 'ledger',       label: 'Market Ledger',      emoji: '🧾' },
  { id: 'weapons',      label: 'Crop Weapons',       emoji: '🌟' },
  { id: 'deeds',        label: 'Hall of Deeds',      emoji: '🏅' },
] as const;
type TabId = typeof TABS[number]['id'];

const weatherEmojis = ['☀️', '🌤️', '⛅', '🌧️', '🌈'];
const bookEmojis    = ['🌸', '🌻', '🌺', '🍄', '🌿', '🦋', '🐝', '🍓', '🌈', '🏡'];

// ─── Main Panel ───────────────────────────────────────────────
const StoryBookPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('chapter');

  const {
    currentChapterId, chapterProgress,
    ownedWeapons, equippedWeaponId,
    buyWeapon, equipWeapon,
    coins, unlockedCrops,
    lifetimeCoins,
    unlockedSkills,
    unlockedRegions,
    machines,
    workers,
    harvestTracking,
    bossDamageTracking,
    regionReputation,
    craftingTracking,
    unlockedFeatures,
    pendingUnlocks,
    futureUnlocksPreview,
  } = useGameStore();

  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>(() => marketService.getAllPrices());
  const [weatherIdx, setWeatherIdx] = useState(0);

  const chapter = CHAPTERS.find(c => c.id === currentChapterId) ?? CHAPTERS[0];
  const progress = chapterProgress[chapter.id] ?? { bossHp: chapter.boss.maxHp, questsComplete: [], isDefeated: false };
  const bossHpPct = Math.max(0, (progress.bossHp / chapter.boss.maxHp) * 100);

  const unlockState = useMemo(() => ({
    currentChapterId,
    chapterProgress,
    lifetimeCoins,
    unlockedSkills,
    unlockedRegions,
    machines,
    workers,
    harvestTracking,
    bossDamageTracking,
    regionReputation,
    craftingTracking,
  }), [
    currentChapterId,
    chapterProgress,
    lifetimeCoins,
    unlockedSkills,
    unlockedRegions,
    machines,
    workers,
    harvestTracking,
    bossDamageTracking,
    regionReputation,
    craftingTracking,
  ]);

  useEffect(() => {
    const refreshPrices = () => setMarketPrices(marketService.getAllPrices());
    refreshPrices();
    const timer = window.setInterval(refreshPrices, 15_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setWeatherIdx((prev) => (prev + 1) % weatherEmojis.length);
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 960, margin: '0 auto' }}>

      {/* ── Panel Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1.5px solid var(--brown-border)', paddingBottom: 'var(--space-md)', marginBottom: 0 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--brown-dark)', lineHeight: 1.1 }}>
            📚 Story Book
          </h2>
          <p className="panel-subtitle" style={{ marginTop: 4 }}>
            Your garden journal — every chapter a new adventure, every harvest a new chapter.
          </p>
        </div>
        <div style={{ textAlign: 'right', background: 'var(--amber-pale)', borderRadius: 'var(--radius-md)', padding: '8px 14px', border: '1.5px solid rgba(201,124,46,0.3)' }}>
          <div className="panel-subtitle">Chapter</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--amber)' }}>
            {chapter.emoji} {chapter.number} / {CHAPTERS.length}
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{
        display: 'flex', gap: 4, flexWrap: 'wrap',
        padding: 'var(--space-sm) 0',
        borderBottom: '1.5px solid var(--brown-border)',
        marginBottom: 'var(--space-md)',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px',
              fontFamily: 'var(--font-display)', fontSize: '0.78rem',
              cursor: 'pointer', transition: 'all 0.15s',
              borderRadius: 'var(--radius-sm)',
              border: activeTab === tab.id ? '1.5px solid var(--brown-mid)' : '1.5px solid transparent',
              background: activeTab === tab.id ? 'linear-gradient(135deg, var(--amber-pale), var(--surface))' : 'transparent',
              color: activeTab === tab.id ? 'var(--brown-dark)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.id ? 700 : 400,
              boxShadow: activeTab === tab.id ? 'var(--shadow-card)' : 'none',
            }}
          >
            <span style={{ fontSize: '0.9rem' }}>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════
          TAB: ACTIVE CHAPTER
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'chapter' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Chapter card */}
          <div className="glass-panel" style={{ padding: 'var(--space-lg)', background: 'linear-gradient(135deg, var(--amber-pale), var(--surface))', borderColor: 'rgba(201,124,46,0.35)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '3rem', flexShrink: 0 }}>{chapter.emoji}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'var(--amber-pale)', border: '1px solid rgba(201,124,46,0.3)', borderRadius: 'var(--radius-xl)', padding: '2px 8px' }}>
                    Chapter {chapter.number}
                  </span>
                  {progress.isDefeated && (
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', fontWeight: 700, color: '#fff', background: 'var(--green-mid)', borderRadius: 'var(--radius-xl)', padding: '2px 8px' }}>
                      ✅ Complete!
                    </span>
                  )}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--brown-dark)', margin: '6px 0 4px' }}>{chapter.title}</h3>
                <p style={{ fontFamily: 'var(--font-main)', fontSize: '0.72rem', lineHeight: 1.6, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  "{chapter.synopsis}"
                </p>
              </div>
            </div>
          </div>

          {/* Boss HP preview */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--brown-mid)' }}>
                {chapter.boss.emoji} {chapter.boss.name}
              </span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 700, color: progress.bossHp === 0 ? 'var(--green-dark)' : '#c0392b' }}>
                {progress.isDefeated ? '☠️ Defeated!' : `${fmt(progress.bossHp)} HP remaining`}
              </span>
            </div>
            <div style={{ height: 14, borderRadius: 'var(--radius-xl)', background: 'var(--bg-deep)', border: '1.5px solid var(--brown-border)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${bossHpPct}%`, background: 'linear-gradient(90deg, #c0392b, #e74c3c)', transition: 'width 0.6s ease', borderRadius: 'var(--radius-xl)' }} />
            </div>
            <div className="panel-subtitle" style={{ marginTop: 4 }}>
              Harvest crops to deal damage — weak crops deal ×3 damage!
            </div>
          </div>

          {/* Quest list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <div className="vine-divider">
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--brown-mid)', whiteSpace: 'nowrap' }}>
                📋 Chapter Quests
              </span>
            </div>
            {chapter.quests.map(quest => {
              const done = progress.questsComplete.includes(quest.id);
              return (
                <div key={quest.id} className="glass-panel" style={{ padding: 'var(--space-sm) var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', opacity: done ? 0.7 : 1, borderColor: done ? 'rgba(74,124,89,0.4)' : 'var(--brown-border)' }}>
                  <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{done ? '✅' : '⬜'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: done ? 'var(--green-dark)' : 'var(--brown-dark)' }}>{quest.title}</div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>{quest.description}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="panel-subtitle">Reward</div>
                    <div style={{ fontFamily: 'var(--font-main)', fontWeight: 800, fontSize: '0.8rem', color: 'var(--amber)' }}>🪙 {fmt(quest.reward.coins)}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deterministic progression map */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--space-sm)' }}>
            <div className="glass-panel" style={{ padding: 'var(--space-sm)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--green-dark)', marginBottom: 6 }}>Unlocked</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {unlockedFeatures.slice(0, 8).map((id) => (
                  <div key={id} className="panel-subtitle">✅ {id}</div>
                ))}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: 'var(--space-sm)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--amber)', marginBottom: 6 }}>Available Now</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {pendingUnlocks.slice(0, 8).map((entry) => (
                  <div key={entry.id} className="panel-subtitle">🟡 {entry.id} {entry.cost ? `(${fmt(entry.cost)} 🪙)` : ''}</div>
                ))}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: 'var(--space-sm)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 6 }}>Future (Locked)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {futureUnlocksPreview.slice(0, 8).map((entry) => (
                  <div key={entry.id} className="panel-subtitle">🔒 {entry.id} — {entry.unlockCondition}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: CHAPTER BOSS
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'boss' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Boss portrait card */}
          <div className="glass-panel" style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-md)', background: 'linear-gradient(145deg, #2d1a0e, #3e2514)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.04, fontSize: '12rem', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              {chapter.boss.emoji}
            </div>
            <div style={{ fontSize: '5rem', filter: progress.isDefeated ? 'grayscale(1) opacity(0.4)' : 'none', transition: 'all 0.5s', position: 'relative', zIndex: 1 }}>{chapter.boss.emoji}</div>
            <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#fdf6e8', lineHeight: 1.1 }}>{chapter.boss.name}</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', fontWeight: 700, color: 'rgba(253,246,232,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>Chapter {chapter.number} Boss</div>
            </div>
          </div>

          {/* HP bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--brown-mid)' }}>💖 Boss Health</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 700, color: '#c0392b' }}>{fmt(progress.bossHp)} / {fmt(chapter.boss.maxHp)}</span>
            </div>
            <div style={{ height: 18, borderRadius: 'var(--radius-xl)', background: '#1a0a05', border: '2px solid #5c3d1e', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${bossHpPct}%`, background: 'linear-gradient(90deg, #8b0000, #c0392b, #e74c3c)', transition: 'width 0.6s ease', borderRadius: 'var(--radius-xl)' }} />
            </div>
          </div>

          {/* Weakness and flavor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="glass-panel" style={{ padding: 'var(--space-md)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', color: 'var(--brown-dark)', marginBottom: 8 }}>⚔️ Known Weaknesses</div>
              {chapter.boss.weakCropIds.length === 0 ? (
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>All crops deal equal damage to this boss.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {chapter.boss.weakCropIds.map(cid => {
                    const crop = CROPS.find(c => c.id === cid);
                    return (
                      <div key={cid} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', border: '1px solid rgba(74,124,89,0.3)' }}>
                        <span style={{ fontSize: '1rem' }}>{crop?.emoji ?? '🌿'}</span>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: 'var(--green-dark)', fontWeight: 700 }}>{crop?.name ?? cid}</span>
                        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-main)', fontSize: '0.65rem', color: '#c0392b', fontWeight: 800 }}>×3 DMG</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="glass-panel" style={{ padding: 'var(--space-md)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', color: 'var(--brown-dark)', marginBottom: 8 }}>🎁 Defeat Reward</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <div>💰 <strong>{fmt(chapter.boss.defeatReward.coinsBonus)}</strong> bonus coins</div>
                {chapter.boss.defeatReward.unlocksRegionId && (
                  <div style={{ marginTop: 4 }}>🗺️ Unlocks a new region</div>
                )}
                <div style={{ marginTop: 4 }}>🌟 Unlocks a Crop Weapon</div>
              </div>
            </div>
          </div>

          {/* Flavor text */}
          <div style={{ background: '#2d1a0e', border: '1.5px solid #5c3d1e', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}>
            <p style={{ fontFamily: 'var(--font-main)', fontSize: '0.72rem', lineHeight: 1.7, color: 'rgba(253,246,232,0.75)', fontStyle: 'italic', textAlign: 'center' }}>
              "{chapter.boss.flavor}"
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: CROP ENCYCLOPEDIA
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'encyclopedia' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            {unlockedCrops.length} of {CROPS.length} crops discovered
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-sm)' }}>
            {CROPS.slice(0, 40).map(crop => {
              const visibility = getVisibility(
                {
                  requirement: {
                    all: [{ type: 'chapter_started', chapter: Math.max(1, crop.unlockTier) }],
                  },
                  visibility: 'teased',
                },
                unlockState
              );
              const unlocked = unlockedCrops.includes(crop.id) || visibility === 'unlocked';
              return (
                <div key={crop.id} className="glass-panel" style={{ padding: 'var(--space-sm)', display: 'flex', flexDirection: 'column', gap: 5, opacity: unlocked ? 1 : 0.4, filter: unlocked ? 'none' : 'grayscale(1)', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.6rem' }}>{unlocked ? crop.emoji : '❓'}</span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.52rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: crop.rarity === 'legendary' ? 'var(--amber)' : crop.rarity === 'rare' ? '#8e44ad' : crop.rarity === 'uncommon' ? 'var(--green-dark)' : 'var(--text-muted)', background: 'var(--bg-deep)', border: '1px solid var(--brown-border)', borderRadius: 'var(--radius-xl)', padding: '1px 5px' }}>
                      {unlocked ? crop.rarity : '???'}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', color: 'var(--brown-dark)' }}>{unlocked ? crop.name : '???'}</div>
                  {unlocked && (
                    <>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.55rem', color: 'var(--text-muted)' }}>🕐 {crop.growthTime}s</span>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.55rem', color: 'var(--amber)' }}>🪙 {fmt(crop.baseValue)}</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: MARKET LEDGER
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'ledger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Weather mood */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--amber-pale)', border: '1.5px solid rgba(201,124,46,0.3)', borderRadius: 'var(--radius-md)', padding: 'var(--space-sm) var(--space-md)' }}>
            <span style={{ fontSize: '1.4rem' }}>{weatherEmojis[weatherIdx]}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--amber)' }}>Market Mood: Fair Weather</div>
              <div className="panel-subtitle">Prices update each minute based on garden weather</div>
            </div>
          </div>

          {/* Crop price list */}
          <div>
            <div className="vine-divider" style={{ marginBottom: 'var(--space-sm)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--brown-mid)', whiteSpace: 'nowrap' }}>🌽 Today's Produce Prices</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              {marketPrices.slice(0, 12).map(price => {
                const crop = CROPS.find((c) => c.id === price.cropId);
                if (!crop) return null;
                const trendLabel =
                  price.trend === 'rising'
                    ? 'Rising 📈'
                    : price.trend === 'falling'
                    ? 'Falling 📉'
                    : 'Steady ➖';
                return (
                <div key={crop.id} className="glass-panel" style={{ padding: 'var(--space-sm) var(--space-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.4rem' }}>{crop.emoji}</span>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--brown-dark)' }}>{crop.name}</div>
                      <div className="panel-subtitle">Base: 🪙 {fmt(crop.baseValue)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: 'var(--green-dark)', background: 'var(--green-pale)', border: '1.5px solid rgba(74,124,89,0.3)', borderRadius: 'var(--radius-xl)', padding: '2px 8px' }}>{trendLabel}</span>
                    <div style={{ fontFamily: 'var(--font-main)', fontWeight: 800, fontSize: '0.85rem', color: 'var(--amber)' }}>×{price.currentMultiplier.toFixed(2)}</div>
                  </div>
                </div>
              )})}
            </div>
          </div>

          {/* Village Orders */}
          <div>
            <div className="vine-divider" style={{ marginBottom: 'var(--space-sm)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--amber)', whiteSpace: 'nowrap' }}>📦 Village Care Packages</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-panel" style={{ padding: 'var(--space-md)', position: 'relative', overflow: 'hidden', borderColor: 'rgba(201,124,46,0.3)' }}>
                  <div style={{ position: 'absolute', top: -8, right: -8, fontSize: '3.5rem', opacity: 0.06, pointerEvents: 'none', transform: 'rotate(15deg)' }}>🧺</div>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'var(--amber-pale)', padding: '2px 8px', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(201,124,46,0.3)' }}>
                      Village Order #{6024 + i}
                    </span>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--brown-dark)', margin: '6px 0 4px' }}>Village Care Package</div>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', lineHeight: 1.5, color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 'var(--space-sm)' }}>
                      "The city folk are hungry for your delicious crops! Priority clearance granted for a fresh delivery."
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-xs) var(--space-sm)', border: '1.5px solid var(--brown-border)' }}>
                      <div>
                        <div className="panel-subtitle">Package Value</div>
                        <div style={{ fontFamily: 'var(--font-main)', fontWeight: 800, fontSize: '1rem', color: 'var(--amber)' }}>🪙 {fmt(5000 * i)}</div>
                      </div>
                      <button className="btn-base btn-amber" style={{ fontSize: '0.75rem', padding: '6px 14px' }}>🚗 Deliver</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: CROP WEAPONS
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'weapons' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
            Ultimate Crop Weapons are crafted by combining legendary harvests. Each weapon was forged to defeat one chapter's boss — and leaves a lasting effect on your garden.
          </p>
          {CROP_WEAPONS.map(weapon => {
            const owned = ownedWeapons.includes(weapon.id);
            const equipped = equippedWeaponId === weapon.id;
            const canAfford = coins >= weapon.cost;
            const isCurrentChapterWeapon = chapter.cropWeaponId === weapon.id;

            return (
              <div key={weapon.id} className="glass-panel" style={{
                padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)',
                borderColor: equipped ? 'rgba(201,124,46,0.6)' : isCurrentChapterWeapon ? 'rgba(74,124,89,0.45)' : 'var(--brown-border)',
                background: equipped ? 'linear-gradient(135deg, var(--amber-pale), var(--surface))' : undefined,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
                    <span style={{ fontSize: '2.2rem' }}>{weapon.emoji}</span>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--brown-dark)' }}>{weapon.name}</div>
                      <div className="panel-subtitle">Chapter {weapon.chapter} Weapon</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    {equipped && (
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', fontWeight: 700, color: '#fff', background: 'var(--amber)', borderRadius: 'var(--radius-xl)', padding: '2px 8px' }}>⚔️ Equipped</span>
                    )}
                    {owned && !equipped && (
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', fontWeight: 700, color: 'var(--green-dark)', background: 'var(--green-pale)', border: '1px solid rgba(74,124,89,0.3)', borderRadius: 'var(--radius-xl)', padding: '2px 8px' }}>✅ Owned</span>
                    )}
                  </div>
                </div>

                {/* Effect description */}
                <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-xs) var(--space-sm)', border: '1px solid var(--brown-border)' }}>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.66rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--amber)' }}>Effect:</strong> {weapon.effect.description}
                  </p>
                </div>

                {/* Recipe */}
                <div>
                  <div className="panel-subtitle" style={{ marginBottom: 4 }}>Recipe ingredients</div>
                  <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
                    {weapon.recipe.map(r => (
                      <div key={r.cropId} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)', padding: '3px 8px', border: '1px solid var(--brown-border)' }}>
                        <span style={{ fontSize: '0.9rem' }}>{r.emoji}</span>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>{r.amount}× {r.cropName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lore */}
                <p style={{ fontFamily: 'var(--font-main)', fontSize: '0.65rem', fontStyle: 'italic', color: 'var(--text-muted)', lineHeight: 1.5, borderTop: '1px dashed var(--brown-border)', paddingTop: 'var(--space-xs)' }}>
                  "{weapon.lore}"
                </p>

                {/* CTA */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {!owned && (
                    <button
                      onClick={() => buyWeapon(weapon.id)}
                      disabled={!canAfford}
                      className={`btn-base ${canAfford ? 'btn-amber' : 'btn-ghost'}`}
                      style={{ flex: 1, fontSize: '0.78rem', padding: '8px 12px', opacity: canAfford ? 1 : 0.5 }}
                    >
                      🌟 Craft Weapon — {fmt(weapon.cost)} 🪙
                    </button>
                  )}
                  {owned && !equipped && (
                    <button onClick={() => equipWeapon(weapon.id)} className="btn-base btn-primary" style={{ flex: 1, fontSize: '0.78rem', padding: '8px 12px' }}>
                      ⚔️ Equip Weapon
                    </button>
                  )}
                  {equipped && (
                    <button onClick={() => equipWeapon(null)} className="btn-base btn-ghost" style={{ flex: 1, fontSize: '0.78rem', padding: '8px 12px' }}>
                      🗃️ Unequip
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: HALL OF DEEDS
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'deeds' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Your garden adventures &amp; legendary deeds — every chapter earned!
            </p>
            <div style={{ background: 'var(--amber-pale)', border: '1.5px solid rgba(201,124,46,0.3)', borderRadius: 'var(--radius-md)', padding: '6px 12px', textAlign: 'right' }}>
              <div className="panel-subtitle">Pages</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--amber)' }}>0 / {ACHIEVEMENTS.length}</div>
            </div>
          </div>
          <div className="dashboard-grid">
            {ACHIEVEMENTS.map((ach, idx) => (
              <div key={ach.id} className="glass-panel" style={{ padding: 'var(--space-md)', display: 'flex', gap: 'var(--space-sm)', opacity: 0.55, position: 'relative', overflow: 'hidden', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0.85'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0.55'; }}>
                <div style={{ position: 'absolute', top: -20, right: -20, fontSize: '4rem', opacity: 0.04, pointerEvents: 'none', transform: 'rotate(15deg)' }}>📖</div>
                <div style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 'var(--radius-xl)', background: 'linear-gradient(145deg, var(--bg-deep), var(--surface))', border: '2px solid var(--brown-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', filter: 'grayscale(0.7)' }}>
                  {bookEmojis[idx % bookEmojis.length]}
                </div>
                <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--brown-dark)' }}>{ach.title}</div>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.52rem', fontWeight: 700, background: 'var(--bg-deep)', color: 'var(--text-muted)', padding: '2px 6px', border: '1px solid var(--brown-border)', borderRadius: 'var(--radius-xl)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>🔒 Locked</span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', fontStyle: 'italic', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                    "{ach.flavor_text}"
                  </p>
                  <div className="progress-bar" style={{ height: 5, marginTop: 5 }}>
                    <div className="progress-fill" style={{ width: '0%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default StoryBookPanel;
