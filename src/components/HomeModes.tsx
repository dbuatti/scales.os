import React from 'react';
import { Music, Activity, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type HomeMode = 'scales' | 'arpeggios';

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
    tone: 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/10',
  },
  {
    id: 'arpeggios',
    label: 'Arpeggios',
    hint: 'Triads, 7ths & more',
    icon: Activity,
    tone: 'bg-accent/10 text-accent ring-1 ring-inset ring-accent/15',
  },
];

interface HomeModesProps {
  active: HomeMode | null;
  onSelect: (mode: HomeMode) => void;
}

const HomeModes: React.FC<HomeModesProps> = ({ active, onSelect }) => (
  <div className="grid grid-cols-2 gap-3">
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
            'group relative flex flex-col items-center gap-2 p-3 text-center animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300 sm:flex-row sm:gap-4 sm:p-4 sm:text-left border border-border/40',
            'transition-colors duration-150 active:scale-[0.99]',
            isActive ? 'border-primary/40 bg-primary/[0.04]' : 'hover:bg-muted/40',
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
        </button>
      );
    })}
  </div>
);

export default HomeModes;
