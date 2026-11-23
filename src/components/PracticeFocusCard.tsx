import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

interface PracticeFocusCardProps {
  title: string;
  meta: string;
  bpm: number;
  targetBpm: number | null;
  onStart: () => void;
  suggestionLabel?: string | null;
  onLoadSuggestion?: () => void;
  isEngagingSuggestion?: boolean;
}

/** The landing view: one exercise, one tempo, one obvious next action. */
const PracticeFocusCard: React.FC<PracticeFocusCardProps> = ({
  title,
  meta,
  bpm,
  targetBpm,
  onStart,
  suggestionLabel,
  onLoadSuggestion,
  isEngagingSuggestion,
}) => (
  <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-primary/[0.06] px-6 py-7 shadow-sm sm:px-8 sm:py-9">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-primary/10 blur-3xl"
    />
    <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
            Today&apos;s focus
          </p>
          <span className="rounded-full border border-primary/20 bg-background/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Ready
          </span>
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-4xl leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl">
            {title}
          </h2>
          <p className="text-sm font-medium text-muted-foreground sm:text-base">{meta}</p>
        </div>
        {suggestionLabel && onLoadSuggestion && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onLoadSuggestion}
            disabled={isEngagingSuggestion}
            className="h-9 gap-2 border-primary/20 bg-background/70 px-3 text-xs font-bold text-primary hover:bg-background hover:text-primary focus-scale"
          >
            <Sparkles className="size-3.5" />
            Use suggested: {suggestionLabel}
            <ArrowRight className="size-3.5" />
          </Button>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-5 sm:flex-row sm:items-end lg:gap-8">
        <div className="sm:text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Current tempo
          </p>
          <p className="tnum mt-1 text-5xl font-black leading-none tracking-tight text-foreground">
            {bpm}
          </p>
          <p className="mt-1 text-xs font-bold text-muted-foreground">
            {targetBpm ? `Target ${targetBpm} BPM` : 'BPM'}
          </p>
        </div>
        <Button size="lg" onClick={onStart} className="h-12 px-6 text-sm font-bold focus-scale">
          Start practising
          <ArrowRight className="ml-1.5 size-4" />
        </Button>
      </div>
    </div>
  </section>
);

export default PracticeFocusCard;
