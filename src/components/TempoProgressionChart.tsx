"use client";

import React, { useMemo, useState } from 'react';
import EmptyState from './EmptyState';
import {
  AreaChart,
  Area,
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
    <Card className="surface">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
          <EmptyState
            icon={TrendingUp}
            title="No tempo snapshots yet"
            description="Log a session to start tracking your BPM over time."
          />
        ) : (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                    backgroundColor: 'hsl(var(--card) / 0.9)',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    fontSize: '12px',
                    backdropFilter: 'blur(12px)',
                  }}
                  formatter={(value) => [`${value} BPM`, 'Tempo']}
                />
                <Area
                  type="monotone"
                  dataKey="bpm"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#tempoGradient)"
                  dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                  activeDot={{ r: 5, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                  animationDuration={700}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TempoProgressionChart;
