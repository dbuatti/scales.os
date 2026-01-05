import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { MIN_BPM, MAX_BPM } from '@/lib/scales';

export const SNAPSHOT_DEBOUNCE_MS = 1000; // 1 second debounce

export type ActivePracticeItem = 
  | { type: 'scale', key: string, scaleType: string, articulation: string, octaves: string, highestBPM: number, nextGoalBPM: number }
  | { type: 'dohnanyi', name: string, nextTargetBPM: number, isMastered: boolean }
  | { type: 'hanon', name: string, nextTargetBPM: number, isMastered: boolean }
  | null;

interface GlobalBPMContextType {
  currentBPM: number;
  activePermutationHighestBPM: number;
  activePracticeItem: ActivePracticeItem;
  activeLogSnapshotFunction: (() => void) | null;
  handleBpmChange: (delta: number) => void;
  setCurrentBPM: (bpm: number) => void;
  setActivePermutationHighestBPM: (bpm: number) => void;
  setActivePracticeItem: (item: ActivePracticeItem) => void;
  setActiveLogSnapshotFunction: (func: (() => void) | null) => void;
}

const GlobalBPMContext = createContext<GlobalBPMContextType | undefined>(undefined);

export const GlobalBPMProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [currentBPM, setCurrentBPM] = useState(100);
  const [activePermutationHighestBPM, setActivePermutationHighestBPM] = useState(0);
  const [activePracticeItem, setActivePracticeItem] = useState<ActivePracticeItem>(null);
  const [activeLogSnapshotFunction, setActiveLogSnapshotFunction] = useState<(() => void) | null>(null);

  const handleBpmChange = useCallback((delta: number) => {
    setCurrentBPM(prev => Math.min(MAX_BPM, Math.max(MIN_BPM, prev + delta)));
  }, []);
  
  // New useEffect to manage currentBPM based on activePracticeItem
  useEffect(() => {
    if (activePracticeItem) {
      let targetBPM: number;
      if (activePracticeItem.type === 'scale') {
        targetBPM = activePracticeItem.nextGoalBPM;
      } else { // dohnanyi or hanon
        targetBPM = activePracticeItem.nextTargetBPM;
      }

      // Only update currentBPM if it's different from the targetBPM
      if (currentBPM !== targetBPM) {
        console.log(`[GlobalBPMContext] Setting currentBPM to ${targetBPM} based on activePracticeItem.`);
        setCurrentBPM(targetBPM);
      }
    } else {
      // If no active practice item, reset to a default BPM (e.g., 100)
      if (currentBPM !== 100) {
        console.log(`[GlobalBPMContext] No active practice item. Resetting currentBPM to 100.`);
        setCurrentBPM(100);
      }
    }
  }, [activePracticeItem, currentBPM]); // Depend on activePracticeItem and currentBPM

  const contextValue = useMemo(() => ({
    currentBPM,
    activePermutationHighestBPM,
    activePracticeItem,
    activeLogSnapshotFunction,
    handleBpmChange,
    setCurrentBPM,
    setActivePermutationHighestBPM,
    setActivePracticeItem,
    setActiveLogSnapshotFunction,
  }), [currentBPM, activePermutationHighestBPM, activePracticeItem, activeLogSnapshotFunction, handleBpmChange]);

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