import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Check, Timer, TrendingUp, Trophy, Volume2 } from 'lucide-react';
import { usePracticeTransport } from '@/context/PracticeTransportContext';

interface PracticeModePanelProps {
  title: string;
  meta: string;
  currentBpm: number;
  targetBpm: number | null;
  exerciseBestBpm: number;
  overallBestBpm: number;
  masteryPercentage: number;
  remainingBpm: number;
  onSave: () => void;
  canSave: boolean;
}

const formatTimer = (total: number) => {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/** Active session view: one exercise, one tempo, one obvious next action. */
const PracticeModePanel: React.FC<PracticeModePanelProps> = ({
  title,
  meta,
  currentBpm,
  targetBpm,
  exerciseBestBpm,
  overallBestBpm,
  masteryPercentage,
  remainingBpm,
  onSave,
  canSave,
}) => {
  const { sessionSeconds, endPractice } = usePracticeTransport();

  return (
    <section className="relative overflow-hidden rounded-2xl bg-primary px-6 py-8 text-primary-foreground shadow-md sm:px-9 sm:py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-40 size-[28rem] rounded-full bg-white/10 blur-3xl"
      />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="size-2 rounded-full bg-white/80" aria-hidden="true" />
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/80">
            Practice mode
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={endPractice}
          className="h-9 gap-1.5 px-3 text-xs font-bold text-white/80 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="size-3.5" />
          Finish practice
        </Button>
      </div>

      <div className="relative mt-9 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
        <div className="min-w-0 space-y-8">
          <div className="space-y-2">
            <h2 className="font-display text-4xl leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
              {title}
            </h2>
            <p className="text-sm font-medium text-white/70">{meta}</p>
          </div>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
                  Current tempo
                </p>
                <p className="tnum mt-1 text-7xl font-black leading-none tracking-tight sm:text-8xl">
                  {currentBpm}
                </p>
                <p className="mt-2 text-sm font-bold text-white/70">BPM</p>
              </div>
              {targetBpm && (
                <div className="text-left sm:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
                    Next milestone
                  </p>
                  <p className="tnum mt-1 text-3xl font-black tracking-tight">{targetBpm} BPM</p>
                  <p className="mt-1 text-xs font-bold text-white/70">
                    {remainingBpm > 0 ? `${remainingBpm} BPM to go` : 'Reached'}
                  </p>
                </div>
              )}
            </div>

            <Progress
              value={masteryPercentage}
              className="mt-5 h-2 border-white/10 bg-white/15 [&>div]:bg-white"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
              <TrendingUp className="size-4 text-white/70" aria-hidden="true" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                  Exercise best
                </p>
                <p className="tnum text-lg font-black leading-tight">{exerciseBestBpm} BPM</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
              <Trophy className="size-4 text-white/70" aria-hidden="true" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                  All-time best
                </p>
                <p className="tnum text-lg font-black leading-tight">{overallBestBpm} BPM</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={onSave}
              disabled={!canSave}
              className="h-12 bg-white px-6 font-bold text-primary hover:bg-white/90"
            >
              <Check className="mr-1.5 size-4" />
              Save progress
            </Button>
            <p className="text-xs text-white/60">Space or S also saves a snapshot.</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
            <Timer className="size-3.5" />
            This session
          </p>
          <p className="tnum mt-3 text-5xl font-black leading-none tracking-tight">
            {formatTimer(sessionSeconds)}
          </p>
          <p className="mt-2 text-xs font-medium text-white/60">
            Recorded when you save your progress.
          </p>
          <div className="mt-6 flex items-start gap-2 border-t border-white/15 pt-5 text-xs leading-relaxed text-white/70">
            <Volume2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>Metronome, tap tempo and sound stay available in the toolbar above.</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PracticeModePanel;
