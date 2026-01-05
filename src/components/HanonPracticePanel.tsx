import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, Check } from 'lucide-react';
import { 
  HANON_EXERCISES, HanonExercise, HANON_BPM_TARGETS, HanonBPMTarget, getHanonPracticeId, getHanonExerciseBaseId
} from '@/lib/scales';
import { useScales, NextFocus, ScaleStatus } from '../context/ScalesContext';
import { showSuccess, showError } from '@/utils/toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn, shallowEqual } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGlobalBPM, SNAPSHOT_DEBOUNCE_MS, ActivePracticeItem } from '@/context/GlobalBPMContext';

interface HanonPracticePanelProps {
    currentBPM: number;
    addLogEntry: ReturnType<typeof useScales>['addLogEntry'];
    updatePracticeStatus: (practiceId: string, status: ScaleStatus) => void; // Re-added
    progressMap: ReturnType<typeof useScales>['progressMap']; // Re-added
    activeTab: 'scales' | 'dohnanyi' | 'hanon';
    suggestedHanon: (NextFocus & { type: 'hanon' }) | undefined;
}

const HanonPracticePanel: React.FC<HanonPracticePanelProps> = ({ 
  currentBPM, addLogEntry, updatePracticeStatus, progressMap, 
  activeTab, suggestedHanon
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
          nextTargetBPM: nextBPMGoal,
          isMastered: highestMasteredBPM >= HANON_BPM_TARGETS[HANON_BPM_TARGETS.length - 1], // Check against max target
      };
      if (!shallowEqual(globalActivePracticeItem, newActivePracticeItem)) {
        setActivePracticeItem(newActivePracticeItem);
      }
  }, [selectedExercise, nextBPMGoal, highestMasteredBPM, setActivePracticeItem, globalActivePracticeItem]);


  const handleToggleMastery = (targetBPM: HanonBPMTarget) => {
    const practiceId = getHanonPracticeId(selectedExercise, targetBPM); // This ID includes BPM
    const currentStatus = progressMap[practiceId] || 'untouched';
    
    const nextStatus = currentStatus === 'mastered' ? 'untouched' : 'mastered';
    
    console.log("[HanonPracticePanel] Toggling mastery:", { selectedExercise, targetBPM, currentStatus, nextStatus, practiceId });
    updatePracticeStatus(practiceId, nextStatus);
    showSuccess(`${selectedExercise} at ${targetBPM} BPM marked as ${nextStatus}.`);
  };

  return (
    <CardContent className="p-0 space-y-6">
        <div className="space-y-3 border p-4 rounded-lg border-primary/30 bg-secondary/50">
            <Label className="text-lg font-semibold text-primary block mb-2 font-mono">HANON EXERCISES (1-60)</Label>
            <p className="text-xs text-muted-foreground italic mb-4">
                Select the exercise you are currently practicing. Your highest mastered BPM will be tracked.
            </p>
            <ScrollArea className="h-[200px] w-full pr-4">
                <ToggleGroup 
                    type="single" 
                    value={selectedExercise} 
                    onValueChange={(value) => value && setSelectedExercise(value as HanonExercise)}
                    className="flex flex-wrap justify-start gap-2 w-full"
                >
                    {HANON_EXERCISES.map(exercise => (
                        <ToggleGroupItem 
                            key={exercise} 
                            value={exercise} 
                            aria-label={`Select exercise ${exercise}`}
                            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md data-[state=on]:border-primary/80 border border-border text-xs px-2 py-1 h-auto font-mono min-w-[80px]"
                        >
                            {exercise.replace('Exercise ', 'Ex. ')}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            </ScrollArea>
        </div>

        <div className="space-y-4 p-4 rounded-lg border border-primary/30 bg-secondary/50">
            <Label className="text-lg font-semibold text-primary block mb-2 font-mono">MASTERY PROGRESS</Label>
            <div className="flex flex-col items-center justify-center space-y-2">
                <p className="text-sm text-muted-foreground font-mono">
                    Highest Mastered BPM: <span className="font-bold text-primary">{highestMasteredBPM}</span>
                </p>
                <p className="text-sm text-yellow-400 font-mono">
                    Next Goal: <span className="font-bold">{nextBPMGoal} BPM</span>
                </p>
                {highestMasteredBPM >= HANON_BPM_TARGETS[HANON_BPM_TARGETS.length - 1] && (
                    <div className="flex items-center text-green-400 font-mono text-sm mt-2">
                        <Check className="w-4 h-4 mr-1" /> FULLY MASTERED!
                    </div>
                )}
            </div>
        </div>
    </CardContent>
  );
};

export default HanonPracticePanel;