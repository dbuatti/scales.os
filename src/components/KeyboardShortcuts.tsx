"use client";

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard, Command } from 'lucide-react';

const ShortcutItem = ({ keys, description }: { keys: string[], description: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-primary/10 last:border-0">
    <span className="text-sm text-muted-foreground font-mono">{description}</span>
    <div className="flex gap-1">
      {keys.map((key) => (
        <kbd key={key} className="px-2 py-1 text-xs font-bold bg-muted border rounded shadow-sm min-w-[24px] text-center">
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
          <span className="sr-only">Keyboard Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] font-mono">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="w-5 h-5" />
            System Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1 pt-4">
          <ShortcutItem keys={["Space"]} description="Start / Stop Metronome" />
          <ShortcutItem keys={["↑"]} description="Increase BPM" />
          <ShortcutItem keys={["↓"]} description="Decrease BPM" />
          <ShortcutItem keys={["M"]} description="Mute / Unmute Metronome" />
          <ShortcutItem keys={["Enter", "S"]} description="Save Practice Snapshot" />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcuts;