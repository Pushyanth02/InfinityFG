import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * The Heartbeat of AgriEmpire.
 * Runs at 10Hz (every 100ms) to update the global simulation state.
 */
export const TickEngine: React.FC = () => {
  const tick = useGameStore((state) => state.tick);

  // Allow configurable tick frequency and batch updates
  useEffect(() => {
    let lastTick = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      // Batch updates if >200ms elapsed
      if (now - lastTick > 200) {
        tick(now);
        lastTick = now;
      } else {
        tick(now);
      }
    }, 200); // Default to 200ms for performance
    return () => clearInterval(interval);
  }, [tick]);
  return null; // Invisible background component
};
