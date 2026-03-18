import React from 'react';
import { useGameStore } from '../store/gameStore';

const navItems = [
  { id: 'farm',         label: 'Garden Plots',    icon: '🪴' },
  { id: 'machines',     label: 'Garden Helpers',  icon: '🤖' },
  { id: 'workers',      label: 'Village Folk',    icon: '👨‍🌾' },
  { id: 'upgrades',     label: 'Crafting Recipes',icon: '📖' },
  { id: 'skills',       label: 'Skill Garden',    icon: '🌱' },
  { id: 'market',       label: 'Market Stall',    icon: '🛒' },
  { id: 'regions',      label: 'World Discovery', icon: '🗺️' },
  { id: 'prestige',     label: 'Great Harvest',   icon: '✨' },
  { id: 'storybook',    label: 'Story Book',      icon: '📚' },
  { id: 'achievements', label: 'Achievements',    icon: '🏆' },
];

const Sidebar: React.FC = () => {
  const activePanel = useGameStore((s) => s.activePanel);
  const setPanel    = useGameStore((s) => s.setPanel);

  return (
    <aside
      style={{
        width: 200,
        minWidth: 200,
        flexShrink: 0,
        background: 'linear-gradient(180deg, #c49a5a 0%, #7a5228 100%)',
        borderRadius: 'var(--radius-md)',
        border: '2px solid #5c3d1e',
        boxShadow: '3px 0 16px rgba(92,61,30,0.2)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Garden title strip */}
      <div
        style={{
          background: 'rgba(0,0,0,0.15)',
          borderBottom: '1.5px solid rgba(253,246,232,0.18)',
          padding: '12px 12px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>🌻</span>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            color: '#fdf6e8',
            fontSize: '0.92rem',
            letterSpacing: '0.03em',
            lineHeight: 1.1,
            textShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}>
            Garden Menu
          </div>
          <div style={{
            fontFamily: 'var(--font-sans)',
            color: 'rgba(253,246,232,0.5)',
            fontSize: '0.55rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            Your cozy farm
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        {navItems.map((item) => {
          const isActive = activePanel === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPanel(item.id)}
              title={item.label}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-display)',
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                border: isActive
                  ? '1.5px solid rgba(125,184,126,0.55)'
                  : '1.5px solid transparent',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(74,124,89,0.9), rgba(45,106,55,0.85))'
                  : 'rgba(253,246,232,0.1)',
                color: '#fdf6e8',
                fontWeight: isActive ? 700 : 400,
                boxShadow: isActive
                  ? '0 2px 8px rgba(45,106,55,0.4), inset 0 1px 1px rgba(255,255,255,0.2)'
                  : 'none',
                letterSpacing: '0.02em',
                textAlign: 'left',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  fontSize: '1.15rem',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  transition: 'transform 0.18s',
                  transform: isActive ? 'scale(1.15)' : 'scale(1)',
                }}
              >
                {item.icon}
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.label}
              </span>
              {isActive && (
                <span
                  style={{
                    marginLeft: 'auto',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#a8e6a3',
                    boxShadow: '0 0 4px rgba(168,230,163,0.9)',
                    flexShrink: 0,
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '10px 12px',
          borderTop: '1.5px solid rgba(253,246,232,0.14)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
          background: 'rgba(0,0,0,0.12)',
        }}
      >
        <span
          style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#7db87e',
            boxShadow: '0 0 5px rgba(125,184,126,0.8)',
            flexShrink: 0,
            display: 'inline-block',
          }}
        />
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.6rem',
            fontWeight: 700,
            color: 'rgba(253,246,232,0.45)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            lineHeight: 1,
          }}>
            Cozy Farm
          </div>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.6rem',
            fontWeight: 600,
            color: 'rgba(253,246,232,0.35)',
            lineHeight: 1,
            marginTop: 2,
          }}>
            Garden Online
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
