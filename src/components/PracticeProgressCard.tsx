import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Timer, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { PracticeLogEntry } from '@/context/ScalesContext';

interface PracticeProgressCardProps {
  log: PracticeLogEntry[];
  streak: number;
  overallBestBpm: number;
  weeklyGoal: number;
}

const minutesSince = (log: PracticeLogEntry[], since: number) =>
  log
    .filter((entry) => entry.timestamp >= since)
    .reduce((total, entry) => total + (entry.durationMinutes || 0), 0);

/** Lifetime practice history, distinct from the current exercise's progress. */
const PracticeProgressCard: React.FC<PracticeProgressCardProps> = ({
  log,
  streak,
  overallBestBpm,
  weeklyGoal,
}) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayMinutes = minutesSince(log, startOfToday.getTime());
  const weekMinutes = minutesSince(log, Date.now() - 7 * 24 * 60 * 60 * 1000);
  const goalPercent = Math.min(100, Math.round((weekMinutes / weeklyGoal) * 100));

  return (
    <section className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-6 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
            Practice history
          </p>
          <h3 className="mt-2 font-display text-3xl tracking-tight">Steady work adds up.</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Only recorded tempos and session minutes — nothing estimated.
          </p>
        </div>
        <Link
          to="/progress"
          className="shrink-0 text-xs font-bold text-primary transition-colors hover:text-primary/80"
        >
          View progress <ArrowRight className="ml-1 inline size-3.5" />
        </Link>
      </div>

      <div className="mt-7 grid gap-6 sm:grid-cols-3">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Timer className="size-3.5 text-primary" />
            Practised today
          </p>
          <p className="tnum mt-2 text-4xl font-black leading-none tracking-tight">
            {todayMinutes}
            <span className="ml-1.5 text-sm font-bold text-muted-foreground">min</span>
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Flame className="size-3.5 text-primary" />
            Current streak
          </p>
          <p className="tnum mt-2 text-4xl font-black leading-none tracking-tight">
            {streak}
            <span className="ml-1.5 text-sm font-bold text-muted-foreground">days</span>
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="size-3.5 text-primary" />
            All-time best
          </p>
          <p className="tnum mt-2 text-4xl font-black leading-none tracking-tight">
            {overallBestBpm}
            <span className="ml-1.5 text-sm font-bold text-muted-foreground">BPM</span>
          </p>
          <p className="mt-1 text-[11px] font-medium text-muted-foreground">Across every exercise</p>
        </div>
      </div>

      <div className="mt-7 space-y-2.5 border-t border-border/60 pt-6">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <span>This week</span>
          <span className="tnum">{weekMinutes} / {weeklyGoal} min</span>
        </div>
        <Progress value={goalPercent} className="h-2" />
      </div>
    </section>
  );
};

export default PracticeProgressCard;
