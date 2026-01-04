import React, { useState, useMemo } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, Check } from 'lucide-react';
import { 
  DOHNANYI_EXERCISES, DohnanyiExercise, DOHNANYI_BPM_TARGETS, DohnanyiBPMTarget, getDohnanyiPracticeId
} from '@/lib/scales';
import { useScales } from '../context/ScalesContext';
import { showSuccess, showError } from '@/utils/toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface DohnanyiPracticePanelProps {
    currentBPM: number;
    addLogEntry: ReturnType<typeof useScales>['addLogEntry'];
    updatePracticeStatus: ReturnType<typeof useScales>['updatePracticeStatus'];
    progressMap: ReturnType<typeof useScales>['progressMap'];
}

const DohnanyiPracticePanel: React.FC<DohnanyiPracticePanelProps> = ({ currentBPM, addLogEntry, updatePracticeStatus, progressMap }) => {
  
  const [selectedExercise, setSelectedExercise] = useState<DohnanyiExercise>(DOHNANYI_EXERCISES[0]);
  
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

  const handleSaveSnapshot = () => {
    // 1. Check if current BPM meets or exceeds the next target BPM
    if (currentBPM < nextBPMTarget) {
        showError(`To mark completion, practice at or above the next target BPM: ${nextBPMTarget} BPM.`);
        return;
    }
    
    const practiceId = getDohnanyiPracticeId(selectedExercise, nextBPMTarget);

    // 2. Log the snapshot
    addLogEntry({
      durationMinutes: 0, 
      itemsPracticed: [{
        type: 'dohnanyi',
        dohnanyiName: selectedExercise,
        bpmTarget: nextBPMTarget,
      }],
      notes: `Dohnányi Snapshot: ${selectedExercise} completed at ${currentBPM} BPM. Marked mastery for target ${nextBPMTarget} BPM.`,
    });

    // 3. Update the status to 'mastered' for the target BPM step
    updatePracticeStatus(practiceId, 'mastered');

    showSuccess(`${selectedExercise} mastered at ${nextBPMTarget} BPM! Progress saved.`);
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
            <Label className="text-lg font-semibold text-primary block mb-2 font-mono">MASTERY TARGETS</Label>
            <div className="flex flex-wrap gap-3 justify-center">
                {DOHNANYI_BPM_TARGETS.map(targetBPM => {
                    const practiceId = getDohnanyiPracticeId(selectedExercise, targetBPM);
                    const status = progressMap[practiceId] === 'mastered';
                    
                    return (
                        <div key={targetBPM} className="flex flex-col items-center">
                            <div className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold font-mono transition-colors duration-200",
                                status ? "bg-green-600 text-white shadow-lg" : "bg-card text-primary border border-primary/50"
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

        {/* Log Snapshot Button */}
        <Button 
            onClick={handleSaveSnapshot} 
            className="w-full text-xl py-6 bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/50 text-primary-foreground"
            disabled={currentBPM < nextBPMTarget}
        >
            <LogIn className="w-6 h-6 mr-3" /> LOG DOHNÁNYI COMPLETION ({currentBPM} BPM)
        </Button>
        {currentBPM < nextBPMTarget && (
            <p className="text-center text-sm text-destructive font-mono">
                Increase BPM to {nextBPMTarget} to log this mastery step.
            </p>
        )}
    </CardContent>
  );
};

export default DohnanyiPracticePanel;