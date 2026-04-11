import React, { useEffect } from 'react';
import { pingAppwrite } from './services/appwrite';
import { FeedbackLayer } from './ui/feedback/FeedbackLayer';
import GameLayout from './ui/layout/GameLayout';

export default function App() {
  // Verify Appwrite backend connectivity on app startup
  useEffect(() => {
    pingAppwrite();
  }, []);

  return (
    <FeedbackLayer>
      <GameLayout />
    </FeedbackLayer>
  );
}
