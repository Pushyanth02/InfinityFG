import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { TickEngine } from '../../engine/TickEngine';
import Sidebar from '../Sidebar';
import TopBar from './TopBar';
import MainView from './MainView';
import MobileTabs from '../mobile/MobileTabs';

export function GameLayout() {
  const activePanel = useGameStore((state) => state.activePanel);
  const setPanel = useGameStore((state) => state.setPanel);

  return (
    <div
      className="flex flex-col h-screen overflow-hidden select-none"
      style={{ background: 'var(--bg)', fontFamily: 'var(--font-main)', color: 'var(--text-primary)' }}
    >
      <TickEngine />
      <TopBar />

      <div className="flex flex-1 min-h-0 gap-2 p-2 pb-[72px] md:pb-2">
        <div className="hidden md:block">
          <Sidebar />
        </div>

        <MainView activePanel={activePanel} setPanel={setPanel} />
      </div>

      <MobileTabs active={activePanel} setActive={setPanel} />
    </div>
  );
}

export default GameLayout;

