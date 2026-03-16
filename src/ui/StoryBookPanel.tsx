// ============================================================
// COZY GARDEN — Story Book Engine (Phase 1)
// A unified 3-column hub:
//   Left  : chapter list navigation + Village News shortcut
//   Center: data-driven page content (9 page types)
//   Right : quick actions, mini-status, what's-next widget
// ============================================================

import React, { useEffect, useMemo, useState } from 'react';
import { useGameStore, fmt } from '../store/gameStore';
import { CHAPTERS } from '../data/chapters';
import type { StoryPage, StoryPageType } from '../data/chapters';
import { MACHINES as MACHINE_DEFS } from '../data/machines';
import { CROPS } from '../data/crops';
import narrativeData from '../data_exports/narrative_content.json';
import { marketService, type MarketPrice } from '../services/marketService';
import StoryBookPage from './StoryBookPage';

interface NarrativeAchievement {
  id: string;
  category: string;
  title: string;
  requirement: string;
  flavor_text: string;
  loc_key: string;
}
const ACHIEVEMENTS: NarrativeAchievement[] = narrativeData.achievements as NarrativeAchievement[];

const bookEmojis = ['🌸', '🌻', '🌺', '🍄', '🌿', '🦋', '🐝', '🍓', '🌈', '🏡'];
const weatherEmojis = ['☀️', '🌤️', '⛅', '🌧️', '🌈'];

// ── Page type metadata ────────────────────────────────────────
const PAGE_TYPE_EMOJI: Record<StoryPageType, string> = {
  chapter_intro:    '📖',
  exploration_quest:'📋',
  merchant_page:    '🛒',
  crafting_page:    '🔨',
  worker_story:     '👷',
  boss_prelude:     '⚠️',
  boss_page:        '🗡️',
  resolution_page:  '🌸',
  festival_page:    '🎉',
};

// ── Sub-panel IDs for library section ────────────────────────
type LibraryTab = 'encyclopedia' | 'weapons' | 'deeds';

