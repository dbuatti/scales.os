import React from 'react';
import { Music, Activity, BookOpen, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type HomeMode = 'scales' | 'arpeggios' | 'technical';

interface ModeCard {
  id: HomeMode;
  label: string;
  hint: string;
  icon: LucideIcon;
  gradient: string;
}

const MODES: ModeCard[] = [
  {
    id: 'scales',
    label: 'Scales',
    hint: 'Major, minor & chromatic',
    icon: Music,
    gradient: 'from-indigo-500 to-blue-500',
  },
  {
    id: 'arpeggios',
    label: 'Arpeggios',
    hint: 'Triads, 7ths & more',
    icon: Activity,
    gradient: 'from-violet-500 to-fuchsia-500',
  },
  {
    id: 'technical',
    label: 'Technical',
    hint: 'Your PDF method books',
    icon: BookOpen,
    gradient: 'from-emerald-500 to-teal-500',
  },
];

interface HomeModesProps {
  active: HomeMode | null;
  onSelect: (mode: HomeMode) => void;
}

const HomeModes: React.FC<HomeModesProps> = ({ active, onSelect }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
    {MODES.map((mode) => {
      const Icon = mode.icon;
      const isActive = active === mode.id;
      return (
        <button
          key={mode.id}
          type="button"
          onClick={() => onSelect(mode.id)}
          className={cn(
            'group relative flex flex-col items-center justify-center gap-4 rounded-2xl border bg-card/60 p-8 text-center shadow-sm transition-all',
            'hover:shadow-md hover:border-primary/30 active:scale-[0.98]',
            isActive ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border',
          )}
        >
          <div
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md',
              mode.gradient,
            )}
          >
            <Icon className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-black">{mode.label}</p>
            <p className="text-xs text-muted-foreground">{mode.hint}</p>
          </div>
        </button>
      );
    })}
  </div>
);

export default HomeModes;
