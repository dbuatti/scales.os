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

/** Two manila-folder tabs. The active folder is a solid colour; the other stays as a pale tab. */
const HomeModes: React.FC<HomeModesProps> = ({ active, onSelect }) => (
  <div role="tablist" aria-label="Practice family" className="flex w-full">
    {MODES.map((mode, index) => {
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
          style={{ animationDelay: `${index * 60}ms` }}
          className={cn(
            'group relative flex min-w-0 flex-1 items-center gap-2 rounded-t-xl border border-b-0 border-white/15 px-4 pb-4 pt-3 text-left shadow-[0_-2px_0_hsl(0_0%_100%_/_0.06)] transition-all duration-200 active:scale-[0.99] focus-scale',
            isActive
              ? cn(tone.solid, 'text-folder-foreground')
              : 'bg-white/10 text-folder-foreground/90 hover:bg-white/20',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'absolute -top-2 left-4 h-2 w-16 rounded-t-md sm:w-20',
              isActive ? tone.solid : 'bg-white/25',
            )}
          />
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105',
              isActive ? 'bg-white/15' : tone.tint,
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
                isActive ? 'text-folder-foreground/75' : 'text-muted-foreground',
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
