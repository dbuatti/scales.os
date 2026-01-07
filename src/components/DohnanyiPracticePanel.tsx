import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, Check } from 'lucide-react';
import { 
  DOHNANYI_EXERCISES, DohnanyiExercise, DOHNANYI_BPM_TARGETS, DohnanyiBPMTarget, getDohnanyiPracticeId, getDohnanyiExerciseBaseId
} from '@/lib/scales';
import { useScales, NextFocus, ScaleStatus } from '../context/ScalesContext';
import { showSuccess, showError } from '@/utils/toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn, shallowEqual } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useGlobalBPM, SNAPSHOT_DEBOUNCE_MS, ActivePracticeItem } from '@/context/GlobalBPMContext';

interface DohnanyiPracticePanelProps {
    currentBPM: number;
    addLogEntry: ReturnType<typeof useScales>['addLogEntry'];
    updatePracticeStatus: (practiceId: string, status: ScaleStatus) => void; // Re-added
    progressMap: ReturnType<typeof useScales>['progressMap']; // Re-added
    activeTab: 'scales' | 'dohnanyi' | 'hanon';
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
    <CardContent className="p-0 space-y-6">
        <div className="space-y-3 border p-4 rounded-lg border-primary/30 bg-secondary/50">
            <Label className="text-lg font-semibold text-primary block mb-2 font-mono text-glow">DOHNÁNYI EXERCISES</Label>
            <p className="text-xs text-muted-foreground italic mb-4 text-primary/70">
                Select the exercise you are currently practicing. Your highest mastered BPM will be tracked.
            </p>
            <ToggleGroup 
                type="single" 
                value={selectedExercise} 
                onValueChange={(value) => value && setSelectedExercise(value as DohnanyiExercise)}
                className="flex flex-wrap justify-center gap-2 w-full"
            >
                {DOHNANYI_EXERCISES.map(exercise => (
                    <ToggleGroupItem 
                        key={exercise} 
                        value={exercise} 
                        aria-label={`Select exercise ${exercise}`}
                        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md data-[state=on]:border-primary/80 border border-border text-xs px-2 py-1 h-auto font-mono flex-1 min-w-[80px]"
                    >
                        {exercise}
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>
        </div>

        <div className="space-y-4 p-4 rounded-lg border border-primary/30 bg-secondary/50">
            <Label className="text-lg font-semibold text-primary block mb-2 font-mono text-glow">MASTERY PROGRESS</Label>
            <div className="flex flex-col items-center justify-center space-y-2">
                <p className="text-sm text-muted-foreground font-mono text-primary/70">
                    Highest Mastered BPM: <span className="font-bold text-primary text-glow">{highestMasteredBPM}</span>
                </p>
                <p className="text-sm text-warning font-mono text-glow animate-pulse">
                    Next Goal: <span className="font-bold">{nextBPMGoal} BPM</span>
                </p>
                {highestMasteredBPM >= DOHNANYI_BPM_TARGETS[DOHNANYI_BPM_TARGETS.length - 1] && (
                    <div className="flex items-center text-success font-mono text-sm mt-2 text-glow">
                        <Check className="w-4 h-4 mr-1" /> FULLY MASTERED!
                    </div>
                )}
            </div>
        </div>
    </CardContent>
  );
};

export default DohnanyiPracticePanel;