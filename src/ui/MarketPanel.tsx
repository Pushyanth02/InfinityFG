import React, { useEffect, useState } from 'react';
import { fmt } from '../store/gameStore';
import { CROPS } from '../data/crops';

const weatherEmojis = ['☀️', '🌤️', '⛅', '🌧️', '🌈'];

const MarketPanel: React.FC = () => {
  const [weatherIdx, setWeatherIdx] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setWeatherIdx((prev) => (prev + 1) % weatherEmojis.length);
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const weatherEmoji = weatherEmojis[weatherIdx];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', maxWidth: 960, margin: '0 auto' }} className="animate-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1.5px solid var(--brown-border)', paddingBottom: 'var(--space-md)' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--brown-dark)', lineHeight: 1.1 }}>
            🛒 Village Market Stall
          </h2>
          <p className="panel-subtitle" style={{ marginTop: 4 }}>Trade your harvest with the village — fair prices, warm smiles!</p>
        </div>
        <div style={{ textAlign: 'right', background: 'var(--amber-pale)', borderRadius: 'var(--radius-md)', padding: '8px 14px', border: '1.5px solid rgba(201,124,46,0.3)' }}>
          <div className="panel-subtitle">Market Mood</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--amber)', lineHeight: 1.2 }}>
            {weatherEmoji} Fair Weather
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-lg)' }} className="lg:grid-cols-12">
        {/* Commodity Stalls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', gridColumn: 'span 7' }}>
          <div className="vine-divider">
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--brown-mid)', whiteSpace: 'nowrap' }}>
              🌽 Today's Produce
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            {CROPS.slice(0, 8).map((crop) => (
              <div
                key={crop.id}
                className="glass-panel"
                style={{
                  padding: 'var(--space-sm) var(--space-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--brown-mid)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--brown-border)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(145deg, var(--amber-pale), var(--bg-deep))',
                    border: '2px solid var(--brown-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.8rem', flexShrink: 0, boxShadow: 'var(--shadow-card)',
                  }}>
                    {crop.emoji ?? crop.name.split(' ')[0]}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--brown-dark)' }}>{crop.name}</div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Base price: 🪙 {fmt(crop.baseValue)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div className="panel-subtitle">Demand</div>
                    <span style={{
                      fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--green-dark)',
                      background: 'var(--green-pale)', border: '1.5px solid rgba(74,124,89,0.3)',
                      borderRadius: 'var(--radius-xl)', padding: '1px 8px',
                    }}>High ✅</span>
                  </div>
                  <div style={{ width: 1, height: 32, background: 'var(--brown-border)' }} />
                  <div style={{ textAlign: 'right', minWidth: 50 }}>
                    <div className="panel-subtitle">Bonus</div>
                    <div style={{ fontFamily: 'var(--font-main)', fontWeight: 800, fontSize: '0.88rem', color: 'var(--amber)' }}>×1.24</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Village Orders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', gridColumn: 'span 5' }}>
          <div className="vine-divider">
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--amber)', whiteSpace: 'nowrap' }}>
              📦 Village Care Packages
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="glass-panel"
                style={{ padding: 'var(--space-md)', position: 'relative', overflow: 'hidden', borderColor: 'rgba(201,124,46,0.3)' }}
              >
                {/* Decorative */}
                <div style={{ position: 'absolute', top: -8, right: -8, fontSize: '3.5rem', opacity: 0.06, pointerEvents: 'none', transform: 'rotate(15deg)' }}>🧺</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 'var(--space-sm)', position: 'relative', zIndex: 1 }}>
                  <span style={{
                    fontFamily: 'var(--font-sans)', fontSize: '0.58rem', fontWeight: 700,
                    color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.1em',
                    background: 'var(--amber-pale)', padding: '2px 8px',
                    borderRadius: 'var(--radius-xl)', border: '1px solid rgba(201,124,46,0.3)', display: 'inline-block', alignSelf: 'flex-start',
                  }}>
                    Village Order #{6024 + i}
                  </span>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--brown-dark)', lineHeight: 1.3 }}>
                    Village Care Package
                  </div>
                </div>

                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', lineHeight: 1.5, color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)', fontStyle: 'italic', position: 'relative', zIndex: 1 }}>
                  "The city folk are hungry for your delicious crops! Priority clearance granted for a fresh delivery."
                </p>

                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-xs) var(--space-sm)', border: '1.5px solid var(--brown-border)',
                  position: 'relative', zIndex: 1,
                }}>
                  <div>
                    <div className="panel-subtitle">Package Value</div>
                    <div style={{ fontFamily: 'var(--font-main)', fontWeight: 800, fontSize: '1rem', color: 'var(--amber)' }}>
                      🪙 {fmt(5000 * i)}
                    </div>
                  </div>
                  <button className="btn-base btn-amber" style={{ fontSize: '0.75rem', padding: '6px 14px' }}>
                    🚗 Deliver
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketPanel;
