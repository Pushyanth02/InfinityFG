import React from 'react';
import { useGameStore } from './store/gameStore';
import Layout from './ui/Layout';
import PanelManager from './ui/PanelManager';

export default function App() {
  const activePanel = useGameStore(s => s.activePanel);

  return (
    <Layout>
      <PanelManager activePanel={activePanel} />
    </Layout>
  );
}
