"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface PracticeTransportContextType {
  sessionSeconds: number;
  isTimerRunning: boolean;
  isPracticeMode: boolean;
  startTimer: () => void;
  startPractice: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  endPractice: () => void;
}

const PracticeTransportContext = createContext<PracticeTransportContextType | undefined>(undefined);

/**
 * Shared by the sticky header transport and the practice page. Keeping the
 * timer here means the header control and the saved-session snapshot always
 * read the same elapsed time.
 */
export const PracticeTransportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  const startTimer = useCallback(() => setIsTimerRunning(true), []);
  const startPractice = useCallback(() => {
    setIsPracticeMode(true);
    setIsTimerRunning(true);
  }, []);
  const pauseTimer = useCallback(() => setIsTimerRunning(false), []);
  const resetTimer = useCallback(() => {
    setIsTimerRunning(false);
    setSessionSeconds(0);
  }, []);
  const endPractice = useCallback(() => {
    setIsPracticeMode(false);
    setIsTimerRunning(false);
  }, []);

  useEffect(() => {
    if (!isTimerRunning) return;
    const id = window.setInterval(() => setSessionSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(id);
  }, [isTimerRunning]);

  const value = useMemo(
    () => ({
      sessionSeconds,
      isTimerRunning,
      isPracticeMode,
      startTimer,
      startPractice,
      pauseTimer,
      resetTimer,
      endPractice,
    }),
    [
      sessionSeconds,
      isTimerRunning,
      isPracticeMode,
      startTimer,
      startPractice,
      pauseTimer,
      resetTimer,
      endPractice,
    ],
  );

  return (
    <PracticeTransportContext.Provider value={value}>
      {children}
    </PracticeTransportContext.Provider>
  );
};

export const usePracticeTransport = () => {
  const context = useContext(PracticeTransportContext);
  if (context === undefined) {
    throw new Error('usePracticeTransport must be used within a PracticeTransportProvider');
  }
  return context;
};
