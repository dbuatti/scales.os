import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { MIN_BPM, MAX_BPM } from '@/lib/scales';
import PracticeTimer from './PracticeTimer';
import Metronome from './Metronome';
import { cn } from '@/lib/utils';

interface HeaderControlsProps {
  currentBPM: number;
  onBpmChange: (delta: number) => void;
  onLogSession: (durationMinutes: number) => void;
}

const HeaderControls: React.FC<HeaderControlsProps> = ({ currentBPM, onBpmChange, onLogSession }) => {
  return (
    <div className="flex items-center space-x-4">
      {/* 1. BPM Controls */}
      <div className="flex items-center space-x-1 border-2 border-primary/50 rounded-lg p-1 bg-secondary/50 shadow-inner shadow-primary/10">
        <Button 
          onClick={() => onBpmChange(-1)} 
          variant="ghost" 
          size="icon" 
          className={cn(
            "w-8 h-8 text-primary hover:bg-accent transition-colors duration-150",
            currentBPM <= MIN_BPM ? "opacity-50 cursor-not-allowed" : "hover:text-primary-foreground"
          )}
          disabled={currentBPM <= MIN_BPM}
        >
          <Minus className="w-4 h-4" />
        </Button>
        <div className="text-xl font-mono font-extrabold text-primary tracking-tighter min-w-[50px] text-center text-glow">
          {currentBPM}
        </div>
        <Button 
          onClick={() => onBpmChange(1)} 
          variant="ghost" 
          size="icon" 
          className={cn(
            "w-8 h-8 text-primary hover:bg-accent transition-colors duration-150",
            currentBPM >= MAX_BPM ? "opacity-50 cursor-not-allowed" : "hover:text-primary-foreground"
          )}
          disabled={currentBPM >= MAX_BPM}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      {/* 2. Metronome */}
      <Metronome bpm={currentBPM} />

      {/* 3. Timer (Condensed) */}
      <div className="hidden md:block">
        <PracticeTimer onLogSession={onLogSession} isCondensed={true} />
      </div>
    </div>
  );
};

export default HeaderControls;