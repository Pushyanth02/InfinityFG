import React from 'react';
import Sidebar from './Sidebar';
import StatsBar from './StatsBar';
import EventFeed from './EventFeed';
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
        <EventFeed />
      </div>
    </div>
  );
};

export default Layout;
