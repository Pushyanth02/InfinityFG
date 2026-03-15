import React from 'react';
import { useGameStore, fmt } from '../store/gameStore';

const PrestigePanel: React.FC = () => {
  const { lifetimeCoins, prestigePoints, ascend } = useGameStore();
  const potentialPoints = Math.floor(Math.sqrt(lifetimeCoins / 1e6));
  const gained = Math.max(0, potentialPoints - prestigePoints);
  const hasPrestige = gained > 0;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)', padding: 'var(--space-lg) 0' }} className="animate-in">
      {/* ── Festive Header ── */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 8 }}>🌟🌸🌟</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--brown-dark)', letterSpacing: '0.03em', lineHeight: 1.1 }}>
          Great Harvest Festival
        </h2>
        <p className="panel-subtitle" style={{ marginTop: 6 }}>
          Share your abundance with the village & earn eternal Harvest Stars!
        </p>
      </div>

      {/* ── Cards Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-xl)' }}>
        {/* Standing Card */}
        <div
          className="glass-panel"
          style={{ padding: 'var(--space-lg)', border: '2px solid rgba(201,124,46,0.3)', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', top: -10, right: -10, fontSize: '5rem', opacity: 0.05, transform: 'rotate(20deg)' }}>🌾</div>
          <div className="vine-divider" style={{ marginBottom: 'var(--space-md)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--amber)', whiteSpace: 'nowrap' }}>📊 Your Standing</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px dashed var(--brown-border)', paddingBottom: 'var(--space-sm)' }}>
              <span className="panel-subtitle">Lifetime Gold Earned</span>
              <span style={{ fontFamily: 'var(--font-main)', fontWeight: 800, fontSize: '1.25rem', color: 'var(--amber)' }}>🪙 {fmt(lifetimeCoins)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="panel-subtitle">Harvest Stars Earned</span>
              <span style={{ fontFamily: 'var(--font-main)', fontWeight: 800, fontSize: '1.25rem', color: '#f5b942' }}>⭐ {fmt(prestigePoints)}</span>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-md)', background: 'var(--amber-pale)', border: '1.5px solid rgba(201,124,46,0.25)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontStyle: 'italic', color: 'var(--amber)', lineHeight: 1.5 }}>
              "Each Harvest Star blesses your garden with a <strong>+10% productivity boost</strong> — forever!"
            </p>
          </div>
        </div>

        {/* Ascension Card */}
        <div
          className="glass-panel"
          style={{ padding: 'var(--space-lg)', border: '2px solid rgba(74,124,89,0.35)', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', top: -10, left: -10, fontSize: '5rem', opacity: 0.05, transform: 'rotate(-15deg)' }}>🌟</div>
          <div className="vine-divider" style={{ marginBottom: 'var(--space-md)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--green-dark)', whiteSpace: 'nowrap' }}>🌟 Festival Preview</span>
          </div>

          <div style={{ textAlign: 'center', padding: 'var(--space-lg) 0', position: 'relative', zIndex: 1 }}>
            <div className="panel-subtitle">New Harvest Stars Available</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', color: '#f5b942', lineHeight: 1, margin: '12px 0', filter: 'drop-shadow(0 2px 8px rgba(245,185,66,0.3))' }}>
              +{gained}
            </div>
            <div style={{ fontSize: '1.5rem' }}>⭐</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', position: 'relative', zIndex: 1 }}>
            <button
              disabled={!hasPrestige}
              onClick={ascend}
              className={`btn-base w-full ${hasPrestige ? 'btn-amber' : 'btn-ghost'}`}
              style={{ fontSize: '0.88rem', padding: '12px 20px', opacity: hasPrestige ? 1 : 0.5 }}
            >
              🌟 Begin Great Harvest
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(201,84,84,0.2)' }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', fontWeight: 700, color: 'rgba(217,123,106,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                ⚠️ Resets your current progress
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(201,84,84,0.2)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Locked Artifacts */}
      <div>
        <div className="vine-divider" style={{ marginBottom: 'var(--space-md)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--text-muted)', opacity: 0.6, whiteSpace: 'nowrap' }}>
            🔮 Festival Treasures
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-md)', opacity: 0.35, pointerEvents: 'none' }}>
          {['Ancient Seeds', 'Golden Watering Can', 'Magical Compass', 'Star Map'].map(name => (
            <div
              key={name}
              className="glass-panel"
              style={{ height: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--brown-border)', gap: 4 }}
            >
              <span style={{ fontSize: '1.5rem' }}>🔒</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrestigePanel;
