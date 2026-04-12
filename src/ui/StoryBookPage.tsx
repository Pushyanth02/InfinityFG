// ============================================================
// COZY GARDEN — Story Book Page Renderer
// Renders any StoryPage based on its pageType.
// Used by StoryBookPanel as the center-column content.
// ============================================================

import React from 'react';
import { useGameStore, fmt } from '../store/gameStore';
import type { Chapter, StoryPage } from '../data/chapters';
import { CHAPTERS } from '../data/chapters';
import { CROPS } from '../data/crops';
import { VILLAGE_FOLK } from '../data/villageFolk';
import type { MarketPrice } from '../services/marketService';
import { BossHealthBar } from './boss/BossHealthBar';
import { AnimatedButton } from './components/AnimatedButton';

interface Props {
  page: StoryPage;
  chapter: Chapter;
  marketPrices: MarketPrice[];
  weatherEmoji: string;
}

// ─── Chapter Intro ────────────────────────────────────────────
const ChapterIntroPage: React.FC<{ page: StoryPage; chapter: Chapter }> = ({ page, chapter }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
    <div
      className="glass-panel"
      style={{
        padding: 'var(--space-xl)',
        background: 'linear-gradient(135deg, var(--amber-pale), var(--surface))',
        borderColor: 'rgba(201,124,46,0.35)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: -20, right: -20, fontSize: '7rem', opacity: 0.06, pointerEvents: 'none' }}>
        {page.art}
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <span style={{ fontSize: '3.5rem', flexShrink: 0 }}>{page.art}</span>
        <div>
          <span style={{
            fontFamily: 'var(--font-sans)', fontSize: '0.58rem', fontWeight: 700,
            color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.12em',
            background: 'var(--amber-pale)', border: '1px solid rgba(201,124,46,0.3)',
            borderRadius: 'var(--radius-xl)', padding: '2px 8px', display: 'inline-block', marginBottom: 6,
          }}>
            Chapter {chapter.number} of {CHAPTERS.length}
          </span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--brown-dark)', margin: '0 0 8px' }}>
            {chapter.title}
          </h3>
          <p style={{ fontFamily: 'var(--font-main)', fontSize: '0.73rem', lineHeight: 1.75, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            "{page.body}"
          </p>
        </div>
      </div>
    </div>

    {/* Quick region context */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-sm)' }}>
      <div className="glass-panel" style={{ padding: 'var(--space-sm)', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🗺️</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--brown-dark)' }}>
          {chapter.regionId.replace(/_/g, ' ')}
        </div>
        <div className="panel-subtitle">Region</div>
      </div>
      <div className="glass-panel" style={{ padding: 'var(--space-sm)', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{chapter.boss.emoji}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--brown-dark)' }}>
          {chapter.boss.name}
        </div>
        <div className="panel-subtitle">Chapter Boss</div>
      </div>
      <div className="glass-panel" style={{ padding: 'var(--space-sm)', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>📋</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--brown-dark)' }}>
          {chapter.quests.length} Quests
        </div>
        <div className="panel-subtitle">This Chapter</div>
      </div>
    </div>
  </div>
);

// ─── Exploration Quest Page ───────────────────────────────────
const ExplorationQuestPage: React.FC<{ chapter: Chapter }> = ({ chapter }) => {
  const progress = useGameStore(s => s.chapterProgress[chapter.id]);
  if (!progress) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
        Complete tasks to advance Chapter {chapter.number} and earn coin rewards.
      </p>

      {chapter.quests.map(quest => {
        const done = progress.questsComplete.includes(quest.id);
        return (
          <div
            key={quest.id}
            className="glass-panel"
            style={{
              padding: 'var(--space-md)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)',
              borderColor: done ? 'rgba(74,124,89,0.4)' : 'var(--brown-border)',
              background: done ? 'rgba(74,124,89,0.06)' : undefined,
            }}
          >
            <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{done ? '✅' : '⬜'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', color: done ? 'var(--green-dark)' : 'var(--brown-dark)', marginBottom: 3 }}>
                {quest.title}
              </div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.63rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {quest.description}
              </p>
              <div style={{ marginTop: 6 }}>
                <div className="progress-bar" style={{ height: 5 }}>
                  <div className="progress-fill" style={{ width: done ? '100%' : '0%' }} />
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div className="panel-subtitle">Reward</div>
              <div style={{ fontFamily: 'var(--font-main)', fontWeight: 800, fontSize: '0.85rem', color: 'var(--amber)' }}>
                🪙 {fmt(quest.reward.coins)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Merchant Page ────────────────────────────────────────────
const MerchantPage: React.FC<{ page: StoryPage; marketPrices: MarketPrice[]; weatherEmoji: string }> = ({
  page,
  marketPrices,
  weatherEmoji,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
    {/* Merchant narrative header */}
    <div
      className="glass-panel"
      style={{
        padding: 'var(--space-md)', display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start',
        background: 'linear-gradient(135deg, var(--amber-pale), var(--surface))',
        borderColor: 'rgba(201,124,46,0.3)', position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: -10, right: -10, fontSize: '5rem', opacity: 0.05, pointerEvents: 'none' }}>
        {page.art}
      </div>
      <span style={{ fontSize: '2.5rem', flexShrink: 0 }}>{page.art}</span>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.92rem', color: 'var(--brown-dark)', marginBottom: 4 }}>
          {page.title}
        </div>
        <p style={{ fontFamily: 'var(--font-main)', fontSize: '0.68rem', lineHeight: 1.6, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          "{page.body}"
        </p>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '1rem' }}>{weatherEmoji}</span>
          <span className="panel-subtitle">Market Mood: Fair Weather — prices update each minute</span>
        </div>
      </div>
    </div>

    {/* Live prices */}
    <div>
      <div className="vine-divider" style={{ marginBottom: 'var(--space-sm)' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--brown-mid)', whiteSpace: 'nowrap' }}>
          🌽 Today's Produce Prices
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
        {marketPrices.slice(0, 8).map(price => {
          const crop = CROPS.find(c => c.id === price.cropId);
          if (!crop) return null;
          const trendLabel = price.trend === 'rising' ? '📈 Rising' : price.trend === 'falling' ? '📉 Falling' : '➖ Steady';
          return (
            <div
              key={crop.id}
              className="glass-panel"
              style={{ padding: 'var(--space-sm) var(--space-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.3rem' }}>{crop.emoji}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--brown-dark)' }}>{crop.name}</div>
                  <div className="panel-subtitle">Base: 🪙 {fmt(crop.baseValue)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--green-dark)',
                  background: 'var(--green-pale)', border: '1.5px solid rgba(74,124,89,0.3)',
                  borderRadius: 'var(--radius-xl)', padding: '2px 8px',
                }}>{trendLabel}</span>
                <div style={{ fontFamily: 'var(--font-main)', fontWeight: 800, fontSize: '0.83rem', color: 'var(--amber)', minWidth: 38, textAlign: 'right' }}>
                  ×{price.currentMultiplier.toFixed(2)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Village Care Packages */}
    <div>
      <div className="vine-divider" style={{ marginBottom: 'var(--space-sm)' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--amber)', whiteSpace: 'nowrap' }}>
          📦 Village Care Packages
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-panel" style={{ padding: 'var(--space-sm) var(--space-md)', position: 'relative', overflow: 'hidden', borderColor: 'rgba(201,124,46,0.3)' }}>
            <div style={{ position: 'absolute', top: -6, right: -6, fontSize: '3rem', opacity: 0.05, pointerEvents: 'none', transform: 'rotate(15deg)' }}>🧺</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <div>
                <span style={{
                  fontFamily: 'var(--font-sans)', fontSize: '0.55rem', fontWeight: 700,
                  color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.1em',
                  background: 'var(--amber-pale)', border: '1px solid rgba(201,124,46,0.3)',
                  borderRadius: 'var(--radius-xl)', padding: '2px 7px', display: 'inline-block', marginBottom: 4,
                }}>
                  Village Order #{6024 + i}
                </span>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--brown-dark)' }}>Care Package</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ textAlign: 'right' }}>
                  <div className="panel-subtitle">Value</div>
                  <div style={{ fontFamily: 'var(--font-main)', fontWeight: 800, fontSize: '0.9rem', color: 'var(--amber)' }}>🪙 {fmt(5000 * i)}</div>
                </div>
                <button className="btn-base btn-amber" style={{ fontSize: '0.72rem', padding: '5px 12px' }}>🚗 Deliver</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Worker Story Page ────────────────────────────────────────
const WorkerStoryPage: React.FC<{ page: StoryPage }> = ({ page }) => {
  const { workers, buyWorker, coins } = useGameStore();
  const workerDef = VILLAGE_FOLK.find(w => w.worker_id === page.workerId);
  if (!workerDef) return null;

  const alreadyHired = (workers[workerDef.worker_id] ?? 0) > 0;
  const canAfford = coins >= workerDef.hireCost;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Worker card */}
      <div
        className="glass-panel"
        style={{
          padding: 'var(--space-lg)', display: 'flex', gap: 'var(--space-lg)', alignItems: 'flex-start',
          background: 'linear-gradient(135deg, var(--amber-pale), var(--surface))',
          borderColor: 'rgba(201,124,46,0.3)',
        }}
      >
        <div style={{
          width: 64, height: 64, flexShrink: 0, borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(145deg, var(--bg-deep), var(--surface))',
          border: '2px solid var(--brown-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem',
        }}>
          {page.art}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--brown-dark)', lineHeight: 1.1 }}>
                {workerDef.name}
              </div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>
                {workerDef.role} · Chapter {workerDef.tier}+
              </div>
            </div>
            {alreadyHired ? (
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', fontWeight: 700, color: '#fff', background: 'var(--green-mid)', borderRadius: 'var(--radius-xl)', padding: '3px 10px' }}>✅ Hired</span>
            ) : (
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 800, color: 'var(--amber)' }}>🪙 {fmt(workerDef.hireCost)}</span>
            )}
          </div>
          <p style={{ fontFamily: 'var(--font-main)', fontSize: '0.68rem', lineHeight: 1.65, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            "{page.body}"
          </p>
        </div>
      </div>

      {/* Unique ability */}
      <div className="glass-panel" style={{ padding: 'var(--space-sm) var(--space-md)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '1.2rem' }}>⚡</span>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', color: 'var(--brown-dark)' }}>Unique Ability</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{workerDef.uniqueAbility.desc}</div>
        </div>
      </div>

      {/* Personal quests */}
      {workerDef.personalQuests.length > 0 && (
        <div>
          <div className="vine-divider" style={{ marginBottom: 'var(--space-sm)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--brown-mid)', whiteSpace: 'nowrap' }}>
              📜 Personal Quest Chain
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            {workerDef.personalQuests.map((pq, i) => (
              <div key={pq.id} className="glass-panel" style={{ padding: 'var(--space-sm) var(--space-md)', display: 'flex', alignItems: 'center', gap: 10, opacity: alreadyHired ? 1 : 0.55 }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{i === 0 ? '🟡' : '🔒'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', color: 'var(--brown-dark)' }}>{pq.title}</div>
                  <div className="panel-subtitle">Chapter {pq.chapterTier}+</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="panel-subtitle">Trust</div>
                  <div style={{ fontFamily: 'var(--font-main)', fontWeight: 800, fontSize: '0.78rem', color: 'var(--amber)' }}>+{pq.trustReward}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hire CTA */}
      {!alreadyHired && (
        <button
          onClick={() => buyWorker(workerDef.worker_id)}
          disabled={!canAfford}
          className={`btn-base ${canAfford ? 'btn-amber' : 'btn-ghost'}`}
          style={{ fontSize: '0.82rem', padding: '10px 16px', opacity: canAfford ? 1 : 0.5 }}
        >
          👷 Invite {workerDef.name} — 🪙 {fmt(workerDef.hireCost)}
        </button>
      )}
    </div>
  );
};

// ─── Boss Prelude Page ────────────────────────────────────────
const BossPreludePage: React.FC<{ page: StoryPage; chapter: Chapter }> = ({ page, chapter }) => {
  const progress = useGameStore(s => s.chapterProgress[chapter.id]);
  const bossHpPct = progress ? Math.max(0, (progress.bossHp / chapter.boss.maxHp) * 100) : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Threat header */}
      <div style={{
        background: 'linear-gradient(145deg, #2d1a0e, #3e2514)',
        borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)',
        border: '1.5px solid #5c3d1e', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, fontSize: '10rem', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          ⚠️
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '3rem', flexShrink: 0 }}>{chapter.boss.emoji}</span>
          <div>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', fontWeight: 700, color: '#e74c3c', textTransform: 'uppercase', letterSpacing: '0.12em', background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 'var(--radius-xl)', padding: '2px 8px', display: 'inline-block', marginBottom: 6 }}>
              Threat Report
            </span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: '#fdf6e8', marginBottom: 6 }}>{chapter.boss.name}</div>
            <p style={{ fontFamily: 'var(--font-main)', fontSize: '0.68rem', lineHeight: 1.7, color: 'rgba(253,246,232,0.75)', fontStyle: 'italic' }}>
              "{page.body}"
            </p>
          </div>
        </div>
      </div>

      {/* Weakness hints */}
      <div className="glass-panel" style={{ padding: 'var(--space-md)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', color: 'var(--brown-dark)', marginBottom: 8 }}>
          🔍 Weakness Clues
        </div>
        {chapter.boss.weakCropIds.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No known weakness — all crops deal equal damage.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {chapter.boss.weakCropIds.map(cid => {
              const crop = CROPS.find(c => c.id === cid);
              return (
                <div key={cid} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)', padding: '5px 10px', border: '1px solid rgba(231,76,60,0.2)' }}>
                  <span style={{ fontSize: '1.1rem' }}>{crop?.emoji ?? '🌿'}</span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: '#e74c3c', fontWeight: 700 }}>
                    {crop?.name ?? cid} — deals ×3 damage!
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Boss HP preview */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--brown-mid)' }}>💖 Threat Level</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 700, color: '#c0392b' }}>{fmt(chapter.boss.maxHp)} HP</span>
        </div>
        <BossHealthBar hpPercent={bossHpPct} height={12} />
      </div>
    </div>
  );
};

// ─── Boss Page ────────────────────────────────────────────────
const BossPageContent: React.FC<{ chapter: Chapter }> = ({ chapter }) => {
  const { chapterProgress, coins, ownedWeapons, equippedWeaponId, buyWeapon, equipWeapon } = useGameStore();
  const progress = chapterProgress[chapter.id];
  const currentBossHp = progress?.bossHp ?? chapter.boss.maxHp;
  const bossHpPct = Math.max(0, (currentBossHp / chapter.boss.maxHp) * 100);
  const weapon = chapter.cropWeaponId;
  const weaponOwned = ownedWeapons.includes(weapon);
  if (!progress) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Boss portrait */}
      <div style={{
        background: 'linear-gradient(145deg, #2d1a0e, #3e2514)', borderRadius: 'var(--radius-md)',
        padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-md)',
        position: 'relative', overflow: 'hidden', border: '1.5px solid #5c3d1e',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, fontSize: '11rem', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          {chapter.boss.emoji}
        </div>
        <div style={{ fontSize: '5rem', filter: progress.isDefeated ? 'grayscale(1) opacity(0.4)' : 'none', transition: 'all 0.5s', position: 'relative', zIndex: 1 }}>
          {chapter.boss.emoji}
        </div>
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: '#fdf6e8', lineHeight: 1.1 }}>{chapter.boss.name}</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', fontWeight: 700, color: 'rgba(253,246,232,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
            Chapter {chapter.number} Boss
          </div>
          {progress.isDefeated && (
            <div style={{ marginTop: 8, fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: '#7db87e' }}>☠️ Defeated!</div>
          )}
        </div>
      </div>

      {/* HP bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--brown-mid)' }}>💖 Boss Health</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 700, color: '#c0392b' }}>{fmt(progress.bossHp)} / {fmt(chapter.boss.maxHp)}</span>
        </div>
        <BossHealthBar hpPercent={bossHpPct} height={18} shakeKey={Math.floor(currentBossHp)} />
        <div className="panel-subtitle" style={{ marginTop: 4 }}>Harvest crops to deal damage — weak crops deal ×3!</div>
      </div>

      {/* Weaknesses */}
      {chapter.boss.weakCropIds.length > 0 && (
        <div className="glass-panel" style={{ padding: 'var(--space-md)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--brown-dark)', marginBottom: 8 }}>⚔️ Confirmed Weaknesses</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {chapter.boss.weakCropIds.map(cid => {
              const crop = CROPS.find(c => c.id === cid);
              return (
                <div key={cid} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)', padding: '4px 10px', border: '1px solid rgba(231,76,60,0.3)' }}>
                  <span style={{ fontSize: '1rem' }}>{crop?.emoji ?? '🌿'}</span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: '#c0392b', fontWeight: 700 }}>{crop?.name ?? cid}</span>
                  <span style={{ fontFamily: 'var(--font-main)', fontSize: '0.6rem', color: '#e74c3c', fontWeight: 800 }}>×3 DMG</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weapon deploy */}
      {!progress.isDefeated && (
        <div className="glass-panel" style={{ padding: 'var(--space-md)', borderColor: weaponOwned ? 'rgba(201,124,46,0.5)' : 'var(--brown-border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--brown-dark)', marginBottom: 8 }}>🌟 Weapon Deploy</div>
          {weaponOwned ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {equippedWeaponId !== weapon && (
                <AnimatedButton onClick={() => equipWeapon(weapon)} className="btn-base btn-amber" style={{ flex: 1, fontSize: '0.78rem', padding: '8px 12px' }}>
                  ⚔️ Equip Chapter Weapon
                </AnimatedButton>
              )}
              {equippedWeaponId === weapon && (
                <AnimatedButton onClick={() => equipWeapon(null)} className="btn-base btn-ghost" style={{ flex: 1, fontSize: '0.78rem', padding: '8px 12px' }}>
                  🗃️ Unequip Weapon
                </AnimatedButton>
              )}
            </div>
          ) : (
            <AnimatedButton
              onClick={() => buyWeapon(weapon)}
              disabled={coins < 1000}
              className={`btn-base ${coins >= 1000 ? 'btn-amber' : 'btn-ghost'}`}
              style={{ width: '100%', fontSize: '0.78rem', padding: '8px 12px', opacity: coins >= 1000 ? 1 : 0.5 }}
            >
              🌟 Craft Chapter Weapon
            </AnimatedButton>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Resolution / Festival Page ───────────────────────────────
const ResolutionPage: React.FC<{ page: StoryPage; chapter: Chapter }> = ({ page, chapter }) => {
  const progress = useGameStore(s => s.chapterProgress[chapter.id]);
  const defeated = progress?.isDefeated ?? false;
  const isFestival = page.pageType === 'festival_page';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      <div
        className="glass-panel"
        style={{
          padding: 'var(--space-xl)', textAlign: 'center',
          background: defeated
            ? (isFestival ? 'linear-gradient(145deg, #1a2a1a, #2d4a2d)' : 'linear-gradient(145deg, var(--amber-pale), var(--surface))')
            : 'var(--surface)',
          borderColor: defeated ? 'rgba(74,124,89,0.5)' : 'var(--brown-border)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, fontSize: '8rem', opacity: 0.04, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          {page.art}
        </div>
        {!defeated ? (
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔒</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--text-muted)' }}>
              Defeat {chapter.boss.name} to unlock this page.
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>{page.art}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: isFestival ? '#7db87e' : 'var(--brown-dark)', marginBottom: 8 }}>
              {page.title}
            </div>
            <p style={{ fontFamily: 'var(--font-main)', fontSize: '0.72rem', lineHeight: 1.75, color: isFestival ? 'rgba(253,246,232,0.75)' : 'var(--text-secondary)', fontStyle: 'italic', maxWidth: 480, margin: '0 auto' }}>
              "{page.body}"
            </p>
            {isFestival && (
              <div style={{ marginTop: 'var(--space-lg)' }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: 'rgba(253,246,232,0.55)', marginBottom: 8 }}>
                  Prestige resets your world — but you keep weapons, achievements, and Prestige Points.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Generic Dispatch ─────────────────────────────────────────
const StoryBookPage: React.FC<Props> = ({ page, chapter, marketPrices, weatherEmoji }) => {
  switch (page.pageType) {
    case 'chapter_intro':
      return <ChapterIntroPage page={page} chapter={chapter} />;
    case 'exploration_quest':
      return <ExplorationQuestPage chapter={chapter} />;
    case 'merchant_page':
      return <MerchantPage page={page} marketPrices={marketPrices} weatherEmoji={weatherEmoji} />;
    case 'worker_story':
      return <WorkerStoryPage page={page} />;
    case 'boss_prelude':
      return <BossPreludePage page={page} chapter={chapter} />;
    case 'boss_page':
      return <BossPageContent chapter={chapter} />;
    case 'resolution_page':
    case 'festival_page':
      return <ResolutionPage page={page} chapter={chapter} />;
    case 'crafting_page':
      return (
        <div className="glass-panel" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔨</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', color: 'var(--brown-dark)', marginBottom: 6 }}>{page.title}</div>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{page.body}</p>
        </div>
      );
    default:
      return null;
  }
};

export default StoryBookPage;
