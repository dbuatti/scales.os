import React from 'react';
import { Music, Activity, BookOpen, ChevronRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type HomeMode = 'scales' | 'arpeggios' | 'technical';

interface ModeCard {
  id: HomeMode;
  label: string;
  hint: string;
  icon: LucideIcon;
  tone: string;
}

const MODES: ModeCard[] = [
  {
    id: 'scales',
    label: 'Scales',
    hint: 'Major, minor & chromatic',
    icon: Music,
    tone: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'arpeggios',
    label: 'Arpeggios',
    hint: 'Triads, 7ths & more',
    icon: Activity,
    tone: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  {
    id: 'technical',
    label: 'Technical',
    hint: 'Your PDF method books',
    icon: BookOpen,
    tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
];

interface HomeModesProps {
  active: HomeMode | null;
  onSelect: (mode: HomeMode) => void;
}

const HomeModes: React.FC<HomeModesProps> = ({ active, onSelect }) => (
  <div className="grid grid-cols-3 gap-3">
    {MODES.map((mode, index) => {
      const Icon = mode.icon;
      const isActive = active === mode.id;
      return (
        <button
          key={mode.id}
          type="button"
          onClick={() => onSelect(mode.id)}
          aria-pressed={isActive}
          style={{ animationDelay: `${index * 60}ms` }}
          className={cn(
            'group relative flex flex-col items-center gap-2 overflow-hidden surface p-3 text-center animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300 sm:flex-row sm:gap-4 sm:p-5 sm:text-left',
            'transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 active:translate-y-0 active:scale-[0.99]',
            isActive ? 'border-primary/40 bg-primary/[0.04] ring-1 ring-primary/20' : 'border-border/50',
          )}
        >
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105 sm:h-12 sm:w-12 sm:rounded-xl',
              mode.tone,
            )}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>
          <span className="min-w-0 sm:flex-1">
            <span className="block text-sm font-bold tracking-tight sm:text-base">{mode.label}</span>
            <span className="hidden truncate text-xs text-muted-foreground sm:block">{mode.hint}</span>
          </span>
          <ChevronRight className="hidden h-4 w-4 shrink-0 sm:block text-muted-foreground/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
        </button>
      );
    })}
  </div>
);

export default HomeModes;
