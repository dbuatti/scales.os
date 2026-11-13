import React, { useState } from 'react';
import { Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useInstallPrompt } from '@/hooks/use-install-prompt';

const InstallAppButton: React.FC = () => {
  const { canInstall, isIos, isStandalone, promptInstall } = useInstallPrompt();
  const [iosOpen, setIosOpen] = useState(false);

  if (isStandalone || (!canInstall && !isIos)) return null;

  const onClick = async () => {
    if (canInstall) {
      await promptInstall();
      return;
    }
    setIosOpen(true);
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClick}
        className="h-7 gap-1.5 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <Download className="size-3.5" />
        Install app
      </Button>

      <Dialog open={iosOpen} onOpenChange={setIosOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl tracking-tight">
              Install Scales on your iPad
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Add it to your Home Screen for a full-screen, offline-friendly practice app.
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm">
            {[
              { icon: Share, text: 'Tap the Share button in Safari.' },
              { icon: Download, text: 'Scroll down and tap “Add to Home Screen”.' },
              { icon: Download, text: 'Tap Add — Scales opens like a native app.' },
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.text} className="flex items-start gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-black text-primary">
                    {index + 1}
                  </span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="size-4 shrink-0 text-primary/70" />
                    {step.text}
                  </span>
                </li>
              );
            })}
          </ol>
          <DialogFooter>
            <Button onClick={() => setIosOpen(false)} className="w-full font-bold">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstallAppButton;