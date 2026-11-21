import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { clearPDFCache } from '@/lib/pdf-cache';
import { showError, showSuccess } from '@/utils/toast';

const CONFIRMATION_WORD = 'DELETE';

interface DeleteAccountButtonProps {
  /** Lets the containing sheet close itself before we navigate away. */
  onDeleted?: () => void;
}

/**
 * Self-serve deletion of Scales data. The shared sign-in is intentionally kept:
 * this app's Supabase project is also used by another app.
 */
const DeleteAccountButton: React.FC<DeleteAccountButtonProps> = ({ onDeleted }) => {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const canDelete = confirmation.trim().toUpperCase() === CONFIRMATION_WORD && !busy;

  const setOpenSafely = (next: boolean) => {
    if (!next) setConfirmation('');
    setOpen(next);
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    setBusy(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      const { error } = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) {
        let message = error.message;
        if (error instanceof FunctionsHttpError) {
          try {
            const details = (await error.context.json()) as { error?: string };
            if (details.error) message = details.error;
          } catch {
            // Keep the default message if the function did not return JSON.
          }
        }
        throw new Error(message);
      }

      // Offline PDFs live in IndexedDB, outside the server-side deletion.
      try {
        await clearPDFCache();
      } catch {
        // A missing/blocked IndexedDB is not a reason to fail the whole deletion.
      }

      queryClient.clear();
      await supabase.auth.signOut();
      setOpenSafely(false);
      onDeleted?.();
      showSuccess('Your Scales data has been deleted.');
      navigate('/', { replace: true });
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : 'Could not delete your Scales data. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpenSafely}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="w-full font-bold">
          <Trash2 className="mr-2 size-4" />
          Delete my Scales account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your Scales account?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                This permanently removes your practice history, uploaded method books,
                page mappings and Pro access from Scales. It cannot be undone.
              </p>
              <p className="font-semibold text-foreground">
                Your sign-in is shared with another app, so the login itself is not
                deleted. You can keep using it elsewhere.
              </p>
              <p>
                Type <span className="font-bold text-foreground">DELETE</span> to confirm.
              </p>
              <Input
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder="DELETE"
                aria-label="Type DELETE to confirm"
                autoComplete="off"
                disabled={busy}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            disabled={!canDelete}
            onClick={() => void handleDelete()}
            className="bg-destructive font-bold text-destructive-foreground hover:bg-destructive/90"
          >
            {busy ? 'Deleting…' : 'Delete my Scales data'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountButton;
