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
import { useGlobalBPM } from '@/context/GlobalBPMContext';
import TempoControl from './TempoControl';

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

  const { currentBPM, setCurrentBPM, handleBpmChange } = useGlobalBPM();

  const runButton = (className?: string) => (
    <Button
      onClick={toggleRun}
      size="lg"
      className={cn(
        'h-9 shrink-0 font-bold focus-scale',
        isRunning && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        className,
      )}
    >
      {isRunning ? 'STOP' : 'START'}
    </Button>
  );

  const tapButton = (
    <Button
      onClick={tapTempo}
      variant="outline"
      size="sm"
      className="h-9 shrink-0 border-border/60 font-bold focus-scale"
    >
      <Fingerprint className="mr-1.5 h-3.5 w-3.5" /> TAP
    </Button>
  );

  const muteButton = (
    <Button
      onClick={toggleMuted}
      variant="ghost"
      size="icon"
      className="h-9 w-9 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground focus-scale"
    >
      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </Button>
  );

  const divisionToggle = (
    <ToggleGroup
      type="single"
      value={division}
      onValueChange={(value) => value && setDivision(value as 'quarter' | 'eighth')}
      className="flex-shrink-0 rounded-lg border border-border/60 bg-muted/50 p-1"
    >
      <ToggleGroupItem
        value="quarter"
        className="h-8 px-3 text-[10px] font-bold focus-scale data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        <Clock className="mr-1.5 h-3 w-3" /> 1/4
      </ToggleGroupItem>
      <ToggleGroupItem
        value="eighth"
        className="h-8 px-3 text-[10px] font-bold focus-scale data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        <Music className="mr-1.5 h-3 w-3" /> 1/8
      </ToggleGroupItem>
    </ToggleGroup>
  );

  const beatIndicator = (
    <div
      className={cn(
        'relative flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 transition-all duration-150',
        isRunning ? 'bg-muted/10' : 'bg-muted/20',
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
          'absolute bottom-0 w-1 bg-primary/20 transition-transform duration-150 origin-bottom',
          isRunning ? 'h-full' : 'h-0',
        )}
        style={{ transform: `rotate(${pendulumPos * 30}deg)` }}
      />
      <div
        className={cn(
          'w-3 h-3 rounded-full transition-all duration-100 z-10',
          isRunning && isBeatActive
            ? isAccentBeat
              ? 'bg-warning scale-150 shadow-[0_0_15px_hsl(var(--warning))]'
              : 'bg-primary scale-125 shadow-[0_0_10px_hsl(var(--primary))]'
            : 'bg-muted-foreground/20',
        )}
      />
    </div>
  );

  // Compact stacked layout for narrow containers (e.g. the floating tempo panel).
  if (!showSettings) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {runButton('flex-1')}
          {tapButton}
          {muteButton}
        </div>
        <TempoControl
          compact
          value={currentBPM}
          onChange={setCurrentBPM}
          onStep={handleBpmChange}
        />
        <div className="flex items-center justify-between gap-2">
          {divisionToggle}
          {beatIndicator}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden lg:block">{beatIndicator}</div>

      {runButton('w-20')}

      <TempoControl
        compact
        value={currentBPM}
        onChange={setCurrentBPM}
        onStep={handleBpmChange}
      />

      <div className="flex items-center gap-1">
        <div className="hidden sm:block">{tapButton}</div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Metronome settings"
              className={cn(
                'h-9 w-9 border-border/60 focus-scale',
                (autoIncrementEnabled || visualFlashEnabled) && 'border-primary/40 bg-primary/10 text-primary',
              )}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 space-y-6 p-4 text-sm">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-widest">Subdivision</Label>
              {divisionToggle}
            </div>

            <div className="space-y-4 border-t pt-4">
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
                  variant={visualFlashEnabled ? 'default' : 'outline'}
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
                  variant={autoIncrementEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAutoIncrementEnabled(!autoIncrementEnabled)}
                  className="h-9 text-[10px] px-3"
                >
                  {autoIncrementEnabled ? 'ON' : 'OFF'}
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
      </div>

      {muteButton}
    </div>
  );
};

export default Metronome;
