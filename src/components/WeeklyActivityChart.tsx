"use client";

import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { useScales } from '@/context/ScalesContext';
import { format, subDays, isSameDay, startOfDay } from 'date-fns';

const WeeklyActivityChart = () => {
  const { log } = useScales();

  const data = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date,
        dayName: format(date, 'EEE'),
        minutes: 0,
      };
    });

    log.forEach(entry => {
      const entryDate = startOfDay(new Date(entry.timestamp));
      const dayData = last7Days.find(d => isSameDay(d.date, entryDate));
      if (dayData) {
        dayData.minutes += entry.durationMinutes;
      }
    });

    return last7Days;
  }, [log]);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.55} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--primary) / 0.1)" />
          <XAxis 
            dataKey="dayName" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <Tooltip 
            cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card) / 0.9)', 
              borderColor: 'hsl(var(--border))',
              borderRadius: 'var(--radius)',
              fontSize: '12px',
              backdropFilter: 'blur(12px)'
            }}
            formatter={(value) => [`${value} min`, 'Volume']}
          />
          <Bar
            dataKey="minutes"
            radius={[6, 6, 0, 0]}
            maxBarSize={48}
            animationDuration={700}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.minutes > 0 ? 'url(#volumeGradient)' : 'hsl(var(--muted) / 0.5)'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklyActivityChart;