"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Music, Clock, Fingerprint, TrendingUp, Settings2, Zap, ZapOff, Hash, Bell, BellOff } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';

interface MetronomeProps {
  bpm: number;
  onBpmChange?: (newBpm: number) => void;
}

type NoteDivision = 'quarter' | 'eighth';

const Metronome: React.FC<MetronomeProps> = ({ bpm, onBpmChange }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [visualFlashEnabled, setVisualFlashEnabled] = useState(false);
  const [accentEnabled, setAccentEnabled] = useState(true);
  const [division, setDivision] = useState<NoteDivision>('quarter');
  const [isBeatActive, setIsBeatActive] = useState(false);
  const [isAccentBeat, setIsAccentBeat] = useState(false);
  const [pendulumPos, setPendulumPos] = useState(0);
  const [currentMeasure, setCurrentMeasure] = useState(0);
  
  // Auto-increment states
  const [autoIncrementEnabled, setAutoIncrementEnabled] = useState(false);
  const [incrementAmount, setIncrementAmount] = useState(1);
  const [incrementEvery, setIncrementEvery] = useState(4); // measures
  const measuresCountRef = useRef(0);

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

    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(context.destination);

    const frequency = (isAccent && accentEnabled) ? 1000 : 800; 
    const baseVolume = (isAccent && accentEnabled) ? volume : volume * 0.7;
    const duration = 0.03;

    osc.frequency.setValueAtTime(frequency, time);
    gain.gain.setValueAtTime(baseVolume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.start(time);
    osc.stop(time + duration);
  }, [isMuted, initAudioContext, volume, accentEnabled]);

  const scheduler = useCallback(() => {
    const context = audioContextRef.current;
    if (!context) return;

    const secondsPerBeat = 60.0 / bpm;
    const interval = division === 'quarter' ? secondsPerBeat : secondsPerBeat / 2;

    while (nextNoteTimeRef.current < context.currentTime + scheduleAheadTime) {
      const beatsPerMeasure = division === 'quarter' ? 4 : 8;
      const beatIndex = currentBeatRef.current % beatsPerMeasure;
      const isAccent = beatIndex === 0;

      if (isAccent && currentBeatRef.current > 0) {
        measuresCountRef.current++;
        setCurrentMeasure(measuresCountRef.current);
        
        if (autoIncrementEnabled && measuresCountRef.current % incrementEvery === 0) {
          if (onBpmChange) {
            onBpmChange(bpm + incrementAmount);
          }
        }
      }

      playClick(nextNoteTimeRef.current, isAccent);
      
      setIsBeatActive(true);
      setIsAccentBeat(isAccent);
      setPendulumPos(prev => prev === 1 ? -1 : 1);
      
      setTimeout(() => setIsBeatActive(false), 100);

      currentBeatRef.current++;
      nextNoteTimeRef.current += interval;
    }
    
    timerRef.current = window.setTimeout(scheduler, lookahead);
  }, [bpm, division, playClick, scheduleAheadTime, lookahead, autoIncrementEnabled, incrementAmount, incrementEvery, onBpmChange]);

  useEffect(() => {
    if (isRunning) {
      const context = initAudioContext();
      currentBeatRef.current = 0;
      measuresCountRef.current = 0;
      setCurrentMeasure(0);
      nextNoteTimeRef.current = context.currentTime;
      timerRef.current = window.setTimeout(scheduler, lookahead);
    } else {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      currentBeatRef.current = 0;
      measuresCountRef.current = 0;
      setCurrentMeasure(0);
      setIsBeatActive(false);
      setIsAccentBeat(false);
      setPendulumPos(0);
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

  const handleTap = useCallback(() => {
    const now = Date.now();
    const timeout = 2000;

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
  }, [onBpmChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleRun();
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setIsMuted(prev => !prev);
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleTap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleRun, handleTap]);

  return (
    <div className="flex items-center space-x-4">
      {/* Visual Flash Overlay */}
      {isRunning && visualFlashEnabled && isBeatActive && (
        <div className={cn(
          "fixed inset-0 pointer-events-none z-[100] transition-opacity duration-100",
          (isAccentBeat && accentEnabled) ? "bg-warning/10" : "bg-primary/5"
        )} />
      )}

      <Button 
        onClick={handleToggleRun} 
        size="lg" 
        className={cn(
          "w-24 font-bold transition-all text-sm shadow-lg focus-scale",
          isRunning 
            ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" 
            : "bg-primary hover:bg-primary/90 text-primary-foreground"
        )}
      >
        {isRunning ? 'STOP' : 'START'}
      </Button>
      
      <div className="flex items-center gap-1">
        <Button 
          onClick={handleTap}
          variant="outline"
          size="sm"
          className="font-bold text-xs border-primary/20 text-primary hover:bg-primary/5 focus-scale"
        >
          <Fingerprint className="w-3 h-3 mr-1.5" /> TAP
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "font-bold text-xs border-primary/20 focus-scale",
                (autoIncrementEnabled || visualFlashEnabled || !accentEnabled) && "bg-primary/10 text-primary border-primary/40"
              )}
            >
              <Settings2 className="w-3 h-3 mr-1.5" /> SETTINGS
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4 space-y-6 font-mono">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-widest">Volume</Label>
                <span className="text-[10px] font-bold text-muted-foreground">{Math.round(volume * 100)}%</span>
              </div>
              <div className="flex items-center gap-4">
                <VolumeX className="w-4 h-4 text-muted-foreground" />
                <Slider 
                  value={[volume * 100]} 
                  onValueChange={([v]) => setVolume(v / 100)} 
                  max={100} 
                  step={1} 
                  className="flex-1"
                />
                <Volume2 className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Visual Flash</Label>
                <Button 
                  variant={visualFlashEnabled ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setVisualFlashEnabled(!visualFlashEnabled)}
                  className="w-full h-9"
                >
                  {visualFlashEnabled ? <Zap className="w-3 h-3 mr-2" /> : <ZapOff className="w-3 h-3 mr-2" />}
                  {visualFlashEnabled ? "ON" : "OFF"}
                </Button>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Accent Beat 1</Label>
                <Button 
                  variant={accentEnabled ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setAccentEnabled(!accentEnabled)}
                  className="w-full h-9"
                >
                  {accentEnabled ? <Bell className="w-3 h-3 mr-2" /> : <BellOff className="w-3 h-3 mr-2" />}
                  {accentEnabled ? "ON" : "OFF"}
                </Button>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold uppercase tracking-widest">Auto-Increment</Label>
                  <p className="text-[10px] text-muted-foreground">Increase BPM over time</p>
                </div>
                <Button 
                  variant={autoIncrementEnabled ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setAutoIncrementEnabled(!autoIncrementEnabled)}
                  className="h-7 text-[10px] px-2"
                >
                  {autoIncrementEnabled ? "ON" : "OFF"}
                </Button>
              </div>
              
              {autoIncrementEnabled && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-[10px] text-muted-foreground">Increase by (BPM)</Label>
                    <Input 
                      type="number" 
                      value={incrementAmount} 
                      onChange={(e) => setIncrementAmount(Number(e.target.value))}
                      className="w-16 h-8 text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-[10px] text-muted-foreground">Every (Measures)</Label>
                    <Input 
                      type="number" 
                      value={incrementEvery} 
                      onChange={(e) => setIncrementEvery(Number(e.target.value))}
                      className="w-16 h-8 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Button 
        onClick={() => setIsMuted(prev => !prev)} 
        variant="ghost" 
        size="icon"
        className="text-primary hover:bg-primary/10 focus-scale"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </Button>
      
      <ToggleGroup 
        type="single" 
        value={division} 
        onValueChange={(value) => value && setDivision(value as NoteDivision)}
        className="bg-muted/50 rounded-lg p-1 flex-shrink-0 border border-primary/10"
      >
        <ToggleGroupItem 
          value="quarter" 
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-[10px] font-bold h-8 px-3 focus-scale"
        >
          <Clock className="w-3 h-3 mr-1.5" /> 1/4
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="eighth" 
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-[10px] font-bold h-8 px-3 focus-scale"
        >
          <Music className="w-3 h-3 mr-1.5" /> 1/8
        </ToggleGroupItem>
      </ToggleGroup>
      
      <div 
        className={cn(
          "w-12 h-12 rounded-xl transition-all duration-150 flex-shrink-0 border-2 border-primary/10 flex items-center justify-center relative overflow-hidden",
          isRunning ? "bg-muted/10" : "bg-muted/20"
        )}
      >
        {isRunning && (
          <div className="absolute top-1 right-1 flex items-center gap-0.5 text-[8px] font-black text-primary/40">
            <Hash className="w-2 h-2" />
            {currentMeasure}
          </div>
        )}
        
        <div 
          className={cn(
            "absolute bottom-0 w-1 bg-primary/20 transition-transform duration-150 origin-bottom",
            isRunning ? "h-full" : "h-0"
          )}
          style={{ transform: `rotate(${pendulumPos * 30}deg)` }}
        />
        
        <div className={cn(
            "w-3 h-3 rounded-full transition-all duration-100 z-10",
            isRunning && isBeatActive 
              ? (isAccentBeat && accentEnabled)
                ? "bg-warning scale-150 shadow-[0_0_15px_hsl(var(--warning))]" 
                : "bg-primary scale-125 shadow-[0_0_10px_hsl(var(--primary))]" 
              : "bg-muted-foreground/20"
        )} />
      </div>
    </div>
  );
};

export default Metronome;