import React from 'react';
import { Music, Activity, LucideIcon } from 'lucide-react';
import { cn, getFolderTone } from '@/lib/utils';

export type HomeMode = 'scales' | 'arpeggios';

interface ModeCard {
  id: HomeMode;
  family: 'scale' | 'arpeggio';
  label: string;
  hint: string;
  icon: LucideIcon;
}

const MODES: ModeCard[] = [
  {
    id: 'scales',
    family: 'scale',
    label: 'Scales',
    hint: 'Major, minor & chromatic',
    icon: Music,
  },
  {
    id: 'arpeggios',
    family: 'arpeggio',
    label: 'Arpeggios',
    hint: 'Triads, 7ths & more',
    icon: Activity,
  },
];

interface HomeModesProps {
  active: HomeMode | null;
  onSelect: (mode: HomeMode) => void;
}

/** Exercise family selector: one compact segmented control, no folder chrome. */
const HomeModes: React.FC<HomeModesProps> = ({ active, onSelect }) => (
  <div role="tablist" aria-label="Exercise family" className="flex w-full gap-2">
    {MODES.map((mode) => {
      const isActive = active === mode.id;
      const tone = getFolderTone(mode.family);
      const Icon = mode.icon;

      return (
        <button
          key={mode.id}
          type="button"
          role="tab"
          aria-selected={isActive}
          onClick={() => onSelect(mode.id)}
          className={cn(
            'group flex min-w-0 flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-left shadow-sm transition-all duration-200 active:scale-[0.99] focus-scale',
            isActive
              ? cn(tone.solid, 'border-transparent text-white shadow-md')
              : 'border-border/60 bg-background text-muted-foreground hover:border-primary/30 hover:bg-muted/50 hover:text-foreground',
          )}
        >
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105',
              isActive ? 'bg-white/15' : 'bg-muted',
            )}
          >
            <Icon className="size-4 sm:size-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-black tracking-tight sm:text-base">
              {mode.label}
            </span>
            <span
              className={cn(
                'hidden truncate text-[10px] font-bold uppercase tracking-widest sm:block',
                isActive ? 'text-white/75' : 'text-muted-foreground',
              )}
            >
              {mode.hint}
            </span>
          </span>
        </button>
      );
    })}
  </div>
);

export default HomeModes;
