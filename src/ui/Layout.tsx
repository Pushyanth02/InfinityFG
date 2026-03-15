import React from 'react';
import Sidebar from './Sidebar';
import StatsBar from './StatsBar';
import VillageNews from './VillageNews';
import { TickEngine } from '../engine/TickEngine';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div
      className="flex flex-col h-screen overflow-hidden select-none"
      style={{ background: 'var(--bg)', fontFamily: 'var(--font-main)', color: 'var(--text-primary)' }}
    >
      <TickEngine />
      <StatsBar />
      <div
        className="flex flex-1 overflow-hidden"
        style={{ padding: 'var(--space-xs)', gap: 'var(--space-xs)' }}
      >
        <Sidebar />
        <main
          className="flex-1 overflow-y-auto animate-in"
          style={{
            background: 'var(--panel)',
            border: '2px solid var(--brown-border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-lg)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {children}
        </main>
        <aside
          style={{
            width: 240,
            minWidth: 240,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            border: '2px solid var(--brown-border)',
            boxShadow: 'var(--shadow-card)',
            background: '#3d4a35',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #5c3d1e, #4a2d0e)',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.05rem' }}>📰</span>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.88rem',
                    color: '#fdf6e8',
                    letterSpacing: '0.03em',
                    lineHeight: 1,
                  }}
                >
                  Village News
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.55rem',
                    fontWeight: 700,
                    color: 'rgba(253,246,232,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginTop: 2,
                  }}
                >
                  Global Event Feed
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding: '10px 12px' }}>
            <VillageNews maxItems={25} />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Layout;
