import React from 'react';
import { useGameStore, fmt } from '../store/gameStore';
import { REGIONS } from '../data/world';

const biomeEmojis: Record<string, string> = {
  green_meadows:  '🌿', riverlands: '🏞️', sunny_plateau: '☀️',
  dusty_mesa:     '🏜️', rainy_basin: '🌧️', frost_peaks:   '❄️',
  volcanic_ridge: '🌋', crystal_valley: '💎', floating_isles: '🏝️',
};
const getBiomeEmoji = (id: string) => biomeEmojis[id] ?? '🗺️';

const RegionPanel: React.FC = () => {
  const { coins, unlockedRegions, currentRegion } = useGameStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', maxWidth: 960, margin: '0 auto' }} className="animate-in">
      <div style={{ borderBottom: '1.5px solid var(--brown-border)', paddingBottom: 'var(--space-md)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--brown-dark)', lineHeight: 1.1 }}>
          🗺️ World Discovery Journal
        </h2>
        <p className="panel-subtitle" style={{ marginTop: 4 }}>Navigate your cozy farm adventure across magical biomes</p>
      </div>

      <div className="dashboard-grid">
        {REGIONS.map((region) => {
          const isUnlocked = unlockedRegions.includes(region.id);
          const isActive = currentRegion === region.id;
          const canUnlock = coins >= region.unlock_cost;
          const emoji = getBiomeEmoji(region.id);

          return (
            <div
              key={region.id}
              className="glass-panel"
              style={{
                display: 'flex', flexDirection: 'column', gap: 'var(--space-md)',
                overflow: 'hidden', position: 'relative',
                borderColor: isActive ? 'rgba(74,124,89,0.6)' : isUnlocked ? 'var(--brown-border)' : 'rgba(139,96,51,0.18)',
                opacity: !isUnlocked ? 0.6 : 1,
                transition: 'all 0.25s ease',
              }}
            >
              {/* Illustrated biome header */}
              <div style={{
                height: 110, position: 'relative', overflow: 'hidden',
                background: isActive
                  ? 'linear-gradient(145deg, #c8f0d0, #e8f5d4)'
                  : isUnlocked
                  ? 'linear-gradient(145deg, var(--amber-pale), var(--bg-deep))'
                  : 'linear-gradient(145deg, #e8e0d0, #d4cab8)',
                borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                borderBottom: '1.5px solid var(--brown-border)',
                margin: '-16px -16px 0', padding: '16px',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))', lineHeight: 1 }}>
                  {emoji}
                </span>
                {isActive && (
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: '#fff',
                    background: 'var(--green-dark)', padding: '3px 10px',
                    borderRadius: 'var(--radius-xl)', boxShadow: '0 2px 6px rgba(45,106,55,0.4)',
                  }}>
                    🏡 Home
                  </span>
                )}
              </div>

              {/* Content */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', padding: '0 var(--space-md) var(--space-md)' }}>
                <div>
                  <div className="panel-subtitle">Biome</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--brown-dark)', lineHeight: 1.2 }}>
                    {region.name}
                  </div>
                </div>

                <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-xs) var(--space-sm)', border: '1px solid var(--brown-border)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Harvest Bonus</span>
                    <span style={{ fontFamily: 'var(--font-main)', fontWeight: 800, color: 'var(--green-dark)' }}>×{region.multiplier.toFixed(1)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Weather</span>
                    <span style={{ fontFamily: 'var(--font-main)', fontWeight: 700, color: 'var(--sky)', textTransform: 'capitalize' }}>{region.weather_affinity}</span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', fontStyle: 'italic', color: 'var(--text-muted)', lineHeight: 1.4, borderTop: '1px dashed var(--brown-border)', paddingTop: 5, marginTop: 2 }}>
                    "{region.description}"
                  </p>
                </div>

                {isUnlocked ? (
                  <button
                    disabled={isActive}
                    className={`btn-base w-full ${isActive ? 'btn-ghost' : 'btn-primary'}`}
                    style={{ fontSize: '0.78rem', padding: '8px 12px', opacity: isActive ? 0.6 : 1 }}
                  >
                    {isActive ? '🏡 Currently Here' : '🗺️ Travel Here'}
                  </button>
                ) : (
                  <button
                    disabled={!canUnlock}
                    className={`btn-base w-full ${canUnlock ? 'btn-amber' : 'btn-ghost'}`}
                    style={{ fontSize: '0.78rem', padding: '8px 12px', opacity: canUnlock ? 1 : 0.5 }}
                  >
                    🌿 Explore Region
                    <span style={{ fontSize: '0.62rem', opacity: 0.75, marginLeft: 4 }}>({fmt(region.unlock_cost)} 🪙)</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RegionPanel;
