import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useZenMode } from '@/context/ZenModeContext';
import ClearPracticeDataButton from './ClearPracticeDataButton';
import DeleteAccountButton from './DeleteAccountButton';

interface MobileSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MobileSettingsSheet: React.FC<MobileSettingsSheetProps> = ({ open, onOpenChange }) => {
  const { isZenMode, toggleZenMode } = useZenMode();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <SheetHeader className="text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Settings</p>
          <SheetTitle className="font-display text-2xl tracking-tight">Make it yours</SheetTitle>
          <SheetDescription className="text-sm">
            Focus options. Practice data is unaffected.
          </SheetDescription>
        </SheetHeader>

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

        <div className="mt-6 space-y-2 border-t border-border/60 pt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Danger zone</p>
          <ClearPracticeDataButton />
          <div className="pt-3">
            <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
              Want everything gone instead? This also removes your method books and
              Pro access. Your shared sign-in stays active.
            </p>
            <DeleteAccountButton onDeleted={() => onOpenChange(false)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileSettingsSheet;