import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { MIN_BPM, MAX_BPM } from '@/lib/scales';

export const SNAPSHOT_DEBOUNCE_MS = 1000; // 1 second debounce

export type ActivePracticeItem = 
  | { type: 'scale', key: string, scaleType: string, articulation: string, octaves: string, handConfig: string, highestBPM: number, nextGoalBPM: number }
  | { type: 'dohnanyi', name: string, exerciseId: string, nextTargetBPM: number, currentHighestBPM: number, isMastered: boolean }
  | { type: 'hanon', name: string, exerciseId: string, nextTargetBPM: number, currentHighestBPM: number, isMastered: boolean }
  | null;

interface GlobalBPMContextType {
  currentBPM: number;
  activePermutationHighestBPM: number;
  activePracticeItem: ActivePracticeItem;
  activeLogSnapshotFunction: (() => void) | null;
  isPermutationManuallyAdjusted: boolean; // New state for manual permutation adjustments
  handleBpmChange: (delta: number) => void;
  setCurrentBPM: (bpm: number) => void;
  setActivePermutationHighestBPM: (bpm: number) => void;
  setActivePracticeItem: (item: ActivePracticeItem) => void;
  setActiveLogSnapshotFunction: (func: (() => void) | null) => void;
  setIsPermutationManuallyAdjusted: (isAdjusted: boolean) => void; // New setter
}

const GlobalBPMContext = createContext<GlobalBPMContextType | undefined>(undefined);

export const GlobalBPMProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [currentBPM, setCurrentBPMState] = useState(100);
  const [activePermutationHighestBPM, setActivePermutationHighestBPM] = useState(0);
  const [activePracticeItem, setActivePracticeItemState] = useState<ActivePracticeItem>(null);
  const [activeLogSnapshotFunction, setActiveLogSnapshotFunction] = useState<(() => void) | null>(null);
  const [isBpmManuallyAdjusted, setIsBpmManuallyAdjusted] = useState(false);
  const [isPermutationManuallyAdjusted, setIsPermutationManuallyAdjusted] = useState(false); // New state

  // Wrapper for setCurrentBPM to also set the manual adjustment flag
  const setCurrentBPM = useCallback((bpm: number) => {
    setCurrentBPMState(bpm);
    setIsBpmManuallyAdjusted(true); // Mark as manually adjusted
  }, []);

  const handleBpmChange = useCallback((delta: number) => {
    setCurrentBPMState(prev => {
      const newBPM = Math.min(MAX_BPM, Math.max(MIN_BPM, prev + delta));
      return newBPM;
    });
    setIsBpmManuallyAdjusted(true); // Mark as manually adjusted
  }, []);
  
  // Wrapper for setActivePracticeItem to reset manual adjustment flag
  const setActivePracticeItem = useCallback((item: ActivePracticeItem) => {
    setActivePracticeItemState(item);
    // Reset BPM manual adjustment flag when a new practice item is selected
    setIsBpmManuallyAdjusted(false); 
    // IMPORTANT: isPermutationManuallyAdjusted is NOT reset here.
    // It is reset only when a suggestion is loaded or tab is changed in PracticeCommandCenter.
  }, []);

  // Effect to manage currentBPM based on activePracticeItem, but only if not manually adjusted
  useEffect(() => {
    if (activePracticeItem && !isBpmManuallyAdjusted) {
      let targetBPM: number;
      if (activePracticeItem.type === 'scale') {
        targetBPM = activePracticeItem.nextGoalBPM;
      } else { // dohnanyi or hanon
        targetBPM = activePracticeItem.nextTargetBPM;
      }

      // Only update currentBPM if it's different from the targetBPM
      if (currentBPM !== targetBPM) {
        setCurrentBPMState(targetBPM); // Use internal state setter to avoid marking as manual
      }
    } else if (!activePracticeItem && !isBpmManuallyAdjusted) {
      // If no active practice item and not manually adjusted, reset to a default BPM (e.g., 100)
      if (currentBPM !== 100) {
        setCurrentBPMState(100); // Use internal state setter
      }
    }
  }, [activePracticeItem, isBpmManuallyAdjusted, currentBPM]);

  const contextValue = useMemo(() => ({
    currentBPM,
    activePermutationHighestBPM,
    activePracticeItem,
    activeLogSnapshotFunction,
    isPermutationManuallyAdjusted,
    handleBpmChange,
    setCurrentBPM,
    setActivePermutationHighestBPM,
    setActivePracticeItem,
    setActiveLogSnapshotFunction,
    setIsPermutationManuallyAdjusted,
  }), [
    currentBPM, 
    activePermutationHighestBPM, 
    activePracticeItem, 
    activeLogSnapshotFunction, 
    isPermutationManuallyAdjusted,
    handleBpmChange, 
    setCurrentBPM, 
    setActivePermutationHighestBPM, 
    setActivePracticeItem, 
    setActiveLogSnapshotFunction,
    setIsPermutationManuallyAdjusted
  ]);

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