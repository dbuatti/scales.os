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
        <Card className="bg-card border-2 border-primary/5">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tighter">{stats.distinctTitles}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Repertoire Titles</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-2 border-primary/5">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-500">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tighter">{stats.sessions}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Repertoire Sessions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-2 border-primary/5">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tighter">{stats.minutes}m</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Repertoire Time</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-2 border-primary/5">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tighter">
                {stats.totalItems > 0 ? `${stats.atTarget}/${stats.totalItems}` : '—'}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">At Target BPM</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-2 border-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <ListChecks className="w-4 h-4" />
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
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 border border-border/60"
                >
                  <span className="text-sm font-medium truncate">{title}</span>
                  <span className="ml-3 shrink-0 text-xs font-mono text-muted-foreground">
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