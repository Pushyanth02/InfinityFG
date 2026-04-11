import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { FloatingText } from './FloatingText';
import { CinematicOverlay } from '../cinematic/CinematicOverlay';
import { eventBus } from '../../services/eventBus';
import { playSound } from '../hooks/useSound';
import { FeedbackContext, type FeedbackApi } from './useFeedback';

interface FloatingEntry {
  id: number;
  value: string;
  x: number;
  y: number;
  color?: string;
}

interface FeedbackLayerProps {
  children: React.ReactNode;
}

export function FeedbackLayer({ children }: FeedbackLayerProps) {
  const [floating, setFloating] = useState<FloatingEntry[]>([]);
  const [cinematicText, setCinematicText] = useState<string | null>(null);

  const spawnFloatingText = useCallback((value: string, x: number, y: number, color?: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setFloating((prev) => [...prev, { id, value, x, y, color }]);
  }, []);

  useEffect(() => {
    const unsubs = [
      eventBus.subscribe('CHAPTER_COMPLETED', (event) => {
        setCinematicText(`Chapter ${event.payload.chapterNumber} Complete`);
      }),
      eventBus.subscribe('REGION_UNLOCKED', (event) => {
        setCinematicText(`Region Unlocked: ${event.payload.regionName}`);
      }),
      eventBus.subscribe('PRESTIGE_PERFORMED', () => {
        setCinematicText('Prestige Awakened');
      }),
      eventBus.subscribe('BOSS_DEFEATED', (event) => {
        setCinematicText(`${event.payload.bossName} Defeated`);
        playSound('/sounds/boss_hit.wav', 0.4);
      }),
      eventBus.subscribe('BOSS_DAMAGED', (event) => {
        const centerX = typeof window !== 'undefined' ? window.innerWidth * 0.5 : 320;
        spawnFloatingText(`-${Math.max(1, Math.floor(event.payload.damage))}`, centerX, 220, '#ff8a8a');
      }),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, [spawnFloatingText]);

  useEffect(() => {
    if (!cinematicText) return;
    const timer = window.setTimeout(() => setCinematicText(null), 1400);
    return () => window.clearTimeout(timer);
  }, [cinematicText]);

  const api = useMemo<FeedbackApi>(() => ({ spawnFloatingText }), [spawnFloatingText]);

  return (
    <FeedbackContext.Provider value={api}>
      {children}
      <AnimatePresence>
        {floating.map((entry) => (
          <FloatingText
            key={entry.id}
            value={entry.value}
            x={entry.x}
            y={entry.y}
            color={entry.color}
            onComplete={() => {
              setFloating((prev) => prev.filter((item) => item.id !== entry.id));
            }}
          />
        ))}
      </AnimatePresence>
      <CinematicOverlay text={cinematicText} />
    </FeedbackContext.Provider>
  );
}
