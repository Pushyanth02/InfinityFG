import React from 'react';
import { ACHIEVEMENTS } from '../data/narrative';

const bookEmojis = ['🌸', '🌻', '🌺', '🍄', '🌿', '🦋', '🐝', '🍓', '🌈', '🏡'];
const getAchEmoji = (idx: number) => bookEmojis[idx % bookEmojis.length];

const AchievementsPanel: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', maxWidth: 900, margin: '0 auto' }} className="animate-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1.5px solid var(--brown-border)', paddingBottom: 'var(--space-md)' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--brown-dark)', lineHeight: 1.1 }}>
            📚 Story Book
          </h2>
          <p className="panel-subtitle" style={{ marginTop: 4 }}>
            Your garden adventures & legendary deeds — every chapter earned!
          </p>
        </div>
        <div style={{
          background: 'var(--amber-pale)', borderRadius: 'var(--radius-md)',
          padding: '8px 14px', border: '1.5px solid rgba(201,124,46,0.28)', textAlign: 'right',
        }}>
          <div className="panel-subtitle">Pages Written</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--amber)', lineHeight: 1 }}>
            0 <span style={{ fontSize: '0.8rem', opacity: 0.55 }}>/ {ACHIEVEMENTS.length}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {ACHIEVEMENTS.map((ach, idx) => (
          <div
            key={ach.id}
            className="glass-panel"
            style={{
              padding: 'var(--space-md)', display: 'flex', gap: 'var(--space-md)',
              opacity: 0.55, position: 'relative', overflow: 'hidden',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.opacity = '0.85';
              el.style.borderColor = 'var(--brown-mid)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.opacity = '0.55';
              el.style.borderColor = 'var(--brown-border)';
            }}
          >
            {/* Decorative bg */}
            <div style={{ position: 'absolute', top: -20, right: -20, fontSize: '4.5rem', opacity: 0.04, pointerEvents: 'none', transform: 'rotate(15deg)' }}>📖</div>

            {/* Achievement badge */}
            <div style={{
              width: 60, height: 60, flexShrink: 0, borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(145deg, var(--bg-deep), var(--surface))',
              border: '2px solid var(--brown-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem', filter: 'grayscale(0.7)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)',
            }}>
              {getAchEmoji(idx)}
            </div>

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', color: 'var(--brown-dark)', lineHeight: 1.2 }}>
                  {ach.title}
                </div>
                <span style={{
                  fontFamily: 'var(--font-sans)', fontSize: '0.55rem', fontWeight: 700,
                  background: 'var(--bg-deep)', color: 'var(--text-muted)',
                  padding: '2px 8px', border: '1px solid var(--brown-border)',
                  borderRadius: 'var(--radius-xl)', textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                  🔒 Locked
                </span>
              </div>

              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.62rem', fontStyle: 'italic', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                "{ach.flavor_text}"
              </p>

              {/* Progress bar */}
              <div className="progress-bar" style={{ height: 5, marginTop: 4 }}>
                <div className="progress-fill" style={{ width: '0%' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementsPanel;