// ============================================================
//  Main Component
// ============================================================
const StoryBookPanel: React.FC = () => {
  const {
    currentChapterId, chapterProgress,
    coins, unlockedCrops, lifetimeCoins,
    unlockedSkills, unlockedRegions,
    machines, workers,
    harvestTracking, bossDamageTracking, regionReputation, craftingTracking,
    pendingUnlocks, futureUnlocksPreview,
    ownedWeapons, equippedWeaponId,
    buyWeapon, equipWeapon,
    setPanel,
  } = useGameStore();

  // ── Navigation state ──────────────────────────────────────
  const [selectedChapterId, setSelectedChapterId] = useState(currentChapterId);
  const [selectedPageId, setSelectedPageId]       = useState<string | null>(null);
  const [libraryTab, setLibraryTab]               = useState<LibraryTab | null>(null);

  // Keep selected chapter in sync when current chapter advances
  useEffect(() => {
    setSelectedChapterId(currentChapterId);
    setSelectedPageId(null);
    setLibraryTab(null);
  }, [currentChapterId]);

  // ── Data ──────────────────────────────────────────────────
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>(() => marketService.getAllPrices());
  const [weatherIdx, setWeatherIdx]     = useState(0);

  useEffect(() => {
    const refresh = () => setMarketPrices(marketService.getAllPrices());
    refresh();
    const t = window.setInterval(refresh, 15_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => setWeatherIdx(i => (i + 1) % weatherEmojis.length), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const chapter   = useMemo(() => CHAPTERS.find(c => c.id === selectedChapterId) ?? CHAPTERS[0], [selectedChapterId]);
  const currentCh = useMemo(() => CHAPTERS.find(c => c.id === currentChapterId) ?? CHAPTERS[0], [currentChapterId]);
  const progress  = chapterProgress[chapter.id];
  const bossHpPct = progress ? Math.max(0, (progress.bossHp / chapter.boss.maxHp) * 100) : 100;

  const selectedPage: StoryPage = useMemo(() => {
    const found = chapter.pages.find(p => p.id === selectedPageId);
    return found ?? chapter.pages[0];
  }, [chapter, selectedPageId]);

  const cps = useMemo(() => {
    const total = machines.reduce((acc, m) => {
      const def = MACHINE_DEFS.find(d => d.id === m.machineId);
      const rate = def ? def.productionRate.cropsPerMin / 60 : 0;
      return acc + (m.count * rate);
    }, 0);
    return Math.round(total * 100) / 100;
  }, [machines]);

  // ── Chapter status ────────────────────────────────────────
  function getChapterStatus(ch: typeof chapter) {
    const p = chapterProgress[ch.id];
    if (p?.isDefeated)               return { icon: '✅', color: 'var(--green-dark)' };
    if (ch.id === currentChapterId)  return { icon: '📖', color: 'var(--amber)' };
    if (ch.number <= currentCh.number) return { icon: '📂', color: 'var(--text-secondary)' };
    return { icon: '🔒', color: 'var(--text-muted)' };
  }

  // ── Quick actions (contextual) ────────────────────────────
  function renderQuickActions() {
    if (libraryTab) return null;
    return (
      <div className="glass-panel" style={{ padding: 'var(--space-sm)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--brown-dark)', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--brown-border)' }}>
          ⚡ Quick Actions
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {selectedPage?.pageType === 'exploration_quest' && (
            <button className="btn-base btn-primary" style={{ fontSize: '0.7rem', padding: '5px 8px', textAlign: 'left' }}>
              🌱 Plant All Plots
            </button>
          )}
          {(selectedPage?.pageType === 'boss_page' || selectedPage?.pageType === 'boss_prelude') && (
            <>
              <button className="btn-base btn-amber" style={{ fontSize: '0.7rem', padding: '5px 8px', textAlign: 'left' }}>
                🌾 Harvest Weak Crops
              </button>
              {!ownedWeapons.includes(chapter.cropWeaponId) && (
                <button
                  className="btn-base btn-ghost"
                  onClick={() => buyWeapon(chapter.cropWeaponId)}
                  disabled={coins < 1000}
                  style={{ fontSize: '0.7rem', padding: '5px 8px', textAlign: 'left', opacity: coins >= 1000 ? 1 : 0.5 }}
                >
                  🌟 Craft Weapon
                </button>
              )}
            </>
          )}
          {selectedPage?.pageType === 'worker_story' && (
            <button className="btn-base btn-primary" style={{ fontSize: '0.7rem', padding: '5px 8px', textAlign: 'left' }}
              onClick={() => setPanel('village')}>
              👷 Open Village Folk
            </button>
          )}
          {selectedPage?.pageType === 'merchant_page' && (
            <button className="btn-base btn-amber" style={{ fontSize: '0.7rem', padding: '5px 8px', textAlign: 'left' }}
              onClick={() => setPanel('market')}>
              🛒 Open Market Stall
            </button>
          )}
          <button className="btn-base btn-ghost" style={{ fontSize: '0.7rem', padding: '5px 8px', textAlign: 'left' }}
            onClick={() => setPanel('farm')}>
            🌻 Go to Farm
          </button>
        </div>
      </div>
    );
  }

  // ── Library content (encyclopedia / weapons / deeds) ──────
  function renderLibrary() {
    if (!libraryTab) return null;

    if (libraryTab === 'encyclopedia') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {unlockedCrops.length} of {CROPS.length} crops discovered
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--space-sm)' }}>
            {CROPS.slice(0, 40).map(crop => {
              const unlocked = unlockedCrops.includes(crop.id);
              return (
                <div key={crop.id} className="glass-panel" style={{ padding: 'var(--space-sm)', display: 'flex', flexDirection: 'column', gap: 4, opacity: unlocked ? 1 : 0.4, filter: unlocked ? 'none' : 'grayscale(1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.5rem' }}>{unlocked ? crop.emoji : '❓'}</span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: crop.rarity === 'legendary' ? 'var(--amber)' : crop.rarity === 'rare' ? '#8e44ad' : crop.rarity === 'uncommon' ? 'var(--green-dark)' : 'var(--text-muted)', background: 'var(--bg-deep)', border: '1px solid var(--brown-border)', borderRadius: 'var(--radius-xl)', padding: '1px 4px' }}>
                      {unlocked ? crop.rarity : '???'}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--brown-dark)' }}>{unlocked ? crop.name : '???'}</div>
                  {unlocked && (
                    <div style={{ display: 'flex', gap: 5 }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.53rem', color: 'var(--text-muted)' }}>🕐 {crop.growthTime}s</span>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.53rem', color: 'var(--amber)' }}>🪙 {fmt(crop.baseValue)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (libraryTab === 'weapons') {
      const curChapter = CHAPTERS.find(c => c.id === currentChapterId) ?? CHAPTERS[0];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
            Ultimate Crop Weapons are forged from legendary harvests. Each defeats one chapter boss.
          </p>
          {CROP_WEAPONS.map(weapon => {
            const owned    = ownedWeapons.includes(weapon.id);
            const equipped = equippedWeaponId === weapon.id;
            const canAfford = coins >= weapon.cost;
            const isCurrent = curChapter.cropWeaponId === weapon.id;
            return (
              <div key={weapon.id} className="glass-panel" style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', borderColor: equipped ? 'rgba(201,124,46,0.6)' : isCurrent ? 'rgba(74,124,89,0.45)' : 'var(--brown-border)', background: equipped ? 'linear-gradient(135deg, var(--amber-pale), var(--surface))' : undefined }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                    <span style={{ fontSize: '2rem' }}>{weapon.emoji}</span>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--brown-dark)' }}>{weapon.name}</div>
                      <div className="panel-subtitle">Chapter {weapon.chapter} Weapon</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                    {equipped && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.55rem', fontWeight: 700, color: '#fff', background: 'var(--amber)', borderRadius: 'var(--radius-xl)', padding: '2px 7px' }}>⚔️ Equipped</span>}
                    {owned && !equipped && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.55rem', fontWeight: 700, color: 'var(--green-dark)', background: 'var(--green-pale)', border: '1px solid rgba(74,124,89,0.3)', borderRadius: 'var(--radius-xl)', padding: '2px 7px' }}>✅ Owned</span>}
                  </div>
                </div>
                <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', border: '1px solid var(--brown-border)' }}>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.62rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--amber)' }}>Effect:</strong> {weapon.effect.description}
                  </p>
                </div>
                <p style={{ fontFamily: 'var(--font-main)', fontSize: '0.62rem', fontStyle: 'italic', color: 'var(--text-muted)', lineHeight: 1.5, borderTop: '1px dashed var(--brown-border)', paddingTop: 4 }}>"{weapon.lore}"</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {!owned && <button onClick={() => buyWeapon(weapon.id)} disabled={!canAfford} className={'btn-base ' + (canAfford ? 'btn-amber' : 'btn-ghost')} style={{ flex: 1, fontSize: '0.72rem', padding: '6px 10px', opacity: canAfford ? 1 : 0.5 }}>🌟 Craft — {fmt(weapon.cost)} 🪙</button>}
                  {owned && !equipped && <button onClick={() => equipWeapon(weapon.id)} className="btn-base btn-primary" style={{ flex: 1, fontSize: '0.72rem', padding: '6px 10px' }}>⚔️ Equip</button>}
                  {equipped && <button onClick={() => equipWeapon(null)} className="btn-base btn-ghost" style={{ flex: 1, fontSize: '0.72rem', padding: '6px 10px' }}>🗃️ Unequip</button>}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (libraryTab === 'deeds') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>Your legendary deeds &amp; garden achievements.</p>
            <div style={{ background: 'var(--amber-pale)', border: '1.5px solid rgba(201,124,46,0.3)', borderRadius: 'var(--radius-md)', padding: '5px 10px', textAlign: 'right' }}>
              <div className="panel-subtitle">Pages</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--amber)' }}>0 / {ACHIEVEMENTS.length}</div>
            </div>
          </div>
          <div className="dashboard-grid">
            {ACHIEVEMENTS.map((ach, idx) => (
              <div key={ach.id} className="glass-panel" style={{ padding: 'var(--space-sm)', display: 'flex', gap: 'var(--space-sm)', opacity: 0.55, position: 'relative', overflow: 'hidden' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0.85'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0.55'; }}>
                <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 'var(--radius-xl)', background: 'linear-gradient(145deg, var(--bg-deep), var(--surface))', border: '2px solid var(--brown-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', filter: 'grayscale(0.7)' }}>
                  {bookEmojis[idx % bookEmojis.length]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--brown-dark)' }}>{ach.title}</div>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.5rem', fontWeight: 700, background: 'var(--bg-deep)', color: 'var(--text-muted)', padding: '1px 5px', border: '1px solid var(--brown-border)', borderRadius: 'var(--radius-xl)', textTransform: 'uppercase' }}>🔒</span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', fontStyle: 'italic', color: 'var(--text-muted)', lineHeight: 1.4 }}>"{ach.flavor_text}"</p>
                  <div className="progress-bar" style={{ height: 4, marginTop: 4 }}>
                    <div className="progress-fill" style={{ width: '0%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="animate-in" style={{ display: 'flex', gap: 'var(--space-sm)', maxWidth: 960, margin: '0 auto', alignItems: 'flex-start' }}>

      {/* ══════════════════════════════════════════════════════
          LEFT COLUMN — Chapter list navigation
      ══════════════════════════════════════════════════════ */}
      <div style={{ width: 182, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ paddingBottom: 8, marginBottom: 2, borderBottom: '1.5px solid var(--brown-border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--brown-dark)', lineHeight: 1.1 }}>
            📚 Story Book
          </h2>
          <p className="panel-subtitle" style={{ marginTop: 2 }}>Garden journal &amp; quest hub</p>
        </div>

        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', padding: '4px 0 2px' }}>
          Chapters
        </div>

        {CHAPTERS.map(ch => {
          const { icon, color } = getChapterStatus(ch);
          const isSelected = ch.id === selectedChapterId && !libraryTab;
          return (
            <button
              key={ch.id}
              onClick={() => { setSelectedChapterId(ch.id); setSelectedPageId(null); setLibraryTab(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 8px', fontFamily: 'var(--font-display)', fontSize: '0.7rem', cursor: 'pointer', borderRadius: 'var(--radius-sm)', transition: 'all 0.12s', border: isSelected ? '1.5px solid var(--brown-mid)' : '1.5px solid transparent', background: isSelected ? 'linear-gradient(135deg, var(--amber-pale), var(--surface))' : 'transparent', color: isSelected ? 'var(--brown-dark)' : color, fontWeight: isSelected ? 700 : 400, textAlign: 'left' }}
            >
              <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>{icon}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Ch.{ch.number} {ch.title}</span>
            </button>
          );
        })}

        {/* Library section */}
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', padding: '8px 0 2px', marginTop: 4, borderTop: '1px solid var(--brown-border)' }}>
          Library
        </div>
        {([
          { id: 'encyclopedia' as LibraryTab, label: 'Crop Encyclopedia', emoji: '🌿' },
          { id: 'weapons' as LibraryTab,      label: 'Crop Weapons',      emoji: '🌟' },
          { id: 'deeds' as LibraryTab,        label: 'Hall of Deeds',     emoji: '🏅' },
        ]).map(lib => (
          <button
            key={lib.id}
            onClick={() => { setLibraryTab(lib.id); setSelectedPageId(null); }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 8px', fontFamily: 'var(--font-display)', fontSize: '0.7rem', cursor: 'pointer', borderRadius: 'var(--radius-sm)', transition: 'all 0.12s', border: libraryTab === lib.id ? '1.5px solid var(--brown-mid)' : '1.5px solid transparent', background: libraryTab === lib.id ? 'linear-gradient(135deg, var(--amber-pale), var(--surface))' : 'transparent', color: libraryTab === lib.id ? 'var(--brown-dark)' : 'var(--text-muted)', fontWeight: libraryTab === lib.id ? 700 : 400, textAlign: 'left' }}
          >
            <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>{lib.emoji}</span>
            {lib.label}
          </button>
        ))}

        {/* Village News shortcut */}
        <div style={{ marginTop: 4, borderTop: '1px solid var(--brown-border)', paddingTop: 6 }}>
          <button
            onClick={() => setPanel('events')}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 8px', width: '100%', fontFamily: 'var(--font-display)', fontSize: '0.7rem', cursor: 'pointer', borderRadius: 'var(--radius-sm)', transition: 'all 0.12s', border: '1.5px solid transparent', background: 'transparent', color: 'var(--text-muted)', textAlign: 'left' }}
          >
            <span style={{ fontSize: '0.85rem' }}>📰</span>
            Village News
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          CENTER COLUMN — Page content
      ══════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>

        {libraryTab ? (
          <div style={{ borderBottom: '1.5px solid var(--brown-border)', paddingBottom: 8, marginBottom: 4 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--brown-dark)', margin: 0 }}>
              {libraryTab === 'encyclopedia' && '🌿 Crop Encyclopedia'}
              {libraryTab === 'weapons' && '🌟 Crop Weapons'}
              {libraryTab === 'deeds' && '🏅 Hall of Deeds'}
            </h3>
          </div>
        ) : (
          <>
            {/* Chapter header + regional peace meter */}
            <div style={{ borderBottom: '1.5px solid var(--brown-border)', paddingBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.8rem' }}>{chapter.emoji}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--brown-dark)', lineHeight: 1.1 }}>{chapter.title}</div>
                    <div className="panel-subtitle">Chapter {chapter.number} · {chapter.regionId.replace(/_/g, ' ')}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="panel-subtitle">Regional Peace</div>
                  <div style={{ fontFamily: 'var(--font-main)', fontWeight: 800, fontSize: '0.82rem', color: progress?.isDefeated ? 'var(--green-dark)' : '#c0392b' }}>
                    {progress?.isDefeated ? '🕊️ Restored' : `${Math.round(100 - bossHpPct)}% threatened`}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ height: 6, borderRadius: 'var(--radius-xl)', background: 'var(--bg-deep)', border: '1px solid var(--brown-border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${100 - bossHpPct}%`, background: 'linear-gradient(90deg, var(--green-mid), var(--green-dark))', transition: 'width 0.6s ease', borderRadius: 'var(--radius-xl)' }} />
                </div>
              </div>
            </div>

            {/* Page navigation pills */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {chapter.pages.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPageId(p.id); setLibraryTab(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontFamily: 'var(--font-display)', fontSize: '0.68rem', cursor: 'pointer', borderRadius: 'var(--radius-xl)', transition: 'all 0.12s', border: selectedPage?.id === p.id ? '1.5px solid var(--brown-mid)' : '1.5px solid var(--brown-border)', background: selectedPage?.id === p.id ? 'linear-gradient(135deg, var(--amber-pale), var(--surface))' : 'var(--surface)', color: selectedPage?.id === p.id ? 'var(--brown-dark)' : 'var(--text-muted)', fontWeight: selectedPage?.id === p.id ? 700 : 400, boxShadow: selectedPage?.id === p.id ? 'var(--shadow-card)' : 'none' }}
                >
                  <span style={{ fontSize: '0.75rem' }}>{PAGE_TYPE_EMOJI[p.pageType]}</span>
                  <span>{p.title}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Page content area */}
        <div style={{ flex: 1 }}>
          {libraryTab
            ? renderLibrary()
            : selectedPage && (
                <StoryBookPage
                  page={selectedPage}
                  chapter={chapter}
                  marketPrices={marketPrices}
                  weatherEmoji={weatherEmojis[weatherIdx]}
                />
              )
          }
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          RIGHT COLUMN — Quick actions + mini status
      ══════════════════════════════════════════════════════ */}
      <div style={{ width: 196, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {renderQuickActions()}

        {/* Mini status */}
        <div className="glass-panel" style={{ padding: 'var(--space-sm)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--brown-dark)', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--brown-border)' }}>
            📊 Status
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="panel-subtitle">💰 Coins</span>
              <span style={{ fontFamily: 'var(--font-main)', fontWeight: 800, fontSize: '0.78rem', color: 'var(--amber)' }}>{fmt(coins)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="panel-subtitle">⚡ CPS</span>
              <span style={{ fontFamily: 'var(--font-main)', fontWeight: 800, fontSize: '0.78rem', color: 'var(--green-dark)' }}>{fmt(cps)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="panel-subtitle">📖 Chapter</span>
              <span style={{ fontFamily: 'var(--font-main)', fontWeight: 800, fontSize: '0.78rem', color: 'var(--brown-mid)' }}>{currentCh.number} / {CHAPTERS.length}</span>
            </div>
          </div>
        </div>

        {/* What's Next widget */}
        {pendingUnlocks.length > 0 && (
          <div className="glass-panel" style={{ padding: 'var(--space-sm)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--brown-dark)', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--brown-border)' }}>
              🔓 What's Next
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {pendingUnlocks.slice(0, 3).map(entry => (
                <div key={entry.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                  <span style={{ fontSize: '0.7rem', marginTop: 1 }}>🟡</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', color: 'var(--brown-dark)', fontWeight: 600 }}>{entry.id}</div>
                    {entry.cost !== undefined && <div className="panel-subtitle" style={{ fontSize: '0.55rem' }}>🪙 {fmt(entry.cost)}</div>}
                  </div>
                </div>
              ))}
              {futureUnlocksPreview.length > 0 && (
                <div style={{ marginTop: 2 }}>
                  {futureUnlocksPreview.slice(0, 2).map(entry => (
                    <div key={entry.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginTop: 3, opacity: 0.65 }}>
                      <span style={{ fontSize: '0.7rem', marginTop: 1 }}>🔒</span>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', color: 'var(--text-muted)' }}>{entry.id}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default StoryBookPanel;
