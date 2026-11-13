import React, { useMemo } from 'react';
import { useScales } from '@/context/ScalesContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen, Clock, Target, Calendar, ListChecks } from 'lucide-react';
import { format } from 'date-fns';

const RepertoireStats = () => {
  const { log } = useScales();

  const stats = useMemo(() => {
    const repertoireEntries = log.filter((entry) =>
      entry.itemsPracticed.some((item) => item.type === 'repertoire'),
    );
    const items = repertoireEntries.flatMap((entry) =>
      entry.itemsPracticed.filter((item) => item.type === 'repertoire'),
    );

    const titleCounts: Record<string, number> = {};
    items.forEach((item) => {
      const name = item.repertoireName || 'Unnamed';
      titleCounts[name] = (titleCounts[name] || 0) + 1;
    });

    const topTitles = Object.entries(titleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const lastSession =
      repertoireEntries.length > 0
        ? Math.max(...repertoireEntries.map((entry) => entry.timestamp))
        : null;

    const atTarget = items.filter(
      (item) =>
        typeof item.repertoireBpmTarget === 'number' &&
        typeof item.practicedBPM === 'number' &&
        item.practicedBPM >= item.repertoireBpmTarget,
    ).length;

    return {
      sessions: repertoireEntries.length,
      minutes: repertoireEntries.reduce(
        (sum, entry) => sum + entry.durationMinutes,
        0,
      ),
      distinctTitles: Object.keys(titleCounts).length,
      topTitles,
      lastSession,
      atTarget,
      totalItems: items.length,
    };
  }, [log]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="surface-interactive">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-primary/10 p-3 text-primary ring-1 ring-inset ring-primary/10">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black tracking-tight tabular-nums">{stats.distinctTitles}</p>
              <p className="text-[10px] font-bold uppercase leading-tight tracking-widest text-muted-foreground">Repertoire Titles</p>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-interactive">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-accent/10 p-3 text-accent ring-1 ring-inset ring-accent/15">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black tracking-tight tabular-nums">{stats.sessions}</p>
              <p className="text-[10px] font-bold uppercase leading-tight tracking-widest text-muted-foreground">Repertoire Sessions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-interactive">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-primary/[0.07] p-3 text-primary/80 ring-1 ring-inset ring-primary/10">
              <Clock className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black tracking-tight tabular-nums">{stats.minutes}m</p>
              <p className="text-[10px] font-bold uppercase leading-tight tracking-widest text-muted-foreground">Repertoire Time</p>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-interactive">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-success/10 p-3 text-success ring-1 ring-inset ring-success/15">
              <Target className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black tracking-tight tabular-nums">
                {stats.totalItems > 0 ? `${stats.atTarget}/${stats.totalItems}` : '—'}
              </p>
              <p className="text-[10px] font-bold uppercase leading-tight tracking-widest text-muted-foreground">At Target BPM</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="surface-interactive">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Most Practiced Repertoire
          </CardTitle>
          {stats.lastSession && (
            <CardDescription>
              Last practiced{' '}
              <span className="font-semibold text-foreground">
                {format(new Date(stats.lastSession), 'MMM d, yyyy')}
              </span>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {stats.topTitles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No repertoire practice yet. Open a method book in the Repertoire panel and log a
              session.
            </p>
          ) : (
            <div className="space-y-2">
              {stats.topTitles.map(([title, count]) => (
                <div
                  key={title}
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 p-3"
                >
                  <span className="truncate text-sm font-medium">{title}</span>
                  <span className="ml-3 shrink-0 text-xs tabular-nums text-muted-foreground">
                    {count} time{count === 1 ? '' : 's'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RepertoireStats;