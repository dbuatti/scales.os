import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
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

const PROGRESS_STORAGE_KEY = 'professional_scales_progress';
const LOG_STORAGE_KEY = 'professional_scales_log';

// Initialize progress for ALL combinations
const getInitialProgress = (): ScaleProgress => {
  try {
    const storedProgress = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (storedProgress) {
      return JSON.parse(storedProgress);
    }
  } catch (error) {
    console.error("Error loading progress from local storage:", error);
  }
  
  // Default initialization if storage fails or is empty
  return ALL_SCALE_ITEMS.reduce((acc, item) => {
    ARTICULATIONS.forEach(articulation => {
      TEMPO_LEVELS.forEach(tempo => {
        const practiceId = getPracticeId(item.id, articulation, tempo);
        acc[practiceId] = 'untouched';
      });
    });
    return acc;
  }, {} as ScaleProgress);
};

const getInitialLog = (): PracticeLogEntry[] => {
  try {
    const storedLog = localStorage.getItem(LOG_STORAGE_KEY);
    if (storedLog) {
      return JSON.parse(storedLog);
    }
  } catch (error) {
    console.error("Error loading log from local storage:", error);
  }
  return [];
};


export const ScalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<ScaleProgress>(getInitialProgress);
  const [log, setLog] = useState<PracticeLogEntry[]>(getInitialLog);

  // Effect to save progress to local storage
  useEffect(() => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  // Effect to save log to local storage
  useEffect(() => {
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(log));
  }, [log]);


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

    // NOTE: Removed automatic status update. Status is now controlled manually via the grid.
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