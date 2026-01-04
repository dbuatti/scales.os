import React, { createContext, useContext, useState, useMemo } from 'react';
import { ALL_SCALE_ITEMS, ScaleItem } from '@/lib/scales';

// --- Types ---

export type ScaleStatus = 'untouched' | 'practiced' | 'mastered';

export interface ScaleProgress {
  [scaleId: string]: ScaleStatus;
}

export interface PracticeLogEntry {
  id: string;
  timestamp: number;
  durationMinutes: number;
  scalesPracticed: string[]; // IDs of scales practiced
  notes: string;
}

interface ScalesContextType {
  progress: ScaleProgress;
  log: PracticeLogEntry[];
  updateScaleStatus: (scaleId: string, status: ScaleStatus) => void;
  addLogEntry: (entry: Omit<PracticeLogEntry, 'id' | 'timestamp'>) => void;
  allScales: ScaleItem[];
}

// --- Context and Provider ---

const ScalesContext = createContext<ScalesContextType | undefined>(undefined);

const initialProgress: ScaleProgress = ALL_SCALE_ITEMS.reduce((acc, item) => {
  acc[item.id] = 'untouched';
  return acc;
}, {} as ScaleProgress);

export const ScalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<ScaleProgress>(initialProgress);
  const [log, setLog] = useState<PracticeLogEntry[]>([]);

  const updateScaleStatus = (scaleId: string, status: ScaleStatus) => {
    setProgress(prev => ({
      ...prev,
      [scaleId]: status,
    }));
  };

  const addLogEntry = (entry: Omit<PracticeLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: PracticeLogEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    setLog(prev => [newEntry, ...prev]);

    // Automatically mark practiced scales as 'practiced' if they were 'untouched'
    entry.scalesPracticed.forEach(scaleId => {
      if (progress[scaleId] === 'untouched') {
        updateScaleStatus(scaleId, 'practiced');
      }
    });
  };

  const contextValue = useMemo(() => ({
    progress,
    log,
    updateScaleStatus,
    addLogEntry,
    allScales: ALL_SCALE_ITEMS,
  }), [progress, log]);

  return (
    <ScalesContext.Provider value={contextValue}>
      {children}
    </ScalesContext.Provider>
  );
};

export const useScales = () => {
  const context = useContext(ScalesContext);
  if (context === undefined) {
    throw new Error('useScales must be used within a ScalesProvider');
  }
  return context;
};