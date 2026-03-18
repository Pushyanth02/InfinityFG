import React, { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import Layout from './ui/Layout';
import PanelManager from './ui/PanelManager';
import { pingAppwrite } from './services/appwrite';

export default function App() {
  const activePanel = useGameStore(s => s.activePanel);

  // Verify Appwrite backend connectivity on app startup
  useEffect(() => {
    pingAppwrite();
  }, []);

  return (
    <Layout>
      <PanelManager activePanel={activePanel} />
    </Layout>
  );
}
