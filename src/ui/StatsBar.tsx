import React from 'react';
import { useGameStore, fmt } from '../store/gameStore';

const StatsBar: React.FC = () => {
  const { coins, gems, prestigePoints, currentRegion } = useGameStore();

  const biomeLabel = currentRegion.replace(/_/g, ' ');

  return (
    <header aria-label="Game stats bar" role="banner"
      style={{
        background: 'linear-gradient(135deg, #8b6033 0%, #5c3d1e 100%)',
        borderBottom: '3px solid #4a2d0e',
        padding: '0 var(--space-lg)',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 50,
        flexShrink: 0,
        boxShadow: '0 3px 12px rgba(92, 61, 30, 0.4)',
      }}
    >
      {/* ── Left: Title & Biome ── */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            color: '#fdf6e8',
            letterSpacing: '0.03em',
            lineHeight: 1.1,
            textShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}>
            🌱 Cozy Garden
          </span>
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.6rem',
            fontWeight: 700,
            color: 'rgba(253,246,232,0.65)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
          }}>
            {biomeLabel}
          </span>
        </div>

        <div style={{ width: 1, height: 36, background: 'rgba(253,246,232,0.2)' }} />

        {/* ── Stats Chips ── */}
        <div className="flex items-center gap-3">
          <StatChip icon="🪙" label="Gold Coins"   value={fmt(coins)}         color="#fcc940" />
          <StatChip icon="💧" label="Magic Dew"    value={fmt(gems)}          color="#74bfe0" />
          <StatChip icon="⭐" label="Harvest Stars" value={fmt(prestigePoints)} color="#f5b942" />
        </div>
      </div>

      {/* ── Right: Status ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '4px 12px',
          border: '1.5px solid rgba(253,246,232,0.15)',
        }}
      >
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#7db87e',
          boxShadow: '0 0 6px rgba(125,184,126,0.8)',
          animation: 'bounce-soft 1.8s ease-in-out infinite',
          display: 'inline-block',
        }} />
        <div className="flex flex-col items-end">
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: '#fdf6e8', letterSpacing: '0.04em' }}>
            Your Garden
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.55rem', fontWeight: 700, color: 'rgba(253,246,232,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            All is well ✨
          </span>
        </div>
      </div>
    </header>
  );
};

interface StatChipProps { icon: string; label: string; value: string; color: string; }
const StatChip: React.FC<StatChipProps> = ({ icon, label, value, color }) => (
  <div
    style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'rgba(0,0,0,0.18)',
      borderRadius: 'var(--radius-md)',
      padding: '4px 10px',
      border: '1.5px solid rgba(253,246,232,0.12)',
    }}
  >
    <span style={{ fontSize: '1rem' }}>{icon}</span>
    <div className="flex flex-col" style={{ lineHeight: 1 }}>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.55rem', fontWeight: 700, color: 'rgba(253,246,232,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-main)', fontSize: '0.85rem', fontWeight: 800, color, letterSpacing: '-0.01em', marginTop: 1 }}>
        {value}
      </span>
    </div>
  </div>
);

export default StatsBar;
