import React from 'react';
import { useGlobalBPM } from '@/context/GlobalBPMContext';
import { Save, SlidersHorizontal, Music, Hand, TrendingUp, Trophy, Piano } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn, isArpeggioType } from '@/lib/utils';

interface PracticeSummaryPanelProps {
  overallBestBpm: number;
  exerciseBestBpm: number;
  targetBpm: number | null;
  masteryPercentage: number;
  remainingBpm: number;
  onAdjust: () => void;
}

const getOctaveNumber = (octaves: string) => octaves.match(/\d+/)?.[0] ?? octaves;

const getHandLabel = (handConfig: string) => {
  const lower = handConfig.toLowerCase();
  if (lower.includes('together')) return 'Both';
  if (lower.includes('left')) return 'Left';
  if (lower.includes('right')) return 'Right';
  if (lower.includes('contrary')) return 'Contrary';
  if (lower.includes('staggered')) return 'Staggered';
  return handConfig;
};

/** Exercise-specific progress, kept separate from lifetime practice history. */
const PracticeSummaryPanel: React.FC<PracticeSummaryPanelProps> = ({
  overallBestBpm,
  exerciseBestBpm,
  targetBpm,
  masteryPercentage,
  remainingBpm,
  onAdjust,
}) => {
  const { activePracticeItem, currentBPM, activeLogSnapshotFunction } = useGlobalBPM();

  if (!activePracticeItem) {
    return (
      <section className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Piano className="size-5" />
        </div>
        <p className="mt-4 font-display text-xl tracking-tight">Ready when you are</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Pick a key and exercise below, then start a session.
        </p>
      </section>
    );
  }

  const isScale = activePracticeItem.type === 'scale';
  const isArpeggio = isScale && isArpeggioType(activePracticeItem.scaleType);
  const title = isScale
    ? `${activePracticeItem.key} ${activePracticeItem.scaleType}`
    : activePracticeItem.name;
  const detail = isScale
    ? `${activePracticeItem.articulation} · ${getHandLabel(activePracticeItem.handConfig)}`
    : 'Method book exercise';
  const range = isScale ? `${getOctaveNumber(activePracticeItem.octaves)} octaves` : 'Standard';
  const hands = isScale ? getHandLabel(activePracticeItem.handConfig) : 'Both';
  const goalReached = masteryPercentage >= 100;

  const stats = [
    {
      label: 'Exercise best',
      value: exerciseBestBpm,
      suffix: 'BPM',
      icon: TrendingUp,
      tint: isArpeggio ? 'text-folder-arpeggio' : 'text-primary',
    },
    {
      label: 'All-time best',
      value: overallBestBpm,
      suffix: 'BPM',
      icon: Trophy,
      tint: 'text-primary',
    },
    { label: 'Current range', value: range, suffix: '', icon: Music, tint: 'text-primary' },
    { label: 'Hands', value: hands, suffix: '', icon: Hand, tint: 'text-primary' },
  ];

  return (
    <section className="rounded-2xl border border-primary/15 bg-card/70 p-6 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
              Exercise progress
            </p>
            <span
              className={cn(
                'rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
                goalReached
                  ? 'border-success/25 bg-success/10 text-success'
                  : 'border-border/60 bg-muted/50 text-muted-foreground',
              )}
            >
              {goalReached ? 'Goal reached' : 'In progress'}
            </span>
          </div>
          <h2 className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="mt-1 text-sm font-medium text-muted-foreground">{detail}</p>
        </div>

        <div className="text-left sm:text-right">
          <p className="tnum text-5xl font-black leading-none tracking-tight sm:text-6xl">
            {currentBPM}
          </p>
          <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Current tempo · BPM
          </p>
          {targetBpm && (
            <p className="mt-1 text-xs font-bold text-primary">Target {targetBpm} BPM</p>
          )}
        </div>
      </div>

      <div className="mt-7 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <span>To next milestone</span>
          <span className="tnum">{masteryPercentage}%</span>
        </div>
        <Progress value={masteryPercentage} className="h-2" />
        <p className="text-xs font-medium text-muted-foreground">
          {remainingBpm > 0
            ? `${remainingBpm} BPM remaining to your next milestone.`
            : 'Milestone reached — raise the target when you are ready.'}
        </p>
      </div>

      <div className="mt-7 grid gap-px overflow-hidden rounded-xl border border-border/60 bg-border/60 sm:grid-cols-4">
        {stats.map(({ label, value, suffix, icon: Icon, tint }) => (
          <div key={label} className="bg-card px-4 py-4">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <Icon className={cn('size-3.5', tint)} />
              {label}
            </p>
            <p className="tnum mt-2 text-2xl font-black leading-none tracking-tight">
              {value}
              {suffix && <span className="ml-1 text-xs font-bold text-muted-foreground">{suffix}</span>}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button
          onClick={() => activeLogSnapshotFunction?.()}
          disabled={!activeLogSnapshotFunction}
          size="sm"
          className="h-10 px-5 font-bold focus-scale"
        >
          <Save className="mr-1.5 size-4" />
          Save progress
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAdjust}
          className="h-10 px-3 text-xs font-bold text-muted-foreground hover:text-foreground focus-scale"
        >
          <SlidersHorizontal className="mr-1.5 size-4" />
          Adjust exercise
        </Button>
      </div>
    </section>
  );
};

export default PracticeSummaryPanel;
