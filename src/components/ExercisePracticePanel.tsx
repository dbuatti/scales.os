import React from 'react';
import { CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Check, ListMusic, Target, FileText, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRepertoire } from '@/context/RepertoireContext';
import { showSuccess } from '@/utils/toast';

interface ExercisePracticePanelProps {
  title: string;
  description: string;
  exercises: readonly string[];
  selectedExercise: string;
  onSelect: (exercise: string) => void;
  highestMasteredBPM: number;
  nextGoalBPM: number;
  maxTargetBPM: number;
  formatExercise?: (exercise: string) => string;
  scrollable?: boolean;
  exerciseId?: string;
  onOpenReader?: () => void;
}

export const ExercisePracticePanel: React.FC<ExercisePracticePanelProps> = ({
  title,
  description,
  exercises,
  selectedExercise,
  onSelect,
  highestMasteredBPM,
  nextGoalBPM,
  maxTargetBPM,
  formatExercise,
  scrollable = false,
  exerciseId,
  onOpenReader,
}) => {
  const { hasMappingForExercise, openExercise } = useRepertoire();
  const isFullyMastered = highestMasteredBPM >= maxTargetBPM;
  const progressValue = Math.min(100, Math.round((highestMasteredBPM / maxTargetBPM) * 100));
  const hasPdf = exerciseId ? hasMappingForExercise(exerciseId) : false;

  const handleOpenReader = () => {
    if (exerciseId && openExercise(exerciseId)) {
      showSuccess('Opening mapped page in Reader');
    }
    onOpenReader?.();
  };

  const exerciseButtons = (
    <ToggleGroup
      type="single"
      value={selectedExercise}
      onValueChange={(value) => value && onSelect(value)}
      className={cn('flex flex-wrap gap-2', !scrollable && 'justify-start')}
    >
      {exercises.map((exercise) => (
        <ToggleGroupItem
          key={exercise}
          value={exercise}
          aria-label={`Select ${exercise}`}
          className="h-9 rounded-lg border px-3 text-xs font-medium data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground focus-scale"
        >
          {formatExercise ? formatExercise(exercise) : exercise}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );

  return (
    <CardContent className="space-y-6 p-0">
      <div className="space-y-4 rounded-xl border bg-card/50 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <ListMusic className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <Label className="text-sm font-bold uppercase tracking-wider text-foreground">{title}</Label>
            <p className="text-[10px] leading-tight text-muted-foreground">{description}</p>
          </div>
        </div>
        {scrollable ? (
          <ScrollArea className="h-[200px] w-full pr-3">{exerciseButtons}</ScrollArea>
        ) : (
          exerciseButtons
        )}
      </div>

      <div className="space-y-5 rounded-xl border bg-card/50 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Target className="h-5 w-5" />
          </div>
          <Label className="text-sm font-bold uppercase tracking-wider text-foreground">Mastery Progress</Label>
        </div>

        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Highest mastered</p>
            <p className="text-3xl font-black tracking-tighter text-primary">
              {highestMasteredBPM || '—'} <span className="text-sm font-bold text-muted-foreground">BPM</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Next goal</p>
            <p className="text-lg font-bold text-primary">{nextGoalBPM} BPM</p>
          </div>
        </div>

        <Progress value={progressValue} className="h-2" />

        {isFullyMastered && (
          <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm font-bold text-success">
            <Check className="h-4 w-4" />
            Fully mastered at {maxTargetBPM} BPM
          </div>
        )}

        {onOpenReader && exerciseId && (
          <Button
            type="button"
            variant={hasPdf ? 'default' : 'outline'}
            className="h-11 w-full gap-2 rounded-lg font-bold"
            onClick={handleOpenReader}
          >
            {hasPdf ? (
              <>
                <FileText className="h-4 w-4" />
                Open in Reader
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4" />
                Map this exercise in Reader
              </>
            )}
          </Button>
        )}
      </div>
    </CardContent>
  );
};

export default ExercisePracticePanel;
