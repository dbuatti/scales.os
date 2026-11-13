import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, X } from 'lucide-react';
import { useRepertoire } from '@/context/RepertoireContext';
import { useScales } from '@/context/ScalesContext';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';

const DISMISS_KEY = 'scales.onboarding.dismissed';
const COMPLETE_KEY = 'scales.onboarding.complete';
const PROGRESS_VISITED_KEY = 'scales.progress.visited';

/**
 * First-run checklist for the activation path:
 * add a book -> log a tempo -> review progress.
 * Hidden once dismissed or complete; never blocks the practice UI.
 */
const OnboardingChecklist: React.FC = () => {
  const { documents, mappingsByDocument } = useRepertoire();
  const { log } = useScales();
  const [dismissed, setDismissed] = useState(false);
  const [visitedProgress, setVisitedProgress] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
      setVisitedProgress(localStorage.getItem(PROGRESS_VISITED_KEY) === '1');
    } catch {
      // storage unavailable — show the checklist
    }
  }, []);

  const hasMappings = useMemo(
    () => Object.values(mappingsByDocument).some((list) => list.length > 0),
    [mappingsByDocument],
  );

  const steps = useMemo(
    () => [
      {
        label: 'Add a method book',
        hint: 'Upload a Hanon or Dohnányi PDF',
        done: documents.length > 0,
        href: '/reader',
      },
      {
        label: 'Map a page',
        hint: 'Link a page to an exercise',
        done: hasMappings,
        href: '/reader',
      },
      {
        label: 'Log your first tempo',
        hint: 'Save a BPM snapshot',
        done: (log?.length ?? 0) > 0,
        href: null,
      },
      {
        label: 'Review your progress',
        hint: 'See the chart move',
        done: visitedProgress,
        href: '/progress',
      },
    ],
    [documents.length, hasMappings, log?.length, visitedProgress],
  );

  const done = steps.filter((step) => step.done).length;
  const complete = done === steps.length;

  useEffect(() => {
    if (!complete) return;
    try {
      if (localStorage.getItem(COMPLETE_KEY)) return;
      localStorage.setItem(COMPLETE_KEY, '1');
    } catch {
      // still track once per session
    }
    track('onboarding_complete');
  }, [complete]);

  if (!mounted || dismissed || complete) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
  };

  const startPractice = () => {
    document.getElementById('practice-modes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section aria-label="Getting started" className="surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
            Getting started
          </p>
          <p className="mt-1 text-sm font-bold tracking-tight">Four steps to your first chart</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="tnum text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {done}/{steps.length}
          </span>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss getting started"
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${(done / steps.length) * 100}%` }}
        />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => {
          const body = (
            <div
              className={cn(
                'flex h-full items-start gap-2.5 rounded-xl border p-3 transition-colors',
                step.done
                  ? 'border-success/25 bg-success/[0.06]'
                  : 'border-border/60 bg-muted/20 hover:border-primary/35 hover:bg-primary/[0.04]',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black',
                  step.done ? 'bg-success/15 text-success' : 'bg-primary/10 text-primary',
                )}
              >
                {step.done ? <Check className="size-3" /> : index + 1}
              </span>
              <div className="min-w-0">
                <p
                  className={cn(
                    'text-xs font-bold leading-snug',
                    step.done ? 'text-muted-foreground' : 'text-foreground',
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                  {step.done ? 'Done' : step.hint}
                </p>
              </div>
              {!step.done && <ArrowRight className="ml-auto mt-0.5 size-3.5 shrink-0 text-muted-foreground/50" />}
            </div>
          );

          if (step.done) return <div key={step.label}>{body}</div>;

          if (step.href) {
            return (
              <Link key={step.label} to={step.href} className="block h-full">
                {body}
              </Link>
            );
          }

          return (
            <button key={step.label} type="button" onClick={startPractice} className="block h-full text-left">
              {body}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default OnboardingChecklist;