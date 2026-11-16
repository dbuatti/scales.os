import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useZenMode } from '@/context/ZenModeContext';
import { useScales } from '@/context/ScalesContext';
import { Trash2 } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsSheet: React.FC<SettingsSheetProps> = ({ open, onOpenChange }) => {
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Settings</p>
          <SheetTitle className="font-display text-2xl tracking-tight">Make it yours</SheetTitle>
          <SheetDescription className="text-sm">
            Focus options. Practice data is unaffected.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 flex items-center justify-between gap-4 border-t border-border/60 pt-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">Zen mode</p>
            <p className="text-[10px] text-muted-foreground">Hide the chrome and focus on the keys.</p>
          </div>
          <Button type="button" variant={isZenMode ? 'default' : 'outline'} size="sm" onClick={toggleZenMode} className="shrink-0 font-bold">
            {isZenMode ? 'On' : 'Off'}
          </Button>
        </div>
        <div className="mt-6 space-y-2 border-t border-border/60 pt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Danger zone</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full font-bold text-left">
                <Trash2 className="size-4 mr-2" />
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
        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full font-bold">
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;