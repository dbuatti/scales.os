import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { 
  ALL_SCALE_ITEMS, ScaleItem, ARTICULATIONS, TEMPO_LEVELS, Articulation, TempoLevel, 
  DIRECTION_TYPES, HAND_CONFIGURATIONS, RHYTHMIC_PERMUTATIONS, ACCENT_DISTRIBUTIONS, OCTAVE_CONFIGURATIONS,
  DirectionType, HandConfiguration, RhythmicPermutation, AccentDistribution, OctaveConfiguration,
  DohnanyiExercise, DohnanyiItem, ALL_DOHNANYI_ITEMS, DOHNANYI_BPM_TARGETS, getDohnanyiPracticeId, ALL_DOHNANYI_COMBINATIONS,
  HanonExercise, HanonItem, ALL_HANON_ITEMS, ALL_HANON_COMBINATIONS, getHanonPracticeId, getScalePermutationId,
  PRACTICE_GRADES, getGradeRequirements, GradeRequirement, parseScalePermutationId, getDohnanyiExerciseBaseId, getHanonExerciseBaseId,
  KEYS
} from '@/lib/scales';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

// --- Types ---

export type ScaleStatus = 'untouched' | 'practiced' | 'mastered' | 'stasis';

export interface StoredProgressEntry {
  practice_id: string;
  status: 'practiced' | 'mastered' | 'stasis';
}

export interface ScaleMasteryEntry {
  scale_permutation_id: string;
  highest_mastered_bpm: number;
}

export interface ExerciseMasteryEntry {
  exercise_id: string;
  highest_mastered_bpm: number;
}

export interface PracticeLogItem {
  type: 'scale' | 'dohnanyi' | 'hanon';
  scaleId?: string;
  articulation?: Articulation;
  tempo?: TempoLevel;
  direction?: DirectionType;
  handConfig?: HandConfiguration | 'Hands separately';
  rhythm?: RhythmicPermutation;
  accent?: AccentDistribution;
  octaves?: OctaveConfiguration;
  practicedBPM?: number; 
  scalePermutationId?: string;
  dohnanyiName?: DohnanyiExercise;
  bpmTarget?: number;
  hanonName?: HanonExercise;
  hanonBpmTarget?: number;
}

export interface PracticeLogEntry {
  id: string;
  timestamp: number;
  itemsPracticed: PracticeLogItem[];
  notes: string;
  durationMinutes: number;
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
      exerciseId: string;
      requiredBPM: number;
      currentHighestBPM: number;
      nextBPMGoal: number;
      grade: number;
      description: string;
    }
  | {
      type: 'hanon';
      name: HanonExercise;
      exerciseId: string;
      requiredBPM: number;
      currentHighestBPM: number;
      nextBPMGoal: number;
      grade: number;
      description: string;
    }
  | null;


interface ScalesContextType {
  progressMap: Record<string, ScaleStatus>;
  scaleMasteryBPMMap: Record<string, number>;
  exerciseMasteryBPMMap: Record<string, number>;
  log: PracticeLogEntry[];
  isLoading: boolean;
  nextFocus: NextFocus;
  updatePracticeStatus: (practiceId: string, status: ScaleStatus) => void;
  updateScaleMasteryBPM: (scalePermutationId: string, newBPM: number) => void;
  updateExerciseMasteryBPM: (exerciseId: string, newBPM: number) => void;
  addLogEntry: (entry: Omit<PracticeLogEntry, 'id' | 'timestamp'>) => void;
  allScales: ScaleItem[];
  allDohnanyi: DohnanyiItem[];
  allDohnanyiCombinations: typeof ALL_DOHNANYI_COMBINATIONS;
  allHanon: HanonItem[];
  allHanonCombinations: typeof ALL_HANON_COMBINATIONS;
  refetchData: () => Promise<void>;
  clearExerciseMastery: () => Promise<void>;
  clearScaleMastery: () => Promise<void>;
  clearAllLogs: () => Promise<void>;
}

const ScalesContext = createContext<ScalesContextType | undefined>(undefined);

const progressArrayToMap = (arr: StoredProgressEntry[]): Record<string, ScaleStatus> => {
  return arr.reduce((acc, item) => {
    acc[item.practice_id] = item.status;
    return acc;
  }, {} as Record<string, ScaleStatus>);
};

