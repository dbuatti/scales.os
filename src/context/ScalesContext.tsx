import React, { createContext, useContext, useState, useMemo } from 'react';
import { ALL_SCALE_ITEMS, ScaleItem, ARTICULATIONS, TEMPO_LEVELS, Articulation, TempoLevel, getPracticeId } from '@/lib/scales';

// --- Types ---

export type ScaleStatus = 'untouched' | 'practiced' | 'mastered';

// Progress is now keyed by a combination ID (scaleId-Articulation-Tempo)
export interface ScaleProgress {
  [practiceId: string]: ScaleStatus;
}

export interface PracticeLogEntry {
  id: string;
  timestamp: number;
  durationMinutes: number;
  scalesPracticed: {
    scaleId: string;
    articulation: Articulation;
    tempo: TempoLevel;
  }[];
  notes: string;
}

interface ScalesContextType {
  progress: ScaleProgress;
  log: PracticeLogEntry[];
  updatePracticeStatus: (practiceId: string, status: ScaleStatus) => void;
  addLogEntry: (entry: Omit<PracticeLogEntry, 'id' | 'timestamp'>) => void;
  allScales: ScaleItem[];
}

// --- Context and Provider ---

const ScalesContext = createContext<ScalesContextType | undefined>(undefined);

// Initialize progress for ALL combinations
const initialProgress: ScaleProgress = ALL_SCALE_ITEMS.reduce((acc, item) => {
  ARTICULATIONS.forEach(articulation => {
    TEMPO_LEVELS.forEach(tempo => {
      const practiceId = getPracticeId(item.id, articulation, tempo);
      acc[practiceId] = 'untouched';
    });
  });
  return acc;
}, {} as ScaleProgress);

export const ScalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<ScaleProgress>(initialProgress);
  const [log, setLog] = useState<PracticeLogEntry[]>([]);

  const updatePracticeStatus = (practiceId: string, status: ScaleStatus) => {
    setProgress(prev => ({
      ...prev,
      [practiceId]: status,
    }));
  };

  const addLogEntry = (entry: Omit<PracticeLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: PracticeLogEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    setLog(prev => [newEntry, ...prev]);

    // Update status for all practiced combinations
    entry.scalesPracticed.forEach(({ scaleId, articulation, tempo }) => {
      const practiceId = getPracticeId(scaleId, articulation, tempo);
      
      // Automatically mark practiced combinations as 'practiced' if they were 'untouched'
      if (progress[practiceId] === 'untouched') {
        updatePracticeStatus(practiceId, 'practiced');
      }
    });
  };

  const contextValue = useMemo(() => ({
    progress,
    log,
    updatePracticeStatus,
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