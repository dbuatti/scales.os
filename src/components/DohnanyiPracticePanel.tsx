import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  DOHNANYI_EXERCISES, DohnanyiExercise, DOHNANYI_BPM_TARGETS, DohnanyiBPMTarget, getDohnanyiPracticeId, getDohnanyiExerciseBaseId
} from '@/lib/scales';
import { useScales, NextFocus, ScaleStatus } from '@/context/ScalesContext';
import { showSuccess } from '@/utils/toast';
import { shallowEqual } from '@/lib/utils';
import { useGlobalBPM, SNAPSHOT_DEBOUNCE_MS, ActivePracticeItem } from '@/context/GlobalBPMContext';
import ExercisePracticePanel from './ExercisePracticePanel';

interface DohnanyiPracticePanelProps {
    currentBPM: number;
    addLogEntry: ReturnType<typeof useScales>['addLogEntry'];
    updatePracticeStatus: (practiceId: string, status: ScaleStatus) => void; // Re-added
    progressMap: ReturnType<typeof useScales>['progressMap']; // Re-added
    activeTab: 'scales' | 'dohnanyi' | 'hanon' | 'repertoire';
    suggestedDohnanyi: (NextFocus & { type: 'dohnanyi' }) | undefined;
}

const DohnanyiPracticePanel: React.FC<DohnanyiPracticePanelProps> = ({ 
  currentBPM, addLogEntry, updatePracticeStatus, progressMap, 
  activeTab, suggestedDohnanyi
}) => {
  
  const { 
    setActivePermutationHighestBPM, 
    setActivePracticeItem, 
    setActiveLogSnapshotFunction,
    activePracticeItem: globalActivePracticeItem
  } = useGlobalBPM();

  const { exerciseMasteryBPMMap, updateExerciseMasteryBPM } = useScales();
  
  const [selectedExercise, setSelectedExercise] = useState<DohnanyiExercise>(DOHNANYI_EXERCISES[0]);
  
  const lastSnapshotTimestampRef = useRef<number>(0); 
  const lastSuccessfulCallKeyRef = useRef<string>(''); 

  // Effect to apply the suggested Dohnányi exercise when it changes and the tab is active
  useEffect(() => {
    if (activeTab === 'dohnanyi' && suggestedDohnanyi) {
        if (selectedExercise !== suggestedDohnanyi.name) {
            setSelectedExercise(suggestedDohnanyi.name);
            lastSuccessfulCallKeyRef.current = ''; // Reset for new snapshot
        }
    }
  }, [suggestedDohnanyi, activeTab, selectedExercise]);

  useEffect(() => {
    setActivePermutationHighestBPM(0); // Reset for Dohnanyi/Hanon
  }, [setActivePermutationHighestBPM]);
  
  // Use the new base ID function for currentExerciseId
  const currentExerciseBaseId = useMemo(() => getDohnanyiExerciseBaseId(selectedExercise), [selectedExercise]);
  const highestMasteredBPM = exerciseMasteryBPMMap[currentExerciseBaseId] || 0;
  const nextBPMGoal = highestMasteredBPM > 0 ? highestMasteredBPM + 3 : 40; // Incremental goal

  const handleLogSnapshot = useCallback(() => {
    const now = Date.now();
    if (now - lastSnapshotTimestampRef.current < SNAPSHOT_DEBOUNCE_MS) {
      console.log("[DohnanyiPracticePanel] Snapshot debounced.");
      return;
    }

    console.log("[DohnanyiPracticePanel] Current BPM at snapshot:", currentBPM);

    const currentCallKey = `${selectedExercise}-${currentBPM}`;
    if (lastSuccessfulCallKeyRef.current === currentCallKey) {
        console.log("[DohnanyiPracticePanel] Duplicate snapshot call prevented.");
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
        type: 'dohnanyi' as const,
        dohnanyiName: selectedExercise,
        bpmTarget: currentBPM,
    };
    console.log("[DohnanyiPracticePanel] Logging Dohnányi snapshot:", { selectedExercise, currentBPM, itemToLog });

    addLogEntry({
      durationMinutes: 0, 
      itemsPracticed: [itemToLog],
      notes: `Dohnányi Snapshot: ${selectedExercise} practiced at ${currentBPM} BPM.`,
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
          type: 'dohnanyi',
          name: selectedExercise,
          exerciseId: currentExerciseBaseId, // Pass exerciseId
          nextTargetBPM: nextBPMGoal,
          currentHighestBPM: highestMasteredBPM, // Pass currentHighestBPM
          isMastered: highestMasteredBPM >= DOHNANYI_BPM_TARGETS[DOHNANYI_BPM_TARGETS.length - 1], // Check against max target
      };
      if (!shallowEqual(globalActivePracticeItem, newActivePracticeItem)) {
        setActivePracticeItem(newActivePracticeItem);
      }
  }, [selectedExercise, nextBPMGoal, highestMasteredBPM, setActivePracticeItem, globalActivePracticeItem, currentExerciseBaseId]);


  const handleToggleMastery = (targetBPM: DohnanyiBPMTarget) => {
    const practiceId = getDohnanyiPracticeId(selectedExercise, targetBPM); // This ID includes BPM
    const currentStatus = progressMap[practiceId] || 'untouched';
    
    const nextStatus = currentStatus === 'mastered' ? 'untouched' : 'mastered';
    
    console.log("[DohnanyiPracticePanel] Toggling mastery:", { selectedExercise, targetBPM, currentStatus, nextStatus, practiceId });
    updatePracticeStatus(practiceId, nextStatus);
    showSuccess(`${selectedExercise} at ${targetBPM} BPM marked as ${nextStatus}.`);
  };

  return (
    <ExercisePracticePanel
        title="Dohnányi Exercises"
        description="Select the exercise you are currently practicing. Your highest mastered BPM will be tracked."
        exercises={DOHNANYI_EXERCISES}
        selectedExercise={selectedExercise}
        onSelect={(value) => setSelectedExercise(value as DohnanyiExercise)}
        highestMasteredBPM={highestMasteredBPM}
        nextGoalBPM={nextBPMGoal}
        maxTargetBPM={DOHNANYI_BPM_TARGETS[DOHNANYI_BPM_TARGETS.length - 1]}
    />
  );
};

export default DohnanyiPracticePanel;