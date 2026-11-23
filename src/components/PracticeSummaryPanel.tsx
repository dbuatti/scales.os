import React from 'react';
import { useGlobalBPM } from '@/context/GlobalBPMContext';
import { useScales } from '@/context/ScalesContext';
import { Card, CardContent } from '@/components/ui/card';
import { Save, AlertCircle, Music, Hand, Piano, TrendingUp, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { showSuccess } from '@/utils/toast';
import { cn, getHandColorClasses, getFolderTone, isArpeggioType } from '@/lib/utils';

const PracticeSummaryPanel: React.FC = () => {
  const { activePracticeItem, currentBPM, activeLogSnapshotFunction, setIsPermutationManuallyAdjusted } = useGlobalBPM();
  const { updatePracticeStatus } = useScales();

  if (!activePracticeItem) {
    return (
      <Card className="rounded-2xl border border-dashed border-border/50 bg-card/50">
        <CardContent className="flex flex-col items-center gap-5 p-12 text-center md:p-16">
          <div className="rounded-2xl bg-primary/10 p-4 text-primary">
            <Piano className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <p className="font-display text-2xl tracking-tight">Ready when you are</p>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              Pick a folder, adjust tempo, and track every session as you play.
            </p>
          </div>
          <Button
            onClick={() =>
              document
                .getElementById('practice-modes')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
            className="font-bold focus-scale"
          >
            Choose a scale
          </Button>
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
    }
    const { currentHighestBPM, nextTargetBPM } = activePracticeItem;
    if (nextTargetBPM === currentHighestBPM) return currentBPM >= nextTargetBPM ? 100 : 0;
    return Math.min(100, Math.max(0, ((currentBPM - currentHighestBPM) / (nextTargetBPM - currentHighestBPM)) * 100));
  })();

  const getOctaveNumber = (octaves: string) => {
    const match = octaves.match(/\d+/);
    return match ? match[0] : octaves;
  };

  const getHandLabel = (handConfig: string) => {
    const lower = handConfig.toLowerCase();
    if (lower.includes('together')) return 'BOTH';
    if (lower.includes('left')) return 'LEFT';
    if (lower.includes('right')) return 'RIGHT';
    if (lower.includes('contrary')) return 'CONTRARY';
    if (lower.includes('staggered')) return 'STAGGERED';
    return handConfig.toUpperCase();
  };

  const isArpeggio = activePracticeItem.type === 'scale' && isArpeggioType(activePracticeItem.scaleType);
  const tone = getFolderTone(isArpeggio ? 'arpeggio' : 'scale');

  const title = activePracticeItem.type === 'scale'
    ? `${activePracticeItem.key} ${activePracticeItem.scaleType}`
    : activePracticeItem.name;
  const detail = activePracticeItem.type === 'scale'
    ? `${activePracticeItem.articulation} · ${getHandLabel(activePracticeItem.handConfig)}`
    : 'Standard';

  return (
    <Card className={cn('overflow-hidden rounded-2xl border border-border/60', tone.wash)}>
      <div className={cn('px-6 py-6 text-folder-foreground sm:px-8', tone.solid)}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-folder-foreground/75">
              Now practicing
            </p>
            <h2 className="mt-1 truncate font-display text-3xl leading-tight tracking-tight sm:text-4xl">
              {title}
            </h2>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-folder-foreground/75">
              {detail}
            </p>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-folder-foreground/75">
              Current tempo
            </p>
            <p className="tnum mt-1 text-4xl font-black leading-none tracking-tight">
              {currentBPM} <span className="text-sm font-bold text-folder-foreground/75">BPM</span>
            </p>
          </div>
        </div>
      </div>

      <CardContent className="space-y-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => activeLogSnapshotFunction?.()}
            disabled={!activeLogSnapshotFunction}
            size="lg"
            className="h-11 px-6 font-bold shadow-primary/20 focus-scale"
          >
            <Save className="mr-2 h-4 w-4" />
            Save progress
          </Button>
          <Button
            variant="ghost"
            onClick={handlePivot}
            className="h-11 px-4 text-sm font-bold text-muted-foreground transition-colors hover:text-destructive hover:bg-destructive/5 focus-scale"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Too hard / pivot
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <span>To next goal</span>
            <span className={tone.text}>{masteryPercentage.toFixed(0)}%</span>
          </div>
          <Progress value={masteryPercentage} className="h-3" />
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-6 md:grid-cols-4">
          <div className="rounded-xl border border-border/50 bg-card/70 p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              Highest
            </div>
            <p className="mt-1 text-lg font-black tabular-nums text-primary">
              {activePracticeItem.type === 'scale' ? activePracticeItem.highestBPM : activePracticeItem.currentHighestBPM} BPM
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/70 p-3">
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
              <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/70 p-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Music className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Octaves</p>
                  <p className="truncate text-sm font-bold text-primary">{getOctaveNumber(activePracticeItem.octaves)}</p>
                </div>
              </div>
              <div className={cn(
                'flex items-center gap-3 rounded-xl border p-3',
                getHandColorClasses(activePracticeItem.handConfig).split(' ').filter(c => !c.startsWith('data-')).join(' '),
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
      </CardContent>
    </Card>
  );
};

export default PracticeSummaryPanel;
