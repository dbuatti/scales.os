"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Music, Clock, Fingerprint } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

interface MetronomeProps {
  bpm: number;
  onBpmChange?: (newBpm: number) => void;
}

type NoteDivision = 'quarter' | 'eighth';

const Metronome: React.FC<MetronomeProps> = ({ bpm, onBpmChange }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [division, setDivision] = useState<NoteDivision>('quarter');
  const [isBeatActive, setIsBeatActive] = useState(false);
  const [isAccentBeat, setIsAccentBeat] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);
  const currentBeatRef = useRef(0);
  const tapTimesRef = useRef<number[]>([]);
  
  const lookahead = 25.0;
  const scheduleAheadTime = 0.1;

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playClick = useCallback((time: number, isAccent: boolean) => {
    if (isMuted) return;

    const context = initAudioContext();
    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.connect(gain);
    gain.connect(context.destination);

    const frequency = isAccent ? 880 : 440;
    const volume = isAccent ? 0.8 : 0.5;
    const duration = 0.025;

    osc.frequency.setValueAtTime(frequency, time);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.start(time);
    osc.stop(time + duration);
  }, [isMuted, initAudioContext]);

  const scheduler = useCallback(() => {
    const context = audioContextRef.current;
    if (!context) return;

    const secondsPerBeat = 60.0 / bpm;
    const interval = division === 'quarter' ? secondsPerBeat : secondsPerBeat / 2;

    while (nextNoteTimeRef.current < context.currentTime + scheduleAheadTime) {
      const beatIndex = currentBeatRef.current % (division === 'quarter' ? 4 : 8);
      const isAccent = beatIndex === 0;

      playClick(nextNoteTimeRef.current, isAccent);
      
      setIsBeatActive(true);
      setIsAccentBeat(isAccent);
      setTimeout(() => setIsBeatActive(false), 100);

      currentBeatRef.current++;
      nextNoteTimeRef.current += interval;
    }
    
    timerRef.current = window.setTimeout(scheduler, lookahead);
  }, [bpm, division, playClick, scheduleAheadTime, lookahead]);

  useEffect(() => {
    if (isRunning) {
      const context = initAudioContext();
      currentBeatRef.current = 0;
      nextNoteTimeRef.current = context.currentTime;
      timerRef.current = window.setTimeout(scheduler, lookahead);
    } else {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      currentBeatRef.current = 0;
      setIsBeatActive(false);
      setIsAccentBeat(false);
    }

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, scheduler, initAudioContext, lookahead]);

  const handleToggleRun = useCallback(() => {
    if (!isRunning) {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    }
    setIsRunning(prev => !prev);
  }, [isRunning]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleRun();
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setIsMuted(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleRun]);

  const handleTap = () => {
    const now = Date.now();
    const timeout = 2000; // Reset taps after 2 seconds of inactivity

    if (tapTimesRef.current.length > 0 && now - tapTimesRef.current[tapTimesRef.current.length - 1] > timeout) {
      tapTimesRef.current = [];
    }

    tapTimesRef.current.push(now);

    if (tapTimesRef.current.length > 1) {
      const intervals = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
      const newBpm = Math.round(60000 / avgInterval);
      if (onBpmChange) {
        onBpmChange(newBpm);
      }
    }

    if (tapTimesRef.current.length > 4) {
      tapTimesRef.current.shift();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Button 
        onClick={handleToggleRun} 
        size="sm" 
        className={cn(
          "w-20 font-mono transition-all text-lg font-bold shadow-lg",
          isRunning 
            ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-destructive/20" 
            : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20"
        )}
      >
        {isRunning ? 'STOP' : 'START'}
      </Button>
      
      <Button 
        onClick={handleTap}
        variant="outline"
        size="sm"
        className="font-mono text-xs border-primary/50 text-primary hover:bg-primary/10"
      >
        <Fingerprint className="w-3 h-3 mr-1" /> TAP
      </Button>

      <Button 
        onClick={() => setIsMuted(prev => !prev)} 
        variant="ghost" 
        size="icon"
        className="text-primary hover:bg-primary/20"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </Button>
      
      <ToggleGroup 
        type="single" 
        value={division} 
        onValueChange={(value) => value && setDivision(value as NoteDivision)}
        className="bg-secondary/50 rounded-md p-1 flex-shrink-0 border border-primary/20"
      >
        <ToggleGroupItem 
          value="quarter" 
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs h-8 px-2 font-mono"
        >
          <Clock className="w-4 h-4 mr-1" /> 1/4
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="eighth" 
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs h-8 px-2 font-mono"
        >
          <Music className="w-4 h-4 mr-1" /> 1/8
        </ToggleGroupItem>
      </ToggleGroup>
      
      <div 
        className={cn(
          "w-8 h-8 rounded-full transition-all duration-100 flex-shrink-0 border-2 border-primary/20",
          isRunning && isBeatActive
            ? isAccentBeat
              ? "bg-warning shadow-[0_0_15px_hsl(var(--warning))] scale-125 border-warning"
              : "bg-primary shadow-[0_0_15px_hsl(var(--primary))] scale-110 border-primary"
            : "bg-muted-foreground/10"
        )}
      />
    </div>
  );
};

export default Metronome;