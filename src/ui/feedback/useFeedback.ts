import { createContext, useContext } from 'react';

export interface FeedbackApi {
  spawnFloatingText: (value: string, x: number, y: number, color?: string) => void;
}

export const FeedbackContext = createContext<FeedbackApi | null>(null);

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within FeedbackLayer');
  }
  return context;
}

