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
import { useZenMode } from '@/context/ZenModeContext';
import { useScales } from '@/context/ScalesContext';
import { Trash2 } from 'lucide-react';
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

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onOpenChange }) => {
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
            Focus options. Practice data is unaffected.
          </DialogDescription>
        </DialogHeader>
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