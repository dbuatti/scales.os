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
      <Card className="surface border-dashed">
        <CardContent className="flex flex-col items-center gap-5 p-12 text-center md:p-16">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <Piano className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-bold tracking-tight">Ready when you are</p>
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

  const highestBPM = activePracticeItem.type === 'scale' ? activePracticeItem.highestBPM : activePracticeItem.currentHighestBPM;
  const goalBPM = activePracticeItem.type === 'scale' ? activePracticeItem.nextGoalBPM : activePracticeItem.nextTargetBPM;

  return (
    <Card className="surface overflow-hidden">
      <CardContent className="p-0">
        <div className="relative isolate space-y-6 p-5 sm:p-6 md:space-y-8 md:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 -z-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
          />
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center md:gap-8">
            <div className="min-w-0 space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-primary sm:text-3xl">
                {activePracticeItem.type === 'scale'
                  ? `${activePracticeItem.key} ${activePracticeItem.scaleType}`
                  : activePracticeItem.name}
              </h2>
              <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
                <span className={cn(
                  "rounded-md border px-2 py-0.5 text-xs font-bold capitalize tracking-wide",
                  getCategoryColorClasses(displayType)
                )}>
                  {displayType}
                </span>
                <span aria-hidden="true" className="text-muted-foreground/50">•</span>
                <span>{activePracticeItem.type === 'scale' ? activePracticeItem.articulation : 'Standard'}</span>
              </div>
            </div>

            <div className="flex items-end justify-between gap-6 md:items-center md:gap-8">
              <div className="md:text-right">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Current tempo</p>
                <p className="text-4xl font-black tabular-nums tracking-tight text-primary sm:text-5xl">
                  {currentBPM} <span className="text-base font-bold text-muted-foreground sm:text-lg">BPM</span>
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => activeLogSnapshotFunction?.()}
                  disabled={!activeLogSnapshotFunction}
                  size="lg"
                  className="h-11 px-6 font-bold shadow-sm focus-scale sm:h-12 sm:px-8"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save progress
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePivot}
                  className="h-9 text-xs font-bold text-muted-foreground transition-all duration-150 hover:bg-destructive/5 hover:text-destructive active:scale-[0.98]"
                >
                  <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                  Too hard / pivot
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <span>Progress to next goal</span>
              <span className="tabular-nums text-primary">{masteryPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={masteryPercentage} className="h-2.5" />
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-border/50 pt-6 md:grid-cols-4 md:pt-8">
            <SummaryStat icon={<TrendingUp className="h-4 w-4" />} label="Highest" value={`${highestBPM} BPM`} />
            <SummaryStat icon={<Target className="h-4 w-4" />} label="Goal" value={`${goalBPM} BPM`} />
            {activePracticeItem.type === 'scale' && (
              <>
                <SummaryStat icon={<Music className="h-4 w-4" />} label="Octaves" value={getOctaveNumber(activePracticeItem.octaves)} />
                <SummaryStat
                  icon={<Hand className="h-4 w-4" />}
                  label="Hands"
                  value={getHandLabel(activePracticeItem.handConfig)}
                  className={getHandColorClasses(activePracticeItem.handConfig).split(' ').filter(c => !c.includes('data-')).join(' ')}
                  toned
                />
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface SummaryStatProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  className?: string;
  /** Inherit text colour from className instead of the primary accent. */
  toned?: boolean;
}

const SummaryStat: React.FC<SummaryStatProps> = ({ icon, label, value, className, toned = false }) => (
  <div className={cn('flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-3', className)}>
    <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', toned ? 'bg-current/10' : 'bg-primary/10 text-primary')}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className={cn('text-[10px] font-bold uppercase tracking-wider', toned ? 'opacity-70' : 'text-muted-foreground')}>{label}</p>
      <p className={cn('truncate text-sm font-black tabular-nums', !toned && 'text-foreground')}>{value}</p>
    </div>
  </div>
);

export default PracticeSummaryPanel;