import React from 'react';
import { useGameStore, fmt } from '../../store/gameStore';
import { CHAPTERS } from '../../data/chapters';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { UI_THEME } from '../theme';

export function TopBar() {
  const { coins, prestigePoints, currentRegion, currentChapterId, chapterProgress } = useGameStore();
  const animatedCoins = useAnimatedNumber(coins);
  const animatedPrestige = useAnimatedNumber(prestigePoints);
  const chapter = CHAPTERS.find((entry) => entry.id === currentChapterId) ?? CHAPTERS[0];
  const progress = chapterProgress[chapter.id];
  const hp = progress?.bossHp ?? chapter.boss.maxHp;
  const bossPercent = Math.max(0, Math.min(100, (hp / chapter.boss.maxHp) * 100));

  return (
    <header
      className="flex items-center justify-between gap-2 md:gap-4"
      style={{
        padding: '10px 12px',
        background: UI_THEME.panelBackground,
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${UI_THEME.panelBorder}`,
        color: '#fdf6e8',
        zIndex: 30,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.86rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          🌍 {currentRegion.replace(/_/g, ' ')}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3" style={{ minWidth: 0 }}>
        <StatPill label="Coins" value={`🪙 ${fmt(animatedCoins)}`} color={UI_THEME.accent} />
        <StatPill label="Prestige" value={`⭐ ${fmt(animatedPrestige)}`} color={UI_THEME.primary} />
      </div>

      <div style={{ textAlign: 'right', minWidth: 110 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.66rem', color: 'rgba(253,246,232,0.8)' }}>
          ⚔️ Boss {Math.floor(bossPercent)}%
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 999, marginTop: 4, overflow: 'hidden' }}>
          <div style={{ width: `${bossPercent}%`, height: '100%', background: UI_THEME.danger, transition: 'width 0.2s ease' }} />
        </div>
      </div>
    </header>
  );
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        border: '1px solid rgba(255,255,255,0.16)',
        borderRadius: 10,
        padding: '4px 8px',
        background: 'rgba(255,255,255,0.06)',
        minWidth: 84,
      }}
    >
      <div style={{ fontSize: '0.54rem', fontFamily: 'var(--font-sans)', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-main)', color, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

export default TopBar;

