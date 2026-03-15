import React from 'react';
import { useGameStore, fmt } from '../store/gameStore';
import { WORKERS } from '../data/world';

const workerEmojis = ['👨‍🌾', '👩‍🍳', '🧑‍🌾', '👩‍🔬', '🧑‍🍳', '👨‍🍳', '🌾', '🐝'];
const getWorkerEmoji = (idx: number) => workerEmojis[idx % workerEmojis.length];

const WorkerPanel: React.FC = () => {
  const { coins, workers, buyWorker } = useGameStore();
  const totalWorkers = Object.values(workers).reduce((a, b) => a + b, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', maxWidth: 960, margin: '0 auto' }} className="animate-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1.5px solid var(--brown-border)', paddingBottom: 'var(--space-md)' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--brown-dark)', lineHeight: 1.1 }}>
            👨‍🌾 Village Folk
          </h2>
          <p className="panel-subtitle" style={{ marginTop: 4 }}>Invite your neighbors to help tend the garden</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="panel-subtitle">Villagers Helping</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--green-dark)', lineHeight: 1 }}>
            {totalWorkers} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>🏡</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {WORKERS.map((worker, idx) => {
          const count = workers[worker.id] || 0;
          const nextCost = worker.hire_cost * Math.pow(2.5, count);
          const canAfford = coins >= nextCost;
          const emoji = getWorkerEmoji(idx);

          return (
            <div
              key={worker.id}
              className="glass-panel"
              style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}
            >
              {/* Worker card top */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 'var(--radius-xl)',
                  background: 'linear-gradient(135deg, #d4edda, var(--green-pale))',
                  border: '2px solid rgba(74,124,89,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', flexShrink: 0,
                }}>
                  {emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <span className={`badge badge-${worker.tier.toLowerCase()}`} style={{ marginBottom: 4, display: 'inline-block' }}>
                    {worker.tier}
                  </span>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--brown-dark)', lineHeight: 1.2 }}>{worker.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="panel-subtitle">In Village</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--green-dark)', lineHeight: 1 }}>{count}</div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-xs) var(--space-sm)', border: '1px solid var(--brown-border)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Helpfulness</span>
                  <span style={{ fontFamily: 'var(--font-main)', fontWeight: 800, color: 'var(--green-dark)' }}>+{Math.floor(worker.efficiency_bonus * 100)}%</span>
                </div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.62rem', fontStyle: 'italic', color: 'var(--text-muted)', lineHeight: 1.4, borderTop: '1px dashed var(--brown-border)', paddingTop: 5 }}>
                  "{worker.description}"
                </p>
              </div>

              <button
                onClick={() => buyWorker(worker.id)}
                disabled={!canAfford}
                className={`btn-base w-full ${canAfford ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.78rem', padding: '8px 12px', opacity: canAfford ? 1 : 0.5 }}
              >
                🏡 Invite to Village
                <span style={{ fontSize: '0.62rem', opacity: 0.75, marginLeft: 4 }}>({fmt(nextCost)} 🪙)</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkerPanel;
