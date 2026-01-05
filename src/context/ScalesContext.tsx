import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { 
  ALL_SCALE_ITEMS, ScaleItem, ARTICULATIONS, TEMPO_LEVELS, Articulation, TempoLevel, 
  DIRECTION_TYPES, HAND_CONFIGURATIONS, RHYTHMIC_PERMUTATIONS, ACCENT_DISTRIBUTIONS, OCTAVE_CONFIGURATIONS,
  DirectionType, HandConfiguration, RhythmicPermutation, AccentDistribution, OctaveConfiguration,
  DohnanyiExercise, DohnanyiItem, ALL_DOHNANYI_ITEMS, DOHNANYI_BPM_TARGETS, getDohnanyiPracticeId, ALL_DOHNANYI_COMBINATIONS,
  HanonExercise, HanonItem, ALL_HANON_ITEMS, ALL_HANON_COMBINATIONS, getScalePermutationId,
  PRACTICE_GRADES, getGradeRequirements,
} from '@/lib/scales';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

// --- Types ---

export type ScaleStatus = 'untouched' | 'practiced' | 'mastered';

// Progress is now keyed by a combination ID (Dohnanyi/Hanon/Grade Tracker specific)
export interface StoredProgressEntry {
  practice_id: string;
  status: 'practiced' | 'mastered';
}

export interface ScaleMasteryEntry {
  scale_permutation_id: string;
  highest_mastered_bpm: number;
}

export interface PracticeLogItem {
  type: 'scale' | 'dohnanyi' | 'hanon';
  // Scale specific fields
  scaleId?: string;
  articulation?: Articulation;
  tempo?: TempoLevel; // Kept for old logs/display
  direction?: DirectionType;
  handConfig?: HandConfiguration;
  rhythm?: RhythmicPermutation;
  accent?: AccentDistribution;
  octaves?: OctaveConfiguration;
  // New fields for granular scale tracking
  practicedBPM?: number; 
  scalePermutationId?: string;
  // Dohnanyi specific fields
  dohnanyiName?: DohnanyiExercise;
  bpmTarget?: number; // The target BPM for Dohnanyi mastery step
  // Hanon specific fields
  hanonName?: HanonExercise;
  hanonBpmTarget?: number;
}

export interface PracticeLogEntry {
  id: string;
  timestamp: number;
  durationMinutes: number;
  itemsPracticed: PracticeLogItem[]; // Renamed from scalesPracticed
  notes: string;
}

export type NextFocus = 
  | {
      type: 'scale';
      scaleItem: ScaleItem;
      scalePermutationId: string;
      requiredBPM: number;
      currentHighestBPM: number;
      nextBPMGoal: number;
      grade: number;
      description: string;
    }
  | {
      type: 'dohnanyi';
      name: DohnanyiExercise;
      bpmTarget: number;
      grade: number;
      description: string;
    }
  | {
      type: 'hanon';
      name: HanonExercise;
      bpmTarget: number;
      grade: number;
      description: string;
    }
  | null;


