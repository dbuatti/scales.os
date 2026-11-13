import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { addDays, format, isSameDay, startOfDay, startOfWeek, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PracticeLogEntry } from '@/context/ScalesContext';

const WEEKS = 15;
const LEVELS = [
  'bg-muted/70',
  'bg-primary/20',
  'bg-primary/40',
  'bg-primary/65',
  'bg-primary',
];

const levelFor = (minutes: number) => {
  if (minutes <= 0) return 0;
  if (minutes < 10) return 1;
  if (minutes < 25) return 2;
  if (minutes < 45) return 3;
  return 4;
};

interface PracticeHeatmapProps {
  log: PracticeLogEntry[];
}

const PracticeHeatmap: React.FC<PracticeHeatmapProps> = ({ log }) => {
  const { weeks, totalSessions, streak, last7 } = useMemo(() => {
    const today = startOfDay(new Date());
    const start = startOfWeek(subDays(today, (WEEKS - 1) * 7), { weekStartsOn: 1 });

    const minutesByDay = new Map<string, number>();
    for (const entry of log) {
      const key = format(new Date(entry.timestamp), 'yyyy-MM-dd');
      const minutes = entry.durationMinutes ?? 0;
      minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + (minutes > 0 ? minutes : 1));
    }

    const days = Array.from({ length: WEEKS * 7 }, (_, index) => addDays(start, index)).filter(
      (day) => day <= today,
    );

    const columns: Date[][] = [];
    for (let index = 0; index < days.length; index += 7) {
      columns.push(days.slice(index, index + 7));
    }

    const activeDays = [...minutesByDay.keys()].filter((key) => (minutesByDay.get(key) ?? 0) > 0);
    // Grace until the day is over: if you haven't practised yet today, yesterday
    // still keeps the streak alive.
    let cursor = minutesByDay.has(format(today, 'yyyy-MM-dd')) ? today : subDays(today, 1);
    let currentStreak = 0;
    while (minutesByDay.has(format(cursor, 'yyyy-MM-dd'))) {
      currentStreak += 1;
      cursor = subDays(cursor, 1);
    }

    const last7 = Array.from({ length: 7 }, (_, index) => subDays(today, index)).filter((day) =>
      minutesByDay.has(format(day, 'yyyy-MM-dd')),
    ).length;

    return {
      weeks: columns,
      totalSessions: activeDays.length,
      streak: currentStreak,
      last7,
    };
  }, [log]);

  const hasData = totalSessions > 0;

  return (
    <Card className="surface">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarDays className="size-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold">Consistency</CardTitle>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Last {WEEKS} weeks
            </p>
          </div>
        </div>
        <p className="sr-only">
          {totalSessions} active practice {totalSessions === 1 ? 'day' : 'days'} in the last {WEEKS} weeks.
        </p>
        <div className="flex items-center gap-3 text-right">
          <div>
            <p className="tnum text-lg font-black leading-none">{last7}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Last 7 days
            </p>
          </div>
          <div className="h-7 w-px bg-border/60" />
          <div>
            <p className="tnum flex items-center justify-end gap-1 text-lg font-black leading-none">
              <Flame className={cn('size-3.5', streak > 0 ? 'text-accent' : 'text-muted-foreground/40')} />
              {streak}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Day streak
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-5">
        {hasData ? (
          <div className="flex gap-2">
            <div className="grid grid-rows-7 gap-[3px] pt-0">
              {['M', '', 'W', '', 'F', '', ''].map((label, index) => (
                <span
                  key={`${label}-${index}`}
                  className="flex h-[11px] items-center text-[8px] font-bold uppercase text-muted-foreground/60"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="flex flex-1 gap-[3px] overflow-x-auto pb-0.5">
              {weeks.map((week) => (
                <div key={week[0].toISOString()} className="grid grid-rows-7 gap-[3px]">
                  {week.map((day) => {
                    const key = format(day, 'yyyy-MM-dd');
                    const minutes = Math.round(
                      log
                        .filter((entry) => isSameDay(new Date(entry.timestamp), day))
                        .reduce((sum, entry) => sum + (entry.durationMinutes || 1), 0),
                    );
                    return (
                      <div
                        key={key}
                        title={`${format(day, 'EEE d MMM')} — ${minutes > 0 ? `${minutes} min` : 'No practice'}`}
                        className={cn(
                          'size-[11px] rounded-[3px] transition-transform hover:scale-110',
                          LEVELS[levelFor(minutes)],
                        )}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="hidden shrink-0 flex-col justify-end gap-1 pb-0.5 sm:flex">
              <div className="flex items-center gap-1">
                {LEVELS.map((level) => (
                  <span key={level} className={cn('size-[9px] rounded-[2px]', level)} />
                ))}
              </div>
              <span className="text-right text-[8px] font-bold uppercase tracking-wider text-muted-foreground/60">
                Less / More
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center">
            <p className="text-sm font-semibold">Your consistency map starts with one session.</p>
            <p className="text-xs text-muted-foreground">
              Every day you practise fills a square. Miss a day and the chain resets.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-1 font-bold">
              <Link to="/">Start a session</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PracticeHeatmap;