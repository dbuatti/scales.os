import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, Check } from 'lucide-react';
import { 
  DOHNANYI_EXERCISES, DohnanyiExercise, DOHNANYI_BPM_TARGETS, DohnanyiBPMTarget, getDohnanyiPracticeId
} from '@/lib/scales';
import { useScales, NextFocus } from '../context/ScalesContext';
import { showSuccess, showError } from '@/utils/toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn, shallowEqual } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useGlobalBPM, SNAPSHOT_DEBOUNCE_MS, ActivePracticeItem } from '@/context/GlobalBPMContext';

interface DohnanyiPracticePanelProps {
    currentBPM: number;
    addLogEntry: ReturnType<typeof useScales>['addLogEntry'];
    updatePracticeStatus: ReturnType<typeof useScales>['updatePracticeStatus'];
    progressMap: ReturnType<typeof useScales>['progressMap'];
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
    setActivePermutationHighestBPM(0);
  }, [setActivePermutationHighestBPM]);
  
  const nextBPMTarget = useMemo(() => {
    for (const target of DOHNANYI_BPM_TARGETS) {
      const practiceId = getDohnanyiPracticeId(selectedExercise, target);
      if (progressMap[practiceId] !== 'mastered') {
        return target;
      }
    }
    return DOHNANYI_BPM_TARGETS[DOHNANYI_BPM_TARGETS.length - 1];
  }, [selectedExercise, progressMap]);
  
  const isFullyMastered = useMemo(() => {
      const maxTargetId = getDohnanyiPracticeId(selectedExercise, DOHNANYI_BPM_TARGETS[DOHNANYI_BPM_TARGETS.length - 1]);
      return progressMap[maxTargetId] === 'mastered';
  }, [selectedExercise, progressMap]);

  const handleLogSnapshot = useCallback(() => {
    const now = Date.now();
    if (now - lastSnapshotTimestampRef.current < SNAPSHOT_DEBOUNCE_MS) {
      console.log("[DohnanyiPracticePanel] Snapshot debounced.");
      return;
    }

    console.log("[DohnanyiPracticePanel] Current BPM at snapshot:", currentBPM); // Added log

    const currentCallKey = `${selectedExercise}-${currentBPM}`;
    if (lastSuccessfulCallKeyRef.current === currentCallKey) {
        console.log("[DohnanyiPracticePanel] Duplicate snapshot call prevented.");
        return;
    }

    lastSnapshotTimestampRef.current = now;
    lastSuccessfulCallKeyRef.current = currentCallKey;

    const itemToLog = {
        type: 'dohnanyi' as const, // Explicitly type as 'dohnanyi'
        dohnanyiName: selectedExercise,
        bpmTarget: currentBPM,
    };
    console.log("[DohnanyiPracticePanel] Logging Dohnányi snapshot:", { selectedExercise, currentBPM, itemToLog });

    addLogEntry({
      durationMinutes: 0, 
      itemsPracticed: [itemToLog],
      notes: `Dohnányi Snapshot: ${selectedExercise} practiced at ${currentBPM} BPM.`,
    });

    showSuccess(`Dohnányi practice session logged at ${currentBPM} BPM.`);
  }, [addLogEntry, selectedExercise, currentBPM]);

  const latestHandleLogSnapshotRef = useRef(handleLogSnapshot);
  useEffect(() => {
    latestHandleLogSnapshotRef.current = handleLogSnapshot;
  }, [handleLogSnapshot]);

  useEffect(() => {
      const newActivePracticeItem: ActivePracticeItem = {
          type: 'dohnanyi',
          name: selectedExercise,
          nextTargetBPM: nextBPMTarget,
          isMastered: isFullyMastered,
      };
      if (!shallowEqual(globalActivePracticeItem, newActivePracticeItem)) {
        setActivePracticeItem(newActivePracticeItem);
      }
  }, [selectedExercise, nextBPMTarget, isFullyMastered, setActivePracticeItem, globalActivePracticeItem]);

  useEffect(() => {
    setActiveLogSnapshotFunction(() => latestHandleLogSnapshotRef.current);
    
    return () => {
        setActiveLogSnapshotFunction(null);
    };
  }, [setActiveLogSnapshotFunction]);


  const handleToggleMastery = (targetBPM: DohnanyiBPMTarget) => {
    const practiceId = getDohnanyiPracticeId(selectedExercise, targetBPM);
    const currentStatus = progressMap[practiceId] || 'untouched';
    
    const nextStatus = currentStatus === 'mastered' ? 'untouched' : 'mastered';
    
    console.log("[DohnanyiPracticePanel] Toggling mastery:", { selectedExercise, targetBPM, currentStatus, nextStatus, practiceId });
    updatePracticeStatus(practiceId, nextStatus);
    showSuccess(`${selectedExercise} at ${targetBPM} BPM marked as ${nextStatus}.`);
  };

  return (
    <CardContent className="p-0 space-y-6">
        <div className="space-y-3 border p-4 rounded-lg border-primary/30 bg-secondary/50">
            <Label className="text-lg font-semibold text-primary block mb-2 font-mono">DOHNÁNYI EXERCISES</Label>
            <p className="text-xs text-muted-foreground italic mb-4">
                Select the exercise you are currently practicing. Mastery is tracked by BPM targets.
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
            <Label className="text-lg font-semibold text-primary block mb-2 font-mono">MASTERY TARGETS (Click to Toggle Mastery)</Label>
            <div className="flex flex-wrap gap-3 justify-center">
                {DOHNANYI_BPM_TARGETS.map(targetBPM => {
                    const practiceId = getDohnanyiPracticeId(selectedExercise, targetBPM);
                    const status = progressMap[practiceId] === 'mastered';
                    
                    return (
                        <div 
                            key={targetBPM} 
                            className="flex flex-col items-center cursor-pointer group"
                            onClick={() => handleToggleMastery(targetBPM)}
                        >
                            <div className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold font-mono transition-colors duration-200 border-2",
                                status 
                                    ? "bg-green-600 text-white shadow-lg border-green-400" 
                                    : "bg-card text-primary border-primary/50 group-hover:bg-primary/20"
                            )}>
                                {targetBPM}
                            </div>
                            <p className="text-xs mt-1 text-muted-foreground">BPM</p>
                            {status && <Check className="w-4 h-4 text-green-400 mt-1" />}
                        </div>
                    );
                })}
            </div>
            <p className="text-sm text-yellow-400 font-mono text-center pt-2 border-t border-border">
                Next Mastery Goal: <span className="font-bold">{nextBPMTarget} BPM</span>
            </p>
        </div>
    </CardContent>
  );
};

export default DohnanyiPracticePanel;