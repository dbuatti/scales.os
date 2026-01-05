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
import { cn, shallowEqual } from '@/lib/utils'; // Import shallowEqual
import { Label } from '@/components/ui/label';
import { useGlobalBPM, SNAPSHOT_DEBOUNCE_MS, ActivePracticeItem } from '@/context/GlobalBPMContext';

interface DohnanyiPracticePanelProps {
    currentBPM: number;
    addLogEntry: ReturnType<typeof useScales>['addLogEntry'];
    updatePracticeStatus: ReturnType<typeof useScales>['updatePracticeStatus'];
    progressMap: ReturnType<typeof useScales>['progressMap'];
    initialFocus: (NextFocus & { type: 'dohnanyi' }) | undefined;
    activeTab: 'scales' | 'dohnanyi' | 'hanon'; // Added activeTab prop
}

const DohnanyiPracticePanel: React.FC<DohnanyiPracticePanelProps> = ({ currentBPM, addLogEntry, updatePracticeStatus, progressMap, initialFocus, activeTab }) => {
  
  const { 
    setActivePermutationHighestBPM, 
    setActivePracticeItem, 
    setActiveLogSnapshotFunction,
    activePracticeItem: globalActivePracticeItem // Get current global active item
  } = useGlobalBPM();
  
  // Local state for user's current selection
  const [selectedExercise, setSelectedExercise] = useState<DohnanyiExercise>(DOHNANYI_EXERCISES[0]);
  
  // State for the suggested item from nextFocus
  const [suggestedDohnanyi, setSuggestedDohnanyi] = useState<(NextFocus & { type: 'dohnanyi' }) | null>(null);

  // Effect to update suggestedDohnanyi when initialFocus changes and is relevant to Dohnányi
  useEffect(() => {
    if (activeTab === 'dohnanyi' && initialFocus && initialFocus.type === 'dohnanyi') {
        if (!shallowEqual(suggestedDohnanyi, initialFocus)) {
            setSuggestedDohnanyi(initialFocus);
        }
    } else if (suggestedDohnanyi) {
        setSuggestedDohnanyi(null);
    }
  }, [initialFocus, activeTab, suggestedDohnanyi]);

  const lastSnapshotTimestampRef = useRef<number>(0); 
  const lastSuccessfulCallKeyRef = useRef<string>(''); 

  // Reset BPM visualization when this panel is active
  useEffect(() => {
    setActivePermutationHighestBPM(0);
  }, [setActivePermutationHighestBPM]);
  
  // Determine the next BPM target for the selected exercise
  const nextBPMTarget = useMemo(() => {
    for (const target of DOHNANYI_BPM_TARGETS) {
      const practiceId = getDohnanyiPracticeId(selectedExercise, target);
      if (progressMap[practiceId] !== 'mastered') {
        return target;
      }
    }
    return DOHNANYI_BPM_TARGETS[DOHNANYI_BPM_TARGETS.length - 1]; // Max BPM if mastered
  }, [selectedExercise, progressMap]);
  
  // Determine if the next target is already mastered (meaning all targets are mastered)
  const isFullyMastered = useMemo(() => {
      const maxTargetId = getDohnanyiPracticeId(selectedExercise, DOHNANYI_BPM_TARGETS[DOHNANYI_BPM_TARGETS.length - 1]);
      return progressMap[maxTargetId] === 'mastered';
  }, [selectedExercise, progressMap]);

  // Define the snapshot function using useCallback
  const handleLogSnapshot = useCallback(() => {
    const now = Date.now();
    if (now - lastSnapshotTimestampRef.current < SNAPSHOT_DEBOUNCE_MS) {
      console.log(`[DohnanyiPracticePanel] Snapshot debounced - too soon since last call (${now - lastSnapshotTimestampRef.current}ms since last snapshot).`);
      return;
    }

    const currentCallKey = `${selectedExercise}-${currentBPM}`;
    if (lastSuccessfulCallKeyRef.current === currentCallKey) {
        console.log(`[DohnanyiPracticePanel] Duplicate call detected for ${currentCallKey}, skipping.`);
        return;
    }

    lastSnapshotTimestampRef.current = now;
    lastSuccessfulCallKeyRef.current = currentCallKey;

    // Log the snapshot (durationMinutes: 0 indicates a snapshot log)
    addLogEntry({
      durationMinutes: 0, 
      itemsPracticed: [{
        type: 'dohnanyi',
        dohnanyiName: selectedExercise,
        bpmTarget: currentBPM, // Log the actual BPM practiced
      }],
      notes: `Dohnányi Snapshot: ${selectedExercise} practiced at ${currentBPM} BPM.`,
    });

    showSuccess(`Dohnányi practice session logged at ${currentBPM} BPM.`);
  }, [addLogEntry, selectedExercise, currentBPM]);

  // Use a ref to hold the latest handleLogSnapshot function
  const latestHandleLogSnapshotRef = useRef(handleLogSnapshot);
  useEffect(() => {
    latestHandleLogSnapshotRef.current = handleLogSnapshot;
  }, [handleLogSnapshot]);

  // Effect to update global context for Summary Panel
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

  // Effect to set and cleanup the activeLogSnapshotFunction in global context
  useEffect(() => {
    console.log('[DohnanyiPracticePanel] Setting activeLogSnapshotFunction in GlobalBPMContext.');
    setActiveLogSnapshotFunction(() => latestHandleLogSnapshotRef.current);
    
    return () => {
        console.log('[DohnanyiPracticePanel] Cleaning up activeLogSnapshotFunction in GlobalBPMContext.');
        setActiveLogSnapshotFunction(null);
    };
  }, [setActiveLogSnapshotFunction]);


  const handleToggleMastery = (targetBPM: DohnanyiBPMTarget) => {
    const practiceId = getDohnanyiPracticeId(selectedExercise, targetBPM);
    const currentStatus = progressMap[practiceId] || 'untouched';
    
    // Toggle between 'mastered' and 'untouched'
    const nextStatus = currentStatus === 'mastered' ? 'untouched' : 'mastered';
    
    updatePracticeStatus(practiceId, nextStatus);
    showSuccess(`${selectedExercise} at ${targetBPM} BPM marked as ${nextStatus}.`);
  };

  // Function to apply the suggested Dohnányi exercise
  const applySuggestedDohnanyi = useCallback(() => {
    if (suggestedDohnanyi) {
        setSelectedExercise(suggestedDohnanyi.name);
        lastSuccessfulCallKeyRef.current = ''; // Reset for new snapshot
        showSuccess(`Loaded suggested: ${suggestedDohnanyi.name}`);
    }
  }, [suggestedDohnanyi]);

  return (
    <CardContent className="p-0 space-y-6">
        {/* Suggestion UI */}
        {suggestedDohnanyi && (
            <div className="p-3 border border-dashed border-primary/50 rounded-lg bg-accent/20 flex items-center justify-between">
                <p className="text-sm text-primary font-mono">
                    Next Suggested: <span className="font-bold">{suggestedDohnanyi.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">({suggestedDohnanyi.description})</span>
                </p>
                <Button 
                    onClick={applySuggestedDohnanyi} 
                    variant="secondary" 
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    Load Suggestion
                </Button>
            </div>
        )}

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