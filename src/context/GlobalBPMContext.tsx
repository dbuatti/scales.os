import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { MIN_BPM, MAX_BPM } from '@/lib/scales';
import { clampBpm, nextGoalBPM } from '@/lib/tempo';

export const SNAPSHOT_DEBOUNCE_MS = 1000; // 1 second debounce

export type ActivePracticeItem = 
  | { type: 'scale', scalePermutationId: string, key: string, scaleType: string, articulation: string, octaves: string, handConfig: string, highestBPM: number, nextGoalBPM: number }
  | { type: 'dohnanyi', name: string, exerciseId: string, nextTargetBPM: number, currentHighestBPM: number, isMastered: boolean }
  | { type: 'hanon', name: string, exerciseId: string, nextTargetBPM: number, currentHighestBPM: number, isMastered: boolean }
  | { type: 'repertoire', name: string, exerciseId: string, nextTargetBPM: number, currentHighestBPM: number, isMastered: boolean }
  | null;

export interface AutoNudgeConfig {
  increment: number;
  overshootAllowance: number;
  snapshotBpm?: number; // The BPM from the latest snapshot
}

interface GlobalBPMContextType {
  currentBPM: number;
  activePermutationHighestBPM: number;
  activePracticeItem: ActivePracticeItem;
  activeLogSnapshotFunction: (() => void) | null;
  isPermutationManuallyAdjusted: boolean;
  handleBpmChange: (delta: number) => void;
  setCurrentBPM: (bpm: number) => void;
  setActivePermutationHighestBPM: (bpm: number) => void;
  setActivePracticeItem: (item: ActivePracticeItem) => void;
  setActiveLogSnapshotFunction: (func: (() => void) | null) => void;
  setIsPermutationManuallyAdjusted: (isAdjusted: boolean) => void;
  autoNudgeBPMOnSnapshot: (config?: Partial<AutoNudgeConfig>) => void;
}

const GlobalBPMContext = createContext<GlobalBPMContextType | undefined>(undefined);

export const GlobalBPMProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [currentBPM, setCurrentBPMState] = useState(100);
  const [activePermutationHighestBPM, setActivePermutationHighestBPM] = useState(0);
  const [activePracticeItem, setActivePracticeItemState] = useState<ActivePracticeItem>(null);
  const [activeLogSnapshotFunction, setActiveLogSnapshotFunction] = useState<(() => void) | null>(null);
  const [isBpmManuallyAdjusted, setIsBpmManuallyAdjusted] = useState(false);
  const [isPermutationManuallyAdjusted, setIsPermutationManuallyAdjusted] = useState(false);

  // Wrapper for setCurrentBPM to also set the manual adjustment flag
  const setCurrentBPM = useCallback((bpm: number) => {
    setCurrentBPMState(clampBpm(bpm));
    setIsBpmManuallyAdjusted(true);
  }, []);

  const handleBpmChange = useCallback((delta: number) => {
    setCurrentBPMState(prev => {
      const newBPM = Math.min(MAX_BPM, Math.max(MIN_BPM, prev + delta));
      return newBPM;
    });
    setIsBpmManuallyAdjusted(true);
  }, []);

  // Auto-nudge BPM on snapshot: increment by 2-3 BPM, cap at goal tempo with slight overshoot allowance
  const autoNudgeBPMOnSnapshot = useCallback((config?: Partial<AutoNudgeConfig>) => {
    const { increment = 3, overshootAllowance = 2, snapshotBpm } = config || {};
    if (!activePracticeItem) return;

    let goalBPM: number;
    if (activePracticeItem.type === 'scale') {
      goalBPM = activePracticeItem.nextGoalBPM;
    } else {
      goalBPM = activePracticeItem.nextTargetBPM;
    }

    setCurrentBPMState(prev => {
      // Use snapshot BPM as base if provided, otherwise use current BPM
      const baseBPM = snapshotBpm && snapshotBpm > 0 ? snapshotBpm : prev;
      const nextBPM = Math.min(MAX_BPM, baseBPM + increment);
      // Cap at goal + overshoot allowance
      const cappedBPM = Math.min(nextBPM, goalBPM + overshootAllowance);
      return clampBpm(cappedBPM);
    });
    setIsBpmManuallyAdjusted(true);
  }, [activePracticeItem]);

  // Wrapper for setActivePracticeItem to reset manual adjustment flag
  const setActivePracticeItem = useCallback((item: ActivePracticeItem) => {
    setActivePracticeItemState(item);
    setIsBpmManuallyAdjusted(false);
  }, []);

  // Effect to manage currentBPM based on activePracticeItem, but only if not manually adjusted
  useEffect(() => {
    if (activePracticeItem && !isBpmManuallyAdjusted) {
      let targetBPM: number;
      if (activePracticeItem.type === 'scale') {
        targetBPM = activePracticeItem.nextGoalBPM;
      } else {
        targetBPM = activePracticeItem.nextTargetBPM;
      }

      if (currentBPM !== targetBPM) {
        setCurrentBPMState(targetBPM);
      }
    } else if (!activePracticeItem && !isBpmManuallyAdjusted) {
      if (currentBPM !== 100) {
        setCurrentBPMState(100);
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
    autoNudgeBPMOnSnapshot,
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
    setIsPermutationManuallyAdjusted,
    autoNudgeBPMOnSnapshot,
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