import React, { useState } from 'react';
import { useGameStore, fmt } from '../store/gameStore';
import { CROPS } from '../data/crops';

/* ── Cozy helper styles ─────────────────────────────────── */
const plotCard: React.CSSProperties = {
  background: 'var(--panel)',
  border: '2px solid var(--brown-border)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-md)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-sm)',
  boxShadow: 'var(--shadow-card)',
  transition: 'all 0.2s ease',
};

const FarmPanel: React.FC = () => {
  const { plots, coins, unlockedCrops, plantCrop, harvestCrop, buyPlot } = useGameStore();
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null);
  const nextPlotCost = 100 * Math.pow(2, plots.length - 4);

  /* ── Friendly Plot Name ── */
  const plotNames = ['Daisy Patch', 'Veggie Patch', 'Flower Bed', 'Seedling Area', 'Herb Corner', 'Berry Bush', 'Pumpkin Row', 'Sunflower Field'];
  const getPlotName = (idx: number) => plotNames[idx % plotNames.length];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', maxWidth: 900, margin: '0 auto' }}>
      {/* ── Header ── */}
      <div className="animate-in" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--brown-dark)', letterSpacing: '0.02em', lineHeight: 1.1 }}>
            🌻 Rustic Garden Overview
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 4 }}>
            Your cozy garden plots — tend, grow & harvest
          </p>
        </div>
        <button
          onClick={buyPlot}
          disabled={coins < nextPlotCost}
          className="btn-base btn-amber"
          style={{ fontSize: '0.78rem', padding: '8px 16px', gap: 6 }}
        >
          <span>🌱</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
            <span>New Garden Bed</span>
            <span style={{ fontSize: '0.6rem', opacity: 0.75 }}>{fmt(nextPlotCost)} Gold Coins</span>
          </div>
        </button>
      </div>

      {/* ── Plot Grid ── */}
      <div className="dashboard-grid">
        {plots.map((plot, idx) => {
          const crop = CROPS.find(c => c.id === plot.cropId);
          return (
            <div
              key={plot.id}
              className="animate-in"
              style={{ ...plotCard, animationDelay: `${idx * 0.06}s`, borderColor: plot.isReady ? 'rgba(74,124,89,0.55)' : 'var(--brown-border)' }}
            >
              {/* Plot ID badge */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)',
                padding: '3px 8px', border: '1.5px solid var(--brown-border)',
              }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Plot: {getPlotName(idx)}
                </span>
                {plot.isReady && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-mid)', display: 'inline-block', animation: 'bounce-soft 1.8s ease-in-out infinite' }} />
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--green-dark)', fontWeight: 700 }}>Ready to Harvest!</span>
                  </div>
                )}
              </div>

              {/* Soil bed visual */}
              <div style={{
                height: 110, borderRadius: 'var(--radius-sm)',
                background: plot.cropId
                  ? 'linear-gradient(180deg, #d4b896 0%, #b8925a 100%)'
                  : 'linear-gradient(180deg, #c4a575 0%, #a07848 100%)',
                border: '2px solid #8b6033',
                boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
              }}>
                {crop ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, zIndex: 10 }}>
                    <span style={{ fontSize: '3rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))', lineHeight: 1 }}>
                      {crop.name.split(' ')[0]}
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: '#4a2d0e', background: 'rgba(255,248,220,0.85)', padding: '1px 6px', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
                      {crop.name}
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.5 }}>
                    <span style={{ fontSize: '1.8rem' }}>🌱</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: '#5c3d1e', marginTop: 2 }}>Plant Something?</span>
                  </div>
                )}
                {/* Growth bar */}
                {plot.cropId && !plot.isReady && (
                  <div style={{ position: 'absolute', inset: 0, bottom: 0, top: 'auto', height: 5, background: 'rgba(92,61,30,0.25)' }}>
                    <div style={{ height: '100%', width: `${plot.growthProgress * 100}%`, background: 'linear-gradient(90deg, var(--green-mid), var(--green-light))', transition: 'width 0.4s ease', boxShadow: '0 0 6px rgba(74,124,89,0.5)' }} />
                  </div>
                )}
              </div>

              {/* Action button */}
              <div>
                {plot.cropId ? (
                  <button
                    disabled={!plot.isReady}
                    onClick={() => harvestCrop(plot.id)}
                    className={`btn-base w-full ${plot.isReady ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.78rem', padding: '8px 12px', opacity: plot.isReady ? 1 : 0.55 }}
                  >
                    {plot.isReady ? '🌾 Harvest Crops' : `🕐 Growing... ${Math.floor(plot.growthProgress * 100)}%`}
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedPlot(plot.id)}
                    className="btn-base btn-amber w-full"
                    style={{ fontSize: '0.78rem', padding: '8px 12px' }}
                  >
                    🌱 Plant Seeds
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Seed Bank Modal ── */}
      {selectedPlot && (
        <div
          className="animate-in"
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 'var(--space-lg)',
            background: 'rgba(74, 45, 14, 0.55)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div style={{
            background: 'var(--panel)', border: '3px solid var(--brown-border-strong)',
            borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 680, maxHeight: '88vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(92,61,30,0.4)',
          }}>
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, #8b6033, #5c3d1e)', padding: 'var(--space-md) var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: '#fdf6e8', letterSpacing: '0.03em' }}>🌱 Seed Bank</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', fontWeight: 700, color: 'rgba(253,246,232,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>
                  Choose seeds for: {selectedPlot}
                </div>
              </div>
              <button
                onClick={() => setSelectedPlot(null)}
                style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(253,246,232,0.3)', background: 'rgba(0,0,0,0.2)', color: '#fdf6e8', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            {/* Seed Cards */}
            <div style={{ padding: 'var(--space-md)', overflow: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-sm)' }}>
              {CROPS.filter(c => unlockedCrops.includes(c.id)).map(crop => {
                const canAfford = coins >= crop.seedCost;
                return (
                  <button
                    key={crop.id}
                    disabled={!canAfford}
                    onClick={() => { plantCrop(selectedPlot, crop.id); setSelectedPlot(null); }}
                    style={{
                      background: canAfford ? 'var(--surface)' : 'rgba(240,230,204,0.5)',
                      border: `2px solid ${canAfford ? 'var(--brown-border)' : 'rgba(139,96,51,0.15)'}`,
                      borderRadius: 'var(--radius-md)', padding: 'var(--space-sm)',
                      cursor: canAfford ? 'pointer' : 'not-allowed',
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
                      transition: 'all 0.18s ease', opacity: canAfford ? 1 : 0.45,
                      textAlign: 'left',
                      boxShadow: 'var(--shadow-card)',
                    }}
                    onMouseEnter={e => { if (canAfford) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--brown-mid)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = canAfford ? 'var(--brown-border)' : 'rgba(139,96,51,0.15)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                      <span style={{ fontSize: '2rem' }}>{crop.name.split(' ')[0]}</span>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', color: 'var(--brown-dark)' }}>{crop.name}</div>
                        <span className={`badge badge-${crop.rarity}`}>{crop.rarity}</span>
                      </div>
                    </div>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontStyle: 'italic', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      "{crop.description}"
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', borderTop: '1px dashed var(--brown-border)', paddingTop: 6, marginTop: 2 }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cost</div>
                        <div style={{ fontFamily: 'var(--font-main)', fontWeight: 800, fontSize: '0.82rem', color: 'var(--amber)' }}>🪙 {fmt(crop.seedCost)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Grows in</div>
                        <div style={{ fontFamily: 'var(--font-main)', fontWeight: 800, fontSize: '0.82rem', color: 'var(--green-mid)' }}>{crop.growthTime}s</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmPanel;
