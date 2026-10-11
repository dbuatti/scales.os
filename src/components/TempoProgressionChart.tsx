"use client";

import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useScales } from '@/context/ScalesContext';
import { extractPracticePoints, groupPointsByName } from '@/lib/progression';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const TempoProgressionChart = () => {
  const { log } = useScales();
  const groups = useMemo(
    () => groupPointsByName(extractPracticePoints(log)),
    [log],
  );

  const [selectedName, setSelectedName] = useState<string | null>(null);
  const active = groups.find((g) => g.name === selectedName) ?? groups[0];

  const data = useMemo(
    () =>
      active
        ? active.points.map((p) => ({
            date: format(new Date(p.timestamp), 'MMM d'),
            bpm: p.bpm,
          }))
        : [],
    [active],
  );

  const latestBpm = active ? active.points[active.points.length - 1].bpm : null;

  return (
    <Card className="bg-card border border-primary/10 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Tempo Progression
            </CardTitle>
            {active && (
              <CardDescription>
                {active.name} · latest{' '}
                <span className="font-semibold text-foreground">{latestBpm} BPM</span>
              </CardDescription>
            )}
          </div>
          {groups.length > 1 && (
            <Select value={active?.name} onValueChange={setSelectedName}>
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue placeholder="Choose exercise" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.name} value={group.name} className="text-xs">
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">
            No tempo snapshots yet. Log a session to start tracking your BPM over time.
          </p>
        ) : (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--primary) / 0.1)"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  domain={['dataMin - 5', 'dataMax + 5']}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ stroke: 'hsl(var(--primary) / 0.3)' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [`${value} BPM`, 'Tempo']}
                />
                <Line
                  type="monotone"
                  dataKey="bpm"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TempoProgressionChart;
