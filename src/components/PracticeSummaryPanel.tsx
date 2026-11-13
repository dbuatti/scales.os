import React from 'react';
import { useGlobalBPM } from '@/context/GlobalBPMContext';
import { useScales } from '@/context/ScalesContext';
import { Card, CardContent } from '@/components/ui/card';
import { Save, AlertCircle, Music, Hand, Piano, TrendingUp, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { showSuccess } from '@/utils/toast';
import { cn, getHandColorClasses, getCategoryColorClasses } from '@/lib/utils';

const PracticeSummaryPanel: React.FC = () => {
  const { activePracticeItem, currentBPM, activeLogSnapshotFunction, setIsPermutationManuallyAdjusted } = useGlobalBPM();
  const { updatePracticeStatus } = useScales();

  if (!activePracticeItem) {
    return (
      <Card className="rounded-2xl border border-dashed border-border/50 bg-card/50 shadow-sm backdrop-blur-xl">
        <CardContent className="flex flex-col items-center gap-5 p-12 text-center md:p-16">
          <div className="rounded-2xl bg-primary/10 p-4 text-primary">
            <Piano className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <p className="font-display text-2xl tracking-tight">Ready when you are</p>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              Pick a scale, arpeggio, or exercise below to start a session. Your tempo and mastery
              progress will be tracked automatically as you play.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handlePivot = async () => {
    const id = activePracticeItem.type === 'scale' ? activePracticeItem.scalePermutationId : activePracticeItem.exerciseId;
    const saved = await updatePracticeStatus(id, 'stasis');
    if (!saved) return;
    setIsPermutationManuallyAdjusted(false);
    showSuccess("Moved to stasis. Pivoting to your next focus.");
  };

  const masteryPercentage = (() => {
    if (activePracticeItem.type === 'scale') {
      const { highestBPM, nextGoalBPM } = activePracticeItem;
      if (nextGoalBPM === highestBPM) return currentBPM >= nextGoalBPM ? 100 : 0;
      return Math.min(100, Math.max(0, ((currentBPM - highestBPM) / (nextGoalBPM - highestBPM)) * 100));
    } else {
      const { currentHighestBPM, nextTargetBPM } = activePracticeItem;
      if (nextTargetBPM === currentHighestBPM) return currentBPM >= nextTargetBPM ? 100 : 0;
      return Math.min(100, Math.max(0, ((currentBPM - currentHighestBPM) / (nextTargetBPM - currentHighestBPM)) * 100));
    }
  })();

  // Helper to extract octave number
  const getOctaveNumber = (octaves: string) => {
    const match = octaves.match(/\d+/);
    return match ? match[0] : octaves;
  };

  // Helper to simplify hand label
  const getHandLabel = (handConfig: string) => {
    const lower = handConfig.toLowerCase();
    if (lower.includes('together')) return 'BOTH';
    if (lower.includes('left')) return 'LEFT';
    if (lower.includes('right')) return 'RIGHT';
    if (lower.includes('contrary')) return 'CONTRARY';
    if (lower.includes('staggered')) return 'STAGGERED';
    return handConfig.toUpperCase();
  };

  const getDisplayType = () => {
    if (activePracticeItem.type !== 'scale') return activePracticeItem.type;
    const type = activePracticeItem.scaleType.toLowerCase();
    if (type.includes('arpeggio') || type.includes('7th')) return 'arpeggio';
    return 'scale';
  };

  const displayType = getDisplayType();

  return (
    <Card className="surface overflow-hidden shadow-md">
      <CardContent className="p-0">
        <div className="relative isolate space-y-8 p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 -z-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
          />
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="min-w-0 space-y-3">
              <h2 className="font-display text-4xl leading-none tracking-tight text-primary">
                {activePracticeItem.type === 'scale'
                  ? `${activePracticeItem.key} ${activePracticeItem.scaleType}`
                  : activePracticeItem.name}
              </h2>
              <div className="flex items-center gap-3 text-base font-medium text-muted-foreground">
                <span className={cn(
                  "capitalize px-2 py-0.5 rounded text-xs font-bold tracking-widest border",
                  getCategoryColorClasses(displayType)
                )}>
                  {displayType}
                </span>
                <span>•</span>
                <span>{activePracticeItem.type === 'scale' ? activePracticeItem.articulation : 'Standard'}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Current tempo</p>
                <p className="tnum text-5xl font-black tracking-tight text-primary">{currentBPM} <span className="text-lg font-bold text-muted-foreground">BPM</span></p>
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => activeLogSnapshotFunction?.()}
                  disabled={!activeLogSnapshotFunction}
                  size="lg"
                  className="h-12 px-8 font-bold shadow-md shadow-primary/20 focus-scale"
                >
                  <Save className="mr-2 h-5 w-5" />
                  Save progress
                </Button>
                <Button 
                  variant="ghost"
                  onClick={handlePivot}
                  className="h-12 px-8 text-sm font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors focus-scale"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Too hard / pivot
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <span>To next goal</span>
              <span className="text-primary">{masteryPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={masteryPercentage} className="h-3 shadow-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-8 md:grid-cols-4">
            <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                Highest
              </div>
              <p className="mt-1 text-lg font-black tabular-nums text-primary">
                {activePracticeItem.type === 'scale' ? activePracticeItem.highestBPM : activePracticeItem.currentHighestBPM} BPM
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <Target className="h-3.5 w-3.5" />
                Goal
              </div>
              <p className="mt-1 text-lg font-black tabular-nums text-primary">
                {activePracticeItem.type === 'scale' ? activePracticeItem.nextGoalBPM : activePracticeItem.nextTargetBPM} BPM
              </p>
            </div>
            {activePracticeItem.type === 'scale' && (
              <>
                <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Music className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Octaves</p>
                    <p className="truncate text-sm font-bold text-primary">{getOctaveNumber(activePracticeItem.octaves)}</p>
                  </div>
                </div>
                <div className={cn(
                  "flex items-center gap-3 rounded-xl border p-3",
                  getHandColorClasses(activePracticeItem.handConfig).split(' ').filter(c => !c.startsWith('data-')).join(' ')
                )}>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-current/10">
                    <Hand className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Hands</p>
                    <p className="truncate text-sm font-bold">{getHandLabel(activePracticeItem.handConfig)}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PracticeSummaryPanel;