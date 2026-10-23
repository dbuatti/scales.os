import React, { useMemo } from 'react';
import EmptyState from './EmptyState';
import StatTile from './StatTile';
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={BookOpen} label="Repertoire titles" value={stats.distinctTitles} />
        <StatTile icon={Calendar} label="Repertoire sessions" value={stats.sessions} />
        <StatTile icon={Clock} label="Repertoire time" value={`${stats.minutes}m`} />
        <StatTile
          icon={Target}
          label="At target BPM"
          value={stats.totalItems > 0 ? `${stats.atTarget}/${stats.totalItems}` : '—'}
        />
      </div>

      <Card className="surface">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
            <EmptyState
              icon={BookOpen}
              title="No repertoire practice yet"
              description="Open a method book in the Reader and log a session."
            />
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