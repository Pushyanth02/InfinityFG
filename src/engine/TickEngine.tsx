import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * The Heartbeat of AgriEmpire.
 * Runs at 10Hz (every 100ms) to update the global simulation state.
 */
export const TickEngine: React.FC = () => {
  const tick = useGameStore((state) => state.tick);

  useEffect(() => {
    const interval = setInterval(() => {
      tick(Date.now());
    }, 100);

    return () => clearInterval(interval);
  }, [tick]);

  return null; // Invisible background component
};
