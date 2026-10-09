"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { MIN_BPM, MAX_BPM } from '@/lib/scales';
import PracticeTimer from './PracticeTimer';
import Metronome from './Metronome';

interface HeaderControlsProps {
  currentBPM: number;
  onBpmChange: (delta: number) => void;
  onLogSession: (durationMinutes: number) => void;
}

const HeaderControls: React.FC<HeaderControlsProps> = ({ currentBPM, onBpmChange, onLogSession }) => {
  return (
    <div className="flex items-center space-x-2 sm:space-x-4">
      {/* 1. BPM Controls */}
      <div className="flex items-center rounded-lg border bg-card/50 p-0.5">
        <Button 
          onClick={() => onBpmChange(-1)} 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors duration-150"
          disabled={currentBPM <= MIN_BPM}
        >
          <Minus className="w-4 h-4" />
        </Button>
        <div className="min-w-[44px] px-1 text-center text-lg font-bold tabular-nums text-foreground">
          {currentBPM}
        </div>
        <Button 
          onClick={() => onBpmChange(1)} 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors duration-150"
          disabled={currentBPM >= MAX_BPM}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      {/* 2. Metronome */}
      <Metronome />

      {/* 3. Timer (Condensed) */}
      <div className="hidden md:block">
        <PracticeTimer onLogSession={onLogSession} isCondensed={true} />
      </div>
    </div>
  );
};

export default HeaderControls;