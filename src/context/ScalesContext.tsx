import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { 
  ALL_SCALE_ITEMS, ScaleItem, ARTICULATIONS, TEMPO_LEVELS, Articulation, TempoLevel, getPracticeId,
  DIRECTION_TYPES, HAND_CONFIGURATIONS, RHYTHMIC_PERMUTATIONS, ACCENT_DISTRIBUTIONS, OCTAVE_CONFIGURATIONS,
  DirectionType, HandConfiguration, RhythmicPermutation, AccentDistribution, OctaveConfiguration,
  DohnanyiExercise, DohnanyiItem, ALL_DOHNANYI_ITEMS, DOHNANYI_BPM_TARGETS, getDohnanyiPracticeId, ALL_DOHNANYI_COMBINATIONS
} from '@/lib/scales';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

// --- Types ---

export type ScaleStatus = 'untouched' | 'practiced' | 'mastered';

// Progress is now keyed by a combination ID (scaleId-Articulation-Tempo-Direction-HandConfig-Rhythm-Accent-Octaves OR DOHNANYI-Exercise-BPM)
export interface StoredProgressEntry {
  practice_id: string;
  status: 'practiced' | 'mastered';
}

export interface PracticeLogItem {
  type: 'scale' | 'dohnanyi';
  // Scale specific fields
  scaleId?: string;
  articulation?: Articulation;
  tempo?: TempoLevel;
  direction?: DirectionType;
  handConfig?: HandConfiguration;
  rhythm?: RhythmicPermutation;
  accent?: AccentDistribution;
  octaves?: OctaveConfiguration;
  // Dohnanyi specific fields
  dohnanyiName?: DohnanyiExercise;
  bpmTarget?: number; // The target BPM for Dohnanyi mastery step
}

export interface PracticeLogEntry {
  id: string;
  timestamp: number;
  durationMinutes: number;
  itemsPracticed: PracticeLogItem[]; // Renamed from scalesPracticed
  notes: string;
}

interface ScalesContextType {
  progressMap: Record<string, 'practiced' | 'mastered'>;
  log: PracticeLogEntry[];
  isLoading: boolean;
  updatePracticeStatus: (practiceId: string, status: ScaleStatus) => void;
  addLogEntry: (entry: Omit<PracticeLogEntry, 'id' | 'timestamp'>) => void;
  allScales: ScaleItem[];
  allDohnanyi: DohnanyiItem[];
  allDohnanyiCombinations: typeof ALL_DOHNANYI_COMBINATIONS;
}

// --- Context and Provider ---

const ScalesContext = createContext<ScalesContextType | undefined>(undefined);

// Helper to convert DB array to map
const progressArrayToMap = (arr: StoredProgressEntry[]): Record<string, 'practiced' | 'mastered'> => {
  return arr.reduce((acc, item) => {
    acc[item.practice_id] = item.status;
    return acc;
  }, {} as Record<string, 'practiced' | 'mastered'>);
};

export const ScalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userId, isLoading: isSessionLoading } = useSupabaseSession();
  const [progressMap, setProgressMap] = useState<Record<string, 'practiced' | 'mastered'>>({});
  const [log, setLog] = useState<PracticeLogEntry[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const isLoading = isSessionLoading || isDataLoading;

  // 1. Fetch data from Supabase
  const fetchData = useCallback(async (id: string) => {
    setIsDataLoading(true);
    
    // Fetch Progress
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('practice_id, status')
      .eq('user_id', id);

    if (progressError) {
      console.error("[ScalesContext] Error fetching progress:", progressError);
      showError("Failed to load practice progress.");
    } else if (progressData) {
      setProgressMap(progressArrayToMap(progressData as StoredProgressEntry[]));
    }

    // Fetch Logs
    const { data: logData, error: logError } = await supabase
      .from('practice_logs')
      .select('id, duration_minutes, scales_practiced, notes, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (logError) {
      console.error("[ScalesContext] Error fetching logs:", logError);
      showError("Failed to load practice logs.");
    } else if (logData) {
      // Note: DB column is still named 'scales_practiced' but stores PracticeLogItem[]
      const formattedLog: PracticeLogEntry[] = logData.map(item => ({
        id: item.id,
        timestamp: new Date(item.created_at).getTime(),
        durationMinutes: item.duration_minutes,
        itemsPracticed: item.scales_practiced || [], // Use new name internally
        notes: item.notes || '',
      }));
      setLog(formattedLog);
    }

    setIsDataLoading(false);
  }, []);

  useEffect(() => {
    if (userId) {
      fetchData(userId);
    } else if (!isSessionLoading) {
      // If not logged in, clear state and stop loading
      setProgressMap({});
      setLog([]);
      setIsDataLoading(false);
    }
  }, [userId, isSessionLoading, fetchData]);


  // 2. Update Practice Status (Upsert to Supabase)
  const updatePracticeStatus = useCallback(async (practiceId: string, status: ScaleStatus) => {
    if (!userId) {
      showError("You must be logged in to save progress.");
      return;
    }

    if (status === 'untouched') {
      // Delete entry if status is untouched
      const { error } = await supabase
        .from('user_progress')
        .delete()
        .eq('user_id', userId)
        .eq('practice_id', practiceId);

      if (error) {
        console.error("[ScalesContext] Error deleting progress:", error);
        showError("Failed to reset practice status.");
        return;
      }
      
      // Update local state
      setProgressMap(prev => {
        const newState = { ...prev };
        delete newState[practiceId];
        return newState;
      });

    } else {
      // Upsert entry if status is practiced or mastered
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          practice_id: practiceId,
          status: status,
        }, { onConflict: 'user_id, practice_id' });

      if (error) {
        console.error("[ScalesContext] Error upserting progress:", error);
        showError("Failed to save practice status.");
        return;
      }
      
      // Update local state
      setProgressMap(prev => ({
        ...prev,
        [practiceId]: status,
      }));
    }
  }, [userId]);

  // 3. Add Log Entry (Insert to Supabase)
  const addLogEntry = useCallback(async (entry: Omit<PracticeLogEntry, 'id' | 'timestamp'>) => {
    if (!userId) {
      showError("You must be logged in to log practice sessions.");
      return;
    }

    const newEntry: PracticeLogEntry = {
      ...entry,
      id: Date.now().toString(), // Temporary ID for local state update
      timestamp: Date.now(),
    };

    // Note: Using 'scales_practiced' column name for backward compatibility with existing schema
    const { data, error } = await supabase
      .from('practice_logs')
      .insert({
        user_id: userId,
        duration_minutes: entry.durationMinutes,
        scales_practiced: entry.itemsPracticed, // Storing PracticeLogItem[] here
        notes: entry.notes,
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error("[ScalesContext] Error inserting log entry:", error);
      showError("Failed to log practice session.");
      return;
    }
    
    // Update local state with the actual ID and timestamp from DB
    const finalEntry: PracticeLogEntry = {
        ...newEntry,
        id: data.id,
        timestamp: new Date(data.created_at).getTime(),
    };

    setLog(prev => [finalEntry, ...prev]);
  }, [userId]);


  const contextValue = useMemo(() => ({
    progressMap,
    log,
    isLoading,
    updatePracticeStatus,
    addLogEntry,
    allScales: ALL_SCALE_ITEMS,
    allDohnanyi: ALL_DOHNANYI_ITEMS,
    allDohnanyiCombinations: ALL_DOHNANYI_COMBINATIONS,
  }), [progressMap, log, isLoading, updatePracticeStatus, addLogEntry]);

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