interface ScalesContextType {
  progressMap: Record<string, 'practiced' | 'mastered'>; // Used for Dohnanyi/Hanon/Old Grade Tracking
  scaleMasteryBPMMap: Record<string, number>; // Used for granular scale BPM tracking
  log: PracticeLogEntry[];
  isLoading: boolean;
  nextFocus: NextFocus;
  updatePracticeStatus: (practiceId: string, status: ScaleStatus) => void;
  updateScaleMasteryBPM: (scalePermutationId: string, newBPM: number) => void;
  addLogEntry: (entry: Omit<PracticeLogEntry, 'id' | 'timestamp'>) => void;
  allScales: ScaleItem[];
  allDohnanyi: DohnanyiItem[];
  allDohnanyiCombinations: typeof ALL_DOHNANYI_COMBINATIONS;
  allHanon: HanonItem[];
  allHanonCombinations: typeof ALL_HANON_COMBINATIONS;
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

// ScalesProvider now accepts and renders children
export const ScalesProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { userId, isLoading: isSessionLoading } = useSupabaseSession();
  const [progressMap, setProgressMap] = useState<Record<string, 'practiced' | 'mastered'>>({});
  const [scaleMasteryBPMMap, setScaleMasteryBPMMap] = useState<Record<string, number>>({});
  const [log, setLog] = useState<PracticeLogEntry[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const isLoading = isSessionLoading || isDataLoading;

  // 1. Fetch data from Supabase
  const fetchData = useCallback(async (id: string) => {
    setIsDataLoading(true);
    console.log(`[ScalesContext] Fetching data for user: ${id}`);
    
    // Fetch Progress (Dohnanyi/Hanon/Old Grade Tracking)
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('practice_id, status')
      .eq('user_id', id);

    if (progressError) {
      console.error("[ScalesContext] Error fetching progress:", progressError);
      showError("Failed to load practice progress.");
    } else if (progressData) {
      console.log(`[ScalesContext] Fetched ${progressData.length} progress entries`);
      setProgressMap(progressArrayToMap(progressData as StoredProgressEntry[]));
    }
    
    // Fetch Scale BPM Mastery
    const { data: scaleMasteryData, error: scaleMasteryError } = await supabase
      .from('scale_permutations_mastery')
      .select('scale_permutation_id, highest_mastered_bpm')
      .eq('user_id', id);

    if (scaleMasteryError) {
      console.error("[ScalesContext] Error fetching scale mastery BPM:", scaleMasteryError);
      showError("Failed to load scale BPM progress.");
    } else if (scaleMasteryData) {
      console.log(`[ScalesContext] Fetched ${scaleMasteryData.length} scale mastery entries`);
      const bpmMap = scaleMasteryData.reduce((acc, item) => {
        acc[item.scale_permutation_id] = item.highest_mastered_bpm;
        return acc;
      }, {} as Record<string, number>);
      setScaleMasteryBPMMap(bpmMap);
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
      console.log(`[ScalesContext] Fetched ${logData.length} log entries`);
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
      setScaleMasteryBPMMap({});
      setLog([]);
      setIsDataLoading(false);
    }
  }, [userId, isSessionLoading, fetchData]);


  // 1.5 Calculate Next Focus
  const nextFocus: NextFocus = useMemo(() => {
    if (isSessionLoading || isDataLoading) return null;
    
    const nextGrade = PRACTICE_GRADES.find(grade => {
        const requirements = getGradeRequirements(grade.id);
        
        return requirements.some(req => {
            if (req.type === 'scale') {
                const highestBPM = scaleMasteryBPMMap[req.scalePermutationId] || 0;
                return highestBPM < req.requiredBPM;
            } else {
                return progressMap[req.practiceId] !== 'mastered';
            }
        });
    });

    if (!nextGrade) {
        return null; // All grades mastered
    }
    
    const requirements = getGradeRequirements(nextGrade.id);
    
    // Find the first unmastered requirement
    const nextRequirement = requirements.find(req => {
        if (req.type === 'scale') {
            const highestBPM = scaleMasteryBPMMap[req.scalePermutationId] || 0;
            return highestBPM < req.requiredBPM;
        } else {
            return progressMap[req.practiceId] !== 'mastered';
        }
    });
    
    if (!nextRequirement) return null;

    if (nextRequirement.type === 'scale') {
        const highestBPM = scaleMasteryBPMMap[nextRequirement.scalePermutationId] || 0;
        const nextBPMGoal = highestBPM > 0 ? highestBPM + 3 : 40;
        
        // Parse scale details from permutation ID
        const scaleIdPart = nextRequirement.scalePermutationId.split('-').slice(0, 2).join('-');
        const scaleItem = ALL_SCALE_ITEMS.find(s => s.id === scaleIdPart);
        
        if (scaleItem) {
            return {
                type: 'scale',
                scaleItem,
                scalePermutationId: nextRequirement.scalePermutationId,
                requiredBPM: nextRequirement.requiredBPM,
                currentHighestBPM: highestBPM,
                nextBPMGoal,
                grade: nextGrade.id,
                description: nextRequirement.description,
            };
        }
    } else if (nextRequirement.type === 'dohnanyi') {
        const dohItem = ALL_DOHNANYI_COMBINATIONS.find(c => c.id === nextRequirement.practiceId);
        if (dohItem) {
            return {
                type: 'dohnanyi',
                name: dohItem.name,
                bpmTarget: dohItem.bpm,
                grade: nextGrade.id,
                description: nextRequirement.description,
            };
        }
    } else if (nextRequirement.type === 'hanon') {
        const hanonItem = ALL_HANON_COMBINATIONS.find(c => c.id === nextRequirement.practiceId);
        if (hanonItem) {
            return {
                type: 'hanon',
                name: hanonItem.name,
                bpmTarget: hanonItem.bpm,
                grade: nextGrade.id,
                description: nextRequirement.description,
            };
        }
    }
    
    return null;
  }, [progressMap, scaleMasteryBPMMap, isSessionLoading, isDataLoading]);


  // 2. Update Practice Status (Upsert to Supabase - used for Dohnanyi/Hanon/Grade categories)
  const updatePracticeStatus = useCallback(async (practiceId: string, status: ScaleStatus) => {
    if (!userId) {
      showError("You must be logged in to save progress.");
      return;
    }

    console.log(`[ScalesContext] updatePracticeStatus called: ${practiceId} -> ${status}`);

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
  
  // 3. Update Scale Mastery BPM (Upsert to Supabase - used for granular scale tracking)
  const updateScaleMasteryBPM = useCallback(async (scalePermutationId: string, newBPM: number) => {
    if (!userId) {
      showError("You must be logged in to save scale BPM progress.");
      return;
    }

    console.log(`[ScalesContext] updateScaleMasteryBPM called: ${scalePermutationId} -> ${newBPM} BPM`);

    // 1. Upsert the highest BPM
    const { error } = await supabase
        .from('scale_permutations_mastery')
        .upsert({
            user_id: userId,
            scale_permutation_id: scalePermutationId,
            highest_mastered_bpm: newBPM,
            last_practiced_at: new Date().toISOString(),
        }, { onConflict: 'user_id, scale_permutation_id' });

    if (error) {
        console.error("[ScalesContext] Error upserting scale BPM mastery:", error);
        showError("Failed to save scale BPM progress.");
        return;
    }

    // 2. Update local state
    console.log(`[ScalesContext] Updating local state for ${scalePermutationId} to ${newBPM}`);
    setScaleMasteryBPMMap(prev => ({
        ...prev,
        [scalePermutationId]: newBPM,
    }));
    
  }, [userId]);


  // 4. Add Log Entry (Insert to Supabase)
  const addLogEntry = useCallback(async (entry: Omit<PracticeLogEntry, 'id' | 'timestamp'>) => {
    if (!userId) {
      showError("You must be logged in to log practice sessions.");
      return;
    }

    console.log(`[ScalesContext] addLogEntry called with:`, entry);

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

    console.log(`[ScalesContext] Log entry inserted successfully. ID: ${data.id}`);
    setLog(prev => [finalEntry, ...prev]);
  }, [userId]);


  const contextValue = useMemo(() => ({
    progressMap,
    scaleMasteryBPMMap,
    log,
    isLoading,
    nextFocus,
    updatePracticeStatus,
    updateScaleMasteryBPM,
    addLogEntry,
    allScales: ALL_SCALE_ITEMS,
    allDohnanyi: ALL_DOHNANYI_ITEMS,
    allDohnanyiCombinations: ALL_DOHNANYI_COMBINATIONS,
    allHanon: ALL_HANON_ITEMS,
    allHanonCombinations: ALL_HANON_COMBINATIONS,
  }), [progressMap, scaleMasteryBPMMap, log, isLoading, nextFocus, updatePracticeStatus, updateScaleMasteryBPM, addLogEntry]);

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