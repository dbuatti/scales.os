import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { MIN_BPM, MAX_BPM } from '@/lib/scales';

export type ActivePracticeItem = 
  | { type: 'scale', key: string, scaleType: string, articulation: string, octaves: string, highestBPM: number, nextGoalBPM: number }
  | { type: 'dohnanyi', name: string, nextTargetBPM: number, isMastered: boolean }
  | { type: 'hanon', name: string, nextTargetBPM: number, isMastered: boolean }
  | null;

interface GlobalBPMContextType {
  currentBPM: number;
  activePermutationHighestBPM: number;
  activePracticeItem: ActivePracticeItem;
  handleBpmChange: (delta: number) => void;
  setCurrentBPM: (bpm: number) => void;
  setActivePermutationHighestBPM: (bpm: number) => void;
  setActivePracticeItem: (item: ActivePracticeItem) => void;
}

const GlobalBPMContext = createContext<GlobalBPMContextType | undefined>(undefined);

export const GlobalBPMProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [currentBPM, setCurrentBPM] = useState(100);
  const [activePermutationHighestBPM, setActivePermutationHighestBPM] = useState(0);
  const [activePracticeItem, setActivePracticeItem] = useState<ActivePracticeItem>(null);

  const handleBpmChange = useCallback((delta: number) => {
    setCurrentBPM(prev => Math.min(MAX_BPM, Math.max(MIN_BPM, prev + delta)));
  }, []);
  
  const contextValue = useMemo(() => ({
    currentBPM,
    activePermutationHighestBPM,
    activePracticeItem,
    handleBpmChange,
    setCurrentBPM,
    setActivePermutationHighestBPM,
    setActivePracticeItem,
  }), [currentBPM, activePermutationHighestBPM, activePracticeItem, handleBpmChange]);

  return (
    <GlobalBPMContext.Provider value={contextValue}>
      {children}
    </GlobalBPMContext.Provider>
  );
};

export const useGlobalBPM = () => {
  const context = useContext(GlobalBPMContext);
  if (context === undefined) {
    throw new Error('useGlobalBPM must be used within a GlobalBPMProvider');
  }
  return context;
};