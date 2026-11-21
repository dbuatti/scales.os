import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/alert-dialog';
import { useScales } from '@/context/ScalesContext';
import { showError, showSuccess } from '@/utils/toast';

/** Shared by the desktop and mobile settings surfaces. */
const ClearPracticeDataButton: React.FC = () => {
  const { clearAllLogs, clearExerciseMastery, clearScaleMastery } = useScales();
  const [busy, setBusy] = useState(false);

  const handleClearAllData = async () => {
    setBusy(true);
    try {
      await clearAllLogs();
      await clearExerciseMastery();
      await clearScaleMastery();
      showSuccess('All practice data cleared.');
    } catch {
      showError('Could not clear all practice data. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={busy} className="w-full font-bold">
          <Trash2 className="mr-2 size-4" />
          Clear all practice data
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear all practice data?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all logs, scale mastery, and exercise progress.
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={() => void handleClearAllData()}
            className="bg-destructive font-bold text-destructive-foreground hover:bg-destructive/90"
          >
            {busy ? 'Clearing…' : 'Delete everything'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ClearPracticeDataButton;