const cleanString = (s: string) => s.replace(/[\s\/\(\)]/g, "");

export const ScalesProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { userId, isLoading: isSessionLoading } = useSupabaseSession();
  const [progressMap, setProgressMap] = useState<Record<string, ScaleStatus>>({});
  const [scaleMasteryBPMMap, setScaleMasteryBPMMap] = useState<Record<string, number>>({});
  const [exerciseMasteryBPMMap, setExerciseMasteryBPMMap] = useState<Record<string, number>>({});
  const [log, setLog] = useState<PracticeLogEntry[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const isLoading = isSessionLoading || isDataLoading;

  const fetchData = useCallback(async (id: string) => {
    setIsDataLoading(true);
    
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('practice_id, status')
      .eq('user_id', id);

    if (progressError) {
      showError("Failed to load practice progress.");
    } else if (progressData) {
      setProgressMap(progressArrayToMap(progressData as StoredProgressEntry[]));
    }
    
    const { data: scaleMasteryData, error: scaleMasteryError } = await supabase
      .from('scale_permutations_mastery')
      .select('scale_permutation_id, highest_mastered_bpm')
      .eq('user_id', id);

    if (scaleMasteryError) {
      showError("Failed to load scale BPM progress.");
    } else if (scaleMasteryData) {
      const bpmMap = scaleMasteryData.reduce((acc, item) => {
        acc[item.scale_permutation_id] = item.highest_mastered_bpm;
        return acc;
      }, {} as Record<string, number>);
      setScaleMasteryBPMMap(bpmMap);
    }

    const { data: exerciseMasteryData, error: exerciseMasteryError } = await supabase
      .from('exercise_mastery')
      .select('exercise_id, highest_mastered_bpm')
      .eq('user_id', id);

    if (exerciseMasteryError) {
      showError("Failed to load exercise BPM progress.");
    } else if (exerciseMasteryData) {
      const bpmMap = exerciseMasteryData.reduce((acc, item) => {
        acc[item.exercise_id] = item.highest_mastered_bpm;
        return acc;
      }, {} as Record<string, number>);
      setExerciseMasteryBPMMap(bpmMap);
    }

    const { data: logData, error: logError } = await supabase
      .from('practice_logs')
      .select('id, duration_minutes, scales_practiced, notes, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (logError) {
      showError("Failed to load practice logs.");
    } else if (logData) {
      const formattedLog: PracticeLogEntry[] = logData.map(item => ({
        id: item.id,
        timestamp: new Date(item.created_at).getTime(),
        durationMinutes: item.duration_minutes,
        itemsPracticed: item.scales_practiced || [],
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
      setProgressMap({});
      setScaleMasteryBPMMap({});
      setExerciseMasteryBPMMap({});
      setLog([]);
      setIsDataLoading(false);
    }
  }, [userId, isSessionLoading, fetchData]);

  const refetchData = useCallback(async () => {
    if (userId) {
      showSuccess("Refreshing practice data...");
      await fetchData(userId);
      showSuccess("Practice data refreshed!");
    } else {
      showError("Cannot refresh data: User not logged in.");
    }
  }, [userId, fetchData]);

  const clearExerciseMastery = useCallback(async () => {
    if (!userId) return;
    await supabase.from('exercise_mastery').delete().eq('user_id', userId).like('exercise_id', 'Dohnanyi-%');
    await supabase.from('exercise_mastery').delete().eq('user_id', userId).like('exercise_id', 'Hanon-%');
    showSuccess("Exercise mastery cleared.");
    await refetchData();
  }, [userId, refetchData]);

  const clearScaleMastery = useCallback(async () => {
    if (!userId) return;
    await supabase.from('scale_permutations_mastery').delete().eq('user_id', userId);
    showSuccess("Scale mastery cleared.");
    await refetchData();
  }, [userId, refetchData]);

  const clearAllLogs = useCallback(async () => {
    if (!userId) return;
    await supabase.from('practice_logs').delete().eq('user_id', userId);
    showSuccess("Logs cleared.");
    await refetchData();
  }, [userId, refetchData]);

  const nextFocus: NextFocus = useMemo(() => {
    if (isSessionLoading || isDataLoading) return null;
    
    const nextGrade = PRACTICE_GRADES.find(grade => {
        const requirements = getGradeRequirements(grade.id);
        return requirements.some(req => {
            const id = req.type === 'scale' ? req.scalePermutationId : req.exerciseId;
            if (progressMap[id] === 'stasis') return false;
            if (req.type === 'scale') {
                return (scaleMasteryBPMMap[req.scalePermutationId] || 0) < req.requiredBPM;
            } else {
                return (exerciseMasteryBPMMap[req.exerciseId] || 0) < req.requiredBPM;
            }
        });
    });

    if (!nextGrade) return null;
    
    const requirements = getGradeRequirements(nextGrade.id);
    
    // 1. Balanced Type Rotation (Scales vs Dohnanyi vs Hanon)
    const types = ['scale', 'dohnanyi', 'hanon'] as const;
    const typeStats = types.map(type => {
        const typeReqs = requirements.filter(r => r.type === type);
        if (typeReqs.length === 0) return { type, completion: 100 };
        const mastered = typeReqs.filter(req => {
            const id = req.type === 'scale' ? req.scalePermutationId : req.exerciseId;
            const bpm = req.type === 'scale' ? (scaleMasteryBPMMap[req.scalePermutationId] || 0) : (exerciseMasteryBPMMap[req.exerciseId] || 0);
            return bpm >= req.requiredBPM;
        }).length;
        return { type, completion: (mastered / typeReqs.length) * 100 };
    });

    const prioritizedTypes = typeStats.sort((a, b) => a.completion - b.completion).map(s => s.type);

    for (const type of prioritizedTypes) {
        const candidates = requirements.filter(req => {
            if (req.type !== type) return false;
            const id = req.type === 'scale' ? req.scalePermutationId : req.exerciseId;
            if (progressMap[id] === 'stasis') return false;
            const bpm = req.type === 'scale' ? (scaleMasteryBPMMap[req.scalePermutationId] || 0) : (exerciseMasteryBPMMap[req.exerciseId] || 0);
            return bpm < req.requiredBPM;
        });

        if (candidates.length > 0) {
            // 2. Balanced Key Rotation (for Scales)
            if (type === 'scale') {
                // Group candidates by key
                const keyStats = KEYS.map(key => {
                    const keyCandidates = candidates.filter(c => {
                        const parsed = parseScalePermutationId((c as any).scalePermutationId);
                        return parsed?.scaleId.startsWith(key);
                    });
                    return { key, count: keyCandidates.length, candidates: keyCandidates };
                }).filter(k => k.count > 0);

                // Pick the key with the most remaining work (lowest completion)
                const prioritizedKeys = keyStats.sort((a, b) => b.count - a.count);
                const selectedKeyGroup = prioritizedKeys[0];
                
                // Within the key, pick the one with the highest current BPM (closest to goal) to build momentum
                const selectedRequirement = selectedKeyGroup.candidates.sort((a, b) => {
                    const bpmA = scaleMasteryBPMMap[(a as any).scalePermutationId] || 0;
                    const bpmB = scaleMasteryBPMMap[(b as any).scalePermutationId] || 0;
                    return bpmB - bpmA;
                })[0] as any;

                const highestBPM = scaleMasteryBPMMap[selectedRequirement.scalePermutationId] || 0;
                const parsed = parseScalePermutationId(selectedRequirement.scalePermutationId);
                if (!parsed) continue;
                const scaleItem = ALL_SCALE_ITEMS.find(s => s.id === parsed.scaleId);
                if (scaleItem) return {
                    type: 'scale',
                    scaleItem,
                    scalePermutationId: selectedRequirement.scalePermutationId,
                    requiredBPM: selectedRequirement.requiredBPM,
                    currentHighestBPM: highestBPM,
                    nextBPMGoal: highestBPM > 0 ? highestBPM + 3 : 40,
                    grade: nextGrade.id,
                    description: selectedRequirement.description,
                };
            } else {
                // For Dohnanyi/Hanon, pick the one with the highest current BPM (closest to goal)
                const selectedRequirement = candidates.sort((a, b) => {
                    const bpmA = exerciseMasteryBPMMap[(a as any).exerciseId] || 0;
                    const bpmB = exerciseMasteryBPMMap[(b as any).exerciseId] || 0;
                    return bpmB - bpmA;
                })[0] as any;

                const item = (selectedRequirement.type === 'dohnanyi' ? ALL_DOHNANYI_ITEMS : ALL_HANON_ITEMS).find(c => c.id === selectedRequirement.exerciseId);
                if (item) {
                    const highestBPM = exerciseMasteryBPMMap[selectedRequirement.exerciseId] || 0;
                    return {
                        type: selectedRequirement.type,
                        name: item.name as any,
                        exerciseId: item.id,
                        requiredBPM: selectedRequirement.requiredBPM,
                        currentHighestBPM: highestBPM,
                        nextBPMGoal: highestBPM > 0 ? highestBPM + 3 : 40,
                        grade: nextGrade.id,
                        description: selectedRequirement.description,
                    } as any;
                }
            }
        }
    }
    
    return null;
  }, [scaleMasteryBPMMap, exerciseMasteryBPMMap, progressMap, isSessionLoading, isDataLoading]);

  const updatePracticeStatus = useCallback(async (practiceId: string, status: ScaleStatus) => {
    if (!userId) return;

    if (status === 'untouched') {
      await supabase.from('user_progress').delete().eq('user_id', userId).eq('practice_id', practiceId);
      setProgressMap(prev => {
        const newState = { ...prev };
        delete newState[practiceId];
        return newState;
      });
    } else {
      await supabase.from('user_progress').upsert({ user_id: userId, practice_id: practiceId, status: status }, { onConflict: 'user_id, practice_id' });
      setProgressMap(prev => ({ ...prev, [practiceId]: status }));
    }
  }, [userId]);
  
  const updateScaleMasteryBPM = useCallback(async (scalePermutationId: string, newBPM: number) => {
    if (!userId) return;
    await supabase.from('scale_permutations_mastery').upsert({ user_id: userId, scale_permutation_id: scalePermutationId, highest_mastered_bpm: newBPM, last_practiced_at: new Date().toISOString() }, { onConflict: 'user_id, scale_permutation_id' });
    setScaleMasteryBPMMap(prev => ({ ...prev, [scalePermutationId]: newBPM }));
  }, [userId]);

  const updateExerciseMasteryBPM = useCallback(async (exerciseId: string, newBPM: number) => {
    if (!userId) return;
    await supabase.from('exercise_mastery').upsert({ user_id: userId, exercise_id: exerciseId, highest_mastered_bpm: newBPM, last_practiced_at: new Date().toISOString() }, { onConflict: 'user_id, exercise_id' });
    setExerciseMasteryBPMMap(prev => ({ ...prev, [exerciseId]: newBPM }));
  }, [userId]);

  const addLogEntry = useCallback(async (entry: Omit<PracticeLogEntry, 'id' | 'timestamp'>) => {
    if (!userId) return;
    const { data } = await supabase.from('practice_logs').insert({ user_id: userId, duration_minutes: entry.durationMinutes, scales_practiced: entry.itemsPracticed, notes: entry.notes }).select('id, created_at').single();
    if (data) {
      const finalEntry: PracticeLogEntry = { ...entry, id: data.id, timestamp: new Date(data.created_at).getTime() };
      setLog(prev => [finalEntry, ...prev]);
    }
  }, [userId]);

  const contextValue = useMemo(() => ({
    progressMap, scaleMasteryBPMMap, exerciseMasteryBPMMap, log, isLoading, nextFocus, 
    updatePracticeStatus, updateScaleMasteryBPM, updateExerciseMasteryBPM, addLogEntry, 
    allScales: ALL_SCALE_ITEMS, allDohnanyi: ALL_DOHNANYI_ITEMS, allDohnanyiCombinations: ALL_DOHNANYI_COMBINATIONS,
    allHanon: ALL_HANON_ITEMS, allHanonCombinations: ALL_HANON_COMBINATIONS, refetchData, clearExerciseMastery, clearScaleMastery, clearAllLogs
  }), [progressMap, scaleMasteryBPMMap, exerciseMasteryBPMMap, log, isLoading, nextFocus, updatePracticeStatus, updateScaleMasteryBPM, updateExerciseMasteryBPM, addLogEntry, refetchData, clearExerciseMastery, clearScaleMastery, clearAllLogs]);

  return <ScalesContext.Provider value={contextValue}>{children}</ScalesContext.Provider>;
};

export const useScales = () => {
  const context = useContext(ScalesContext);
  if (context === undefined) throw new Error('useScales must be used within a ScalesProvider');
  return context;
};