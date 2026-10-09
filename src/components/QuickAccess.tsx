import React from 'react';
import { Music, Activity, Dumbbell, Sparkles, BookOpen, FileText, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type QuickTarget = 'scales' | 'arpeggios' | 'hanon' | 'dohnanyi' | 'reader';

interface QuickCard {
  target: QuickTarget;
  label: string;
  hint: string;
  icon: LucideIcon;
  gradient: string;
  ring: string;
  badgeKey?: 'hanon' | 'dohnanyi';
}

const CARDS: QuickCard[] = [
  {
    target: 'scales',
    label: 'Scales',
    hint: 'Major, minor & chromatic',
    icon: Music,
    gradient: 'from-indigo-500 to-blue-500',
    ring: 'group-hover:ring-indigo-500/40',
  },
  {
    target: 'arpeggios',
    label: 'Arpeggios',
    hint: 'Triads, 7ths & more',
    icon: Activity,
    gradient: 'from-violet-500 to-fuchsia-500',
    ring: 'group-hover:ring-violet-500/40',
  },
  {
    target: 'hanon',
    label: 'Hanon',
    hint: '60 finger exercises',
    icon: Dumbbell,
    gradient: 'from-amber-500 to-orange-500',
    ring: 'group-hover:ring-amber-500/40',
    badgeKey: 'hanon',
  },
  {
    target: 'dohnanyi',
    label: 'Dohnányi',
    hint: 'Essential finger exercises',
    icon: Sparkles,
    gradient: 'from-cyan-500 to-sky-500',
    ring: 'group-hover:ring-cyan-500/40',
    badgeKey: 'dohnanyi',
  },
  {
    target: 'reader',
    label: 'Reader',
    hint: 'Your method-book PDFs',
    icon: BookOpen,
    gradient: 'from-emerald-500 to-teal-500',
    ring: 'group-hover:ring-emerald-500/40',
  },
];

interface QuickAccessProps {
  onSelect: (target: QuickTarget) => void;
  activeTarget?: QuickTarget;
  pdfSources: { hanon: boolean; dohnanyi: boolean };
}

const QuickAccess: React.FC<QuickAccessProps> = ({ onSelect, activeTarget, pdfSources }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
    {CARDS.map((card) => {
      const Icon = card.icon;
      const hasPdf = card.badgeKey ? pdfSources[card.badgeKey] : false;
      const isActive = activeTarget === card.target;
      return (
        <button
          key={card.target}
          type="button"
          onClick={() => onSelect(card.target)}
          className={cn(
            'group relative flex min-h-[104px] flex-col items-start justify-between gap-3 rounded-2xl border bg-card/60 p-4 text-left shadow-sm transition-all',
            'hover:shadow-md hover:border-primary/30 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            isActive ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border',
          )}
        >
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ring-2 ring-transparent transition-all',
              card.gradient,
              card.ring,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-bold leading-tight">{card.label}</p>
            <p className="text-[11px] leading-tight text-muted-foreground">{card.hint}</p>
          </div>
          {hasPdf && (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary">
              <FileText className="h-2.5 w-2.5" />
              PDF
            </span>
          )}
        </button>
      );
    })}
  </div>
);

export default QuickAccess;
