import React from 'react';
import { Check, Monitor, Moon, Palette, Sun, Terminal } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useZenMode } from '@/context/ZenModeContext';
import { cn } from '@/lib/utils';

interface MobileSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const THEMES = [
  { value: 'system', label: 'System', hint: 'Follow your device', icon: Monitor },
  { value: 'light', label: 'Light', hint: 'Warm paper', icon: Sun },
  { value: 'dark', label: 'Dark', hint: 'Low light', icon: Moon },
  { value: 'soft-focus', label: 'Soft focus', hint: 'Lower contrast', icon: Palette },
  { value: 'retro-terminal', label: 'Retro terminal', hint: 'Green on black', icon: Terminal },
];

const MobileSettingsSheet: React.FC<MobileSettingsSheetProps> = ({ open, onOpenChange }) => {
  const { theme, setTheme } = useTheme();
  const { isZenMode, toggleZenMode } = useZenMode();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <SheetHeader className="text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Settings</p>
          <SheetTitle className="font-display text-2xl tracking-tight">Make it yours</SheetTitle>
          <SheetDescription className="text-sm">
            Appearance and focus options. Practice data is unaffected.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Appearance</p>
          {THEMES.map((option) => {
            const Icon = option.icon;
            const active = (theme ?? 'system') === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                aria-pressed={active}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                  active
                    ? 'border-primary/40 bg-primary/[0.06]'
                    : 'border-border/60 bg-muted/20 hover:border-primary/25',
                )}
              >
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-lg',
                    active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-tight">{option.label}</span>
                  <span className="block text-[10px] text-muted-foreground">{option.hint}</span>
                </span>
                {active && <Check className="size-4 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-border/60 pt-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">Zen mode</p>
            <p className="text-[10px] text-muted-foreground">Hide the chrome and focus on the keys.</p>
          </div>
          <Button
            type="button"
            variant={isZenMode ? 'default' : 'outline'}
            size="sm"
            onClick={toggleZenMode}
            className="shrink-0 font-bold"
          >
            {isZenMode ? 'On' : 'Off'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileSettingsSheet;