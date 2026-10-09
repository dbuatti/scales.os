import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  HANON_EXERCISES, HanonExercise, HANON_BPM_TARGETS, HanonBPMTarget, getHanonPracticeId, getHanonExerciseBaseId
} from '@/lib/scales';
import { useScales, NextFocus, ScaleStatus } from '@/context/ScalesContext';
import { showSuccess } from '@/utils/toast';
import { shallowEqual } from '@/lib/utils';
import { useGlobalBPM, SNAPSHOT_DEBOUNCE_MS, ActivePracticeItem } from '@/context/GlobalBPMContext';
import ExercisePracticePanel from './ExercisePracticePanel';

interface HanonPracticePanelProps {
    currentBPM: number;
    addLogEntry: ReturnType<typeof useScales>['addLogEntry'];
    updatePracticeStatus: (practiceId: string, status: ScaleStatus) => void; // Re-added
    progressMap: ReturnType<typeof useScales>['progressMap']; // Re-added
    activeTab: 'scales' | 'dohnanyi' | 'hanon' | 'repertoire';
    suggestedHanon: (NextFocus & { type: 'hanon' }) | undefined;
    onOpenReader?: () => void;
}

const HanonPracticePanel: React.FC<HanonPracticePanelProps> = ({ 
  currentBPM, addLogEntry, updatePracticeStatus, progressMap, 
  activeTab, suggestedHanon, onOpenReader
}) => {
  
  const { 
    setActivePermutationHighestBPM, 
    setActivePracticeItem, 
    setActiveLogSnapshotFunction,
    activePracticeItem: globalActivePracticeItem
  } = useGlobalBPM();

  const { exerciseMasteryBPMMap, updateExerciseMasteryBPM } = useScales();
  
  const [selectedExercise, setSelectedExercise] = useState<HanonExercise>(HANON_EXERCISES[0]);
  
  const lastSnapshotTimestampRef = useRef<number>(0); 
  const lastSuccessfulCallKeyRef = useRef<string>(''); 

  // Effect to apply the suggested Hanon exercise when it changes and the tab is active
  useEffect(() => {
    if (activeTab === 'hanon' && suggestedHanon) {
        if (selectedExercise !== suggestedHanon.name) {
            setSelectedExercise(suggestedHanon.name);
            lastSuccessfulCallKeyRef.current = ''; // Reset for new snapshot
        }
    }
  }, [suggestedHanon, activeTab, selectedExercise]);

  useEffect(() => {
    setActivePermutationHighestBPM(0); // Reset for Dohnanyi/Hanon
  }, [setActivePermutationHighestBPM]);
  
  // Use the new base ID function for currentExerciseId
  const currentExerciseBaseId = useMemo(() => getHanonExerciseBaseId(selectedExercise), [selectedExercise]);
  const highestMasteredBPM = exerciseMasteryBPMMap[currentExerciseBaseId] || 0;
  const nextBPMGoal = highestMasteredBPM > 0 ? highestMasteredBPM + 3 : 40; // Incremental goal

  const handleLogSnapshot = useCallback(() => {
    const now = Date.now();
    if (now - lastSnapshotTimestampRef.current < SNAPSHOT_DEBOUNCE_MS) {
      console.log("[HanonPracticePanel] Snapshot debounced.");
      return;
    }

    console.log("[HanonPracticePanel] Current BPM at snapshot:", currentBPM);

    const currentCallKey = `${selectedExercise}-${currentBPM}`;
    if (lastSuccessfulCallKeyRef.current === currentCallKey) {
        console.log("[HanonPracticePanel] Duplicate snapshot call prevented.");
        return;
    }

    lastSnapshotTimestampRef.current = now;
    lastSuccessfulCallKeyRef.current = currentCallKey;

    let message = `Snapshot logged at ${currentBPM} BPM.`;

    if (currentBPM > highestMasteredBPM) {
        updateExerciseMasteryBPM(currentExerciseBaseId, currentBPM); // Use base ID here
        message = `Mastery updated! Highest BPM for ${selectedExercise} is now ${currentBPM}. Next goal: ${currentBPM + 3} BPM.`;
    } else {
        message = `Snapshot logged at ${currentBPM} BPM. Highest mastered BPM remains ${highestMasteredBPM}.`;
    }

    const itemToLog = {
        type: 'hanon' as const,
        hanonName: selectedExercise,
        hanonBpmTarget: currentBPM,
    };
    console.log("[HanonPracticePanel] Logging Hanon snapshot:", { selectedExercise, currentBPM, itemToLog });

    addLogEntry({
      durationMinutes: 0, 
      itemsPracticed: [itemToLog],
      notes: `Hanon Snapshot: ${selectedExercise} practiced at ${currentBPM} BPM.`,
    });

    showSuccess(message);
  }, [addLogEntry, selectedExercise, currentBPM, highestMasteredBPM, updateExerciseMasteryBPM, currentExerciseBaseId]);

  // Fix stale closure: Ensure setActiveLogSnapshotFunction is called with the latest handleLogSnapshot
  useEffect(() => {
    setActiveLogSnapshotFunction(() => handleLogSnapshot);
    
    return () => {
        setActiveLogSnapshotFunction(null);
    };
  }, [setActiveLogSnapshotFunction, handleLogSnapshot]);


  useEffect(() => {
      const newActivePracticeItem: ActivePracticeItem = {
          type: 'hanon',
          name: selectedExercise,
          exerciseId: currentExerciseBaseId, // Pass exerciseId
          nextTargetBPM: nextBPMGoal,
          currentHighestBPM: highestMasteredBPM, // Pass currentHighestBPM
          isMastered: highestMasteredBPM >= HANON_BPM_TARGETS[HANON_BPM_TARGETS.length - 1], // Check against max target
      };
      if (!shallowEqual(globalActivePracticeItem, newActivePracticeItem)) {
        setActivePracticeItem(newActivePracticeItem);
      }
  }, [selectedExercise, nextBPMGoal, highestMasteredBPM, setActivePracticeItem, globalActivePracticeItem, currentExerciseBaseId]);


  const handleToggleMastery = (targetBPM: HanonBPMTarget) => {
    const practiceId = getHanonPracticeId(selectedExercise, targetBPM); // This ID includes BPM
    const currentStatus = progressMap[practiceId] || 'untouched';
    
    const nextStatus = currentStatus === 'mastered' ? 'untouched' : 'mastered';
    
    console.log("[HanonPracticePanel] Toggling mastery:", { selectedExercise, targetBPM, currentStatus, nextStatus, practiceId });
    updatePracticeStatus(practiceId, nextStatus);
    showSuccess(`${selectedExercise} at ${targetBPM} BPM marked as ${nextStatus}.`);
  };

  return (
    <ExercisePracticePanel
        title="Hanon Exercises (1–60)"
        description="Select the exercise you are currently practicing. Your highest mastered BPM will be tracked."
        exercises={HANON_EXERCISES}
        selectedExercise={selectedExercise}
        onSelect={(value) => setSelectedExercise(value as HanonExercise)}
        highestMasteredBPM={highestMasteredBPM}
        nextGoalBPM={nextBPMGoal}
        maxTargetBPM={HANON_BPM_TARGETS[HANON_BPM_TARGETS.length - 1]}
        formatExercise={(exercise) => exercise.replace('Exercise ', 'Ex. ')}
        scrollable
        exerciseId={currentExerciseBaseId}
        onOpenReader={onOpenReader}
    />
  );
};

export default HanonPracticePanel;