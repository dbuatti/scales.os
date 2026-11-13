import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useZenMode } from '@/context/ZenModeContext';
import { useScales } from '@/context/ScalesContext';
import { cn } from '@/lib/utils';
import { Check, Monitor, Moon, Palette, Sun, Terminal, Trash2 } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const THEMES = [
  { value: 'system', label: 'System', hint: 'Follow your device', icon: Monitor },
  { value: 'light', label: 'Light', hint: 'Warm paper', icon: Sun },
  { value: 'dark', label: 'Dark', hint: 'Low light', icon: Moon },
  { value: 'soft-focus', label: 'Soft focus', hint: 'Lower contrast', icon: Palette },
  { value: 'retro-terminal', label: 'Retro terminal', hint: 'Green on black', icon: Terminal },
];

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onOpenChange }) => {
  const { theme, setTheme } = useTheme();
  const { isZenMode, toggleZenMode } = useZenMode();
  const { clearAllLogs, clearExerciseMastery, clearScaleMastery } = useScales();

  const handleClearAllData = async () => {
    await clearAllLogs();
    await clearExerciseMastery();
    await clearScaleMastery();
    showSuccess('All practice data cleared.');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Settings</p>
          <DialogTitle className="font-display text-2xl tracking-tight">Make it yours</DialogTitle>
          <DialogDescription className="text-sm">
            Appearance and focus options. Practice data is unaffected.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 space-y-2">
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
        <div className="mt-6 flex items-center justify-between gap-4 border-t border-border/60 pt-4">
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
        <div className="mt-6 space-y-2 border-t border-border/60 pt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Danger zone</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full font-bold text-left">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear all practice data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all practice data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all logs, scale mastery, and exercise progress. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAllData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold">
                  Delete everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full font-bold">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
