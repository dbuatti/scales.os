import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, Check } from 'lucide-react';
import { 
  HANON_EXERCISES, HanonExercise, HANON_BPM_TARGETS, HanonBPMTarget, getHanonPracticeId
} from '@/lib/scales';
import { useScales, NextFocus } from '../context/ScalesContext';
import { showSuccess, showError } from '@/utils/toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn, shallowEqual } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGlobalBPM, SNAPSHOT_DEBOUNCE_MS, ActivePracticeItem } from '@/context/GlobalBPMContext';

interface HanonPracticePanelProps {
    currentBPM: number;
    addLogEntry: ReturnType<typeof useScales>['addLogEntry'];
    updatePracticeStatus: ReturnType<typeof useScales>['updatePracticeStatus'];
    progressMap: ReturnType<typeof useScales>['progressMap'];
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
    setActivePermutationHighestBPM(0);
  }, [setActivePermutationHighestBPM]);
  
  const nextBPMTarget = useMemo(() => {
    for (const target of HANON_BPM_TARGETS) {
      const practiceId = getHanonPracticeId(selectedExercise, target);
      if (progressMap[practiceId] !== 'mastered') {
        return target;
      }
    }
    return HANON_BPM_TARGETS[HANON_BPM_TARGETS.length - 1];
  }, [selectedExercise, progressMap]);
  
  const isFullyMastered = useMemo(() => {
      const maxTargetId = getHanonPracticeId(selectedExercise, HANON_BPM_TARGETS[HANON_BPM_TARGETS.length - 1]);
      return progressMap[maxTargetId] === 'mastered';
  }, [selectedExercise, progressMap]);

  const handleLogSnapshot = useCallback(() => {
    const now = Date.now();
    if (now - lastSnapshotTimestampRef.current < SNAPSHOT_DEBOUNCE_MS) {
      console.log("[HanonPracticePanel] Snapshot debounced.");
      return;
    }

    const currentCallKey = `${selectedExercise}-${currentBPM}`;
    if (lastSuccessfulCallKeyRef.current === currentCallKey) {
        console.log("[HanonPracticePanel] Duplicate snapshot call prevented.");
        return;
    }

    lastSnapshotTimestampRef.current = now;
    lastSuccessfulCallKeyRef.current = currentCallKey;

    const itemToLog = {
        type: 'hanon' as const, // Explicitly type as 'hanon'
        hanonName: selectedExercise,
        hanonBpmTarget: currentBPM,
    };
    console.log("[HanonPracticePanel] Logging Hanon snapshot:", { selectedExercise, currentBPM, itemToLog });

    addLogEntry({
      durationMinutes: 0, 
      itemsPracticed: [itemToLog],
      notes: `Hanon Snapshot: ${selectedExercise} practiced at ${currentBPM} BPM.`,
    });

    showSuccess(`Hanon practice session logged at ${currentBPM} BPM.`);
  }, [addLogEntry, selectedExercise, currentBPM]);

  const latestHandleLogSnapshotRef = useRef(handleLogSnapshot);
  useEffect(() => {
    latestHandleLogSnapshotRef.current = handleLogSnapshot;
  }, [handleLogSnapshot]);

  useEffect(() => {
      const newActivePracticeItem: ActivePracticeItem = {
          type: 'hanon',
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


  const handleToggleMastery = (targetBPM: HanonBPMTarget) => {
    const practiceId = getHanonPracticeId(selectedExercise, targetBPM);
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
                Select the exercise you are currently practicing. Mastery is tracked by BPM targets.
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
            <Label className="text-lg font-semibold text-primary block mb-2 font-mono">MASTERY TARGETS (Click to Toggle Mastery)</Label>
            <div className="flex flex-wrap gap-3 justify-center">
                {HANON_BPM_TARGETS.map(targetBPM => {
                    const practiceId = getHanonPracticeId(selectedExercise, targetBPM);
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

export default HanonPracticePanel;