"use client";

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard, Command } from 'lucide-react';

const ShortcutItem = ({ keys, description }: { keys: string[], description: string }) => (
  <div className="flex items-center justify-between gap-4 py-2.5 border-b last:border-0">
    <span className="text-sm text-muted-foreground">{description}</span>
    <div className="flex shrink-0 gap-1">
      {keys.map((key) => (
        <kbd key={key} className="min-w-[28px] rounded-md border bg-muted px-2 py-1 text-center text-xs font-semibold shadow-sm">
          {key}
        </kbd>
      ))}
    </div>
  </div>
);

const KeyboardShortcuts = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary focus-scale">
          <Keyboard className="h-5 w-5" />
          <span className="sr-only">Keyboard shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Available while practicing — shortcuts are disabled when typing in a field.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1 pt-2">
          <ShortcutItem keys={["Space"]} description="Start / stop metronome" />
          <ShortcutItem keys={["↑"]} description="Increase BPM" />
          <ShortcutItem keys={["↓"]} description="Decrease BPM" />
          <ShortcutItem keys={["M"]} description="Mute / unmute metronome" />
          <ShortcutItem keys={["Enter", "S"]} description="Save practice snapshot" />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcuts;
