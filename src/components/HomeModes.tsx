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
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
    {MODES.map((mode) => {
      const Icon = mode.icon;
      const isActive = active === mode.id;
      return (
        <button
          key={mode.id}
          type="button"
          onClick={() => onSelect(mode.id)}
          aria-pressed={isActive}
          className={cn(
            'group relative flex items-center gap-4 overflow-hidden surface p-5 text-left',
            'transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 active:translate-y-0 active:scale-[0.99]',
            isActive ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border/50',
          )}
        >
          <span
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105',
              mode.tone,
            )}
          >
            <Icon className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-bold tracking-tight">{mode.label}</span>
            <span className="block truncate text-xs text-muted-foreground">{mode.hint}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
        </button>
      );
    })}
  </div>
);

export default HomeModes;
