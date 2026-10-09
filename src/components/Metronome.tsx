"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Music, Clock, Fingerprint, Settings2, Zap, ZapOff, Hash } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { useMetronome } from '@/context/MetronomeContext';

interface MetronomeProps {
  showSettings?: boolean;
}

const Metronome: React.FC<MetronomeProps> = ({ showSettings = true }) => {
  const {
    isRunning,
    isMuted,
    volume,
    visualFlashEnabled,
    division,
    isBeatActive,
    isAccentBeat,
    currentMeasure,
    pendulumPos,
    autoIncrementEnabled,
    incrementAmount,
    incrementEvery,
    toggleRun,
    toggleMuted,
    setVolume,
    toggleVisualFlash,
    setDivision,
    setAutoIncrementEnabled,
    setIncrementAmount,
    setIncrementEvery,
    tapTempo,
  } = useMetronome();

  return (
    <div className="flex items-center space-x-4">
      <Button
        onClick={toggleRun}
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
          onClick={tapTempo}
          variant="outline"
          size="sm"
          className="h-10 font-bold text-xs border-primary/20 text-primary hover:bg-primary/5 focus-scale"
        >
          <Fingerprint className="w-3 h-3 mr-1.5" /> TAP
        </Button>

        {showSettings && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-10 font-bold text-xs border-primary/20 focus-scale",
                (autoIncrementEnabled || visualFlashEnabled) && "bg-primary/10 text-primary border-primary/40"
              )}
            >
              <Settings2 className="w-3 h-3 mr-1.5" /> SETTINGS
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4 space-y-6 text-sm">
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

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold uppercase tracking-widest">Visual Flash</Label>
                  <p className="text-[10px] text-muted-foreground">Flash screen on beat</p>
                </div>
                <Button
                  variant={visualFlashEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={toggleVisualFlash}
                  className="h-9 w-14 p-0"
                >
                  {visualFlashEnabled ? <Zap className="w-3 h-3" /> : <ZapOff className="w-3 h-3" />}
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
                  className="h-9 text-[10px] px-3"
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
                      className="w-16 h-9 text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-[10px] text-muted-foreground">Every (Measures)</Label>
                    <Input
                      type="number"
                      value={incrementEvery}
                      onChange={(e) => setIncrementEvery(Number(e.target.value))}
                      className="w-16 h-9 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        )}
      </div>

      <Button
        onClick={toggleMuted}
        variant="ghost"
        size="icon"
        className="h-10 w-10 text-primary hover:bg-primary/10 focus-scale"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </Button>

      <ToggleGroup
        type="single"
        value={division}
        onValueChange={(value) => value && setDivision(value as 'quarter' | 'eighth')}
        className="bg-muted/50 rounded-lg p-1 flex-shrink-0 border border-primary/10"
      >
        <ToggleGroupItem
          value="quarter"
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-[10px] font-bold h-10 px-3 focus-scale"
        >
          <Clock className="w-3 h-3 mr-1.5" /> 1/4
        </ToggleGroupItem>
        <ToggleGroupItem
          value="eighth"
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-[10px] font-bold h-10 px-3 focus-scale"
        >
          <Music className="w-3 h-3 mr-1.5" /> 1/8
        </ToggleGroupItem>
      </ToggleGroup>

      <div
        className={cn(
          "w-12 h-12 rounded-xl transition-all duration-150 flex-shrink-0 border border-primary/10 flex items-center justify-center relative overflow-hidden",
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
              ? isAccentBeat
                ? "bg-warning scale-150 shadow-[0_0_15px_hsl(var(--warning))]"
                : "bg-primary scale-125 shadow-[0_0_10px_hsl(var(--primary))]"
              : "bg-muted-foreground/20"
        )} />
      </div>
    </div>
  );
};

export default Metronome;
