import { useCallback } from 'react';

const DEFAULT_VOLUME = 0.3;

export function playSound(src: string, volume = DEFAULT_VOLUME) {
  if (typeof window === 'undefined') return;
  const audio = new Audio(src);
  audio.volume = Math.max(0, Math.min(1, volume));
  audio.play().catch(() => {
    // Ignore autoplay and missing-file failures in UX layer.
  });
}

export function useSound(src: string, volume = DEFAULT_VOLUME) {
  return useCallback(() => {
    playSound(src, volume);
  }, [src, volume]);
}

