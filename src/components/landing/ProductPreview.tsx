import React, { useId } from 'react';
import { Check, CheckCircle2 } from 'lucide-react';

const TEMPO_POINTS = [96, 99, 98, 101, 103, 102, 105, 108, 107, 110, 112, 111, 114, 116];
const CHART = { width: 320, height: 76, min: 90, max: 130, goal: 126 };

const buildChart = () => {
  const { width, height, min, max } = CHART;
  const step = width / (TEMPO_POINTS.length - 1);
  const points = TEMPO_POINTS.map((value, index) => {
    const x = index * step;
    const y = height - ((value - min) / (max - min)) * height;
    return [x, y] as const;
  });
  const line = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  const goalY = height - ((CHART.goal - min) / (max - min)) * height;
  const last = points[points.length - 1];
  return { line, area, goalY, last };
};

const CHIPS = ['Scale', 'Legato', '2 octaves', 'Hands together'];
const STATS = [
  { label: 'Highest', value: '118', unit: 'BPM' },
  { label: 'Goal', value: '126', unit: 'BPM' },
  { label: 'Sessions', value: '23', unit: 'logged' },
];

/**
 * A faithful, hand-built preview of the practice screen.
 * Purely presentational — no app data, no fake metrics beyond a realistic demo.
 */
const ProductPreview: React.FC = () => {
  const uid = useId().replace(/[:]/g, '');
  const gradientId = `tempo-fill-${uid}`;
  const { line, area, goalY, last } = buildChart();

  return (
    <div className="relative mx-auto w-full max-w-[38rem]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-tr from-primary/15 via-primary/5 to-accent/10 blur-3xl"
      />

      <div className="surface relative overflow-hidden rounded-[1.75rem] p-2 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.08),0_30px_80px_-40px_hsl(var(--shadow-color)/0.55)]">
        <div className="overflow-hidden rounded-[1.35rem] border border-border/50 bg-card/95">
          {/* Window chrome */}
          <div className="flex items-center justify-between gap-3 border-b border-border/50 bg-background/40 px-4 py-2.5 sm:px-5">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="size-2 rounded-full bg-border" />
              <span className="size-2 rounded-full bg-border" />
              <span className="size-2 rounded-full bg-border" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              Practice
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
              <Check className="size-3" aria-hidden="true" />
              Saved
            </span>
          </div>

          <div className="grid gap-6 p-5 sm:grid-cols-[1.05fr_0.95fr] sm:p-6">
            {/* Exercise */}
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                Suggested focus
              </p>
              <h3 className="mt-1.5 font-display text-[2.1rem] leading-none tracking-tight sm:text-4xl">
                C Major
              </h3>
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {CHIPS.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            {/* Tempo */}
            <div className="flex items-end justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
              <div className="text-left sm:text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  Tempo
                </p>
                <p className="tnum mt-0.5 text-6xl font-black leading-none tracking-[-0.04em] text-primary">
                  112
                </p>
              </div>
              <span className="tnum rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Goal 126
              </span>
            </div>
          </div>

          {/* Goal progress */}
          <div className="space-y-2 px-5 pb-5 sm:px-6">
            <div className="flex items-baseline justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              <span>Progress to next goal</span>
              <span className="tnum text-primary">64%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[64%] rounded-full bg-gradient-to-r from-primary/70 to-primary" />
            </div>
          </div>

          {/* Tempo chart */}
          <div className="px-5 pb-5 sm:px-6">
            <div className="rounded-2xl border border-border/50 bg-background/40 p-4">
              <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                <span>Tempo history</span>
                <span className="normal-case tracking-normal">Last 14 sessions</span>
              </div>
              <div className="relative">
                <svg
                  viewBox={`0 0 ${CHART.width} ${CHART.height}`}
                  preserveAspectRatio="none"
                  className="h-20 w-full"
                  role="img"
                  aria-label="Tempo rising from 96 to 116 BPM over the last 14 sessions"
                >
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <line
                    x1="0"
                    x2={CHART.width}
                    y1={goalY}
                    y2={goalY}
                    stroke="hsl(var(--accent))"
                    strokeOpacity="0.45"
                    strokeWidth="1"
                    strokeDasharray="4 5"
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d={area}
                    fill={`url(#${gradientId})`}
                    className="animate-in fade-in fill-mode-both duration-700"
                  />
                  <path
                    d={line}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    pathLength={1}
                    className="chart-line"
                  />
                </svg>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-4 ring-primary/15"
                  style={{ left: '100%', top: `${(last[1] / CHART.height) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 divide-x divide-border/50 border-t border-border/50 bg-background/30">
            {STATS.map((stat) => (
              <div key={stat.label} className="px-3 py-3 text-center sm:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  {stat.label}
                </p>
                <p className="tnum mt-0.5 text-lg font-black leading-tight">
                  {stat.value}
                  <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {stat.unit}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating confirmation */}
      <div className="surface animate-drift absolute -bottom-4 right-2 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 sm:-right-5">
        <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
        <div>
          <p className="text-[11px] font-bold leading-tight">Progress saved</p>
          <p className="text-[10px] leading-tight text-muted-foreground">+6 BPM this week</p>
        </div>
      </div>
    </div>
  );
};

export default ProductPreview;