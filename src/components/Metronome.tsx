import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Music, Clock } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

interface MetronomeProps {
  bpm: number;
}

type NoteDivision = 'quarter' | 'eighth';

const Metronome: React.FC<MetronomeProps> = ({ bpm }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [division, setDivision] = useState<NoteDivision>('quarter');
  const [currentBeatVisual, setCurrentBeatVisual] = useState(0); // For visual indicator only
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);
  const currentBeatRef = useRef(0); // For scheduling logic
  
  const lookahead = 25.0; // How far ahead to schedule audio (in milliseconds)
  const scheduleAheadTime = 0.1; // How far ahead to schedule audio (in seconds)

  // Initialize AudioContext
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      console.log("[Metronome] Initializing AudioContext.");
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Function to play a click sound
  const playClick = useCallback((time: number, isAccent: boolean) => {
    if (isMuted) {
      console.log("[Metronome] playClick: Muted, skipping sound.");
      return;
    }

    const context = initAudioContext();
    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.connect(gain);
    gain.connect(context.destination);

    // Set frequency and volume based on accent
    const frequency = isAccent ? 880 : 440; // A5 for accent, A4 for regular
    const volume = isAccent ? 0.8 : 0.5;
    const duration = 0.025; // Short click

    osc.frequency.setValueAtTime(frequency, time);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.start(time);
    osc.stop(time + duration);
    console.log(`[Metronome] playClick: Scheduled click at ${time.toFixed(3)}s, accent: ${isAccent ? 'yes' : 'no'}`);
  }, [isMuted, initAudioContext]);

  // Scheduling function
  const scheduler = useCallback(() => {
    const context = audioContextRef.current;
    if (!context) {
      console.warn("[Metronome] Scheduler: AudioContext not initialized.");
      return;
    }

    const secondsPerBeat = 60.0 / bpm;
    const interval = division === 'quarter' ? secondsPerBeat : secondsPerBeat / 2;

    console.log(`[Metronome] Scheduler: Current time: ${context.currentTime.toFixed(3)}s, Next note time: ${nextNoteTimeRef.current.toFixed(3)}s, Interval: ${interval.toFixed(3)}s`);

    while (nextNoteTimeRef.current < context.currentTime + scheduleAheadTime) {
      const beatIndex = currentBeatRef.current % (division === 'quarter' ? 4 : 8);
      const isAccent = beatIndex === 0; // First beat (index 0) is accent

      playClick(nextNoteTimeRef.current, isAccent);
      
      // Update beat for scheduling logic
      currentBeatRef.current++;
      // Update beat state for visual indicator
      setCurrentBeatVisual(currentBeatRef.current); 
      console.log(`[Metronome] Scheduler: Updating currentBeatRef to ${currentBeatRef.current}, playing click.`);

      // Advance time
      nextNoteTimeRef.current += interval;
      console.log(`[Metronome] Scheduler: Advanced nextNoteTime to ${nextNoteTimeRef.current.toFixed(3)}s`);
    }
    
    timerRef.current = window.setTimeout(scheduler, lookahead);
    console.log(`[Metronome] Scheduler: Set next scheduler timeout for ${lookahead}ms.`);
  }, [bpm, division, playClick, scheduleAheadTime, lookahead]);

  // Start/Stop logic
  useEffect(() => {
    console.log(`[Metronome] useEffect [isRunning]: isRunning changed to ${isRunning}`);
    if (isRunning) {
      const context = initAudioContext();
      
      // Reset beat counters and set initial time
      currentBeatRef.current = 0; // Reset ref
      setCurrentBeatVisual(0); // Reset visual state
      nextNoteTimeRef.current = context.currentTime + 0.1; // Start slightly in the future
      console.log(`[Metronome] useEffect [isRunning]: Starting metronome. Initial nextNoteTime: ${nextNoteTimeRef.current.toFixed(3)}s`);
      
      // Start scheduling loop
      timerRef.current = window.setTimeout(scheduler, lookahead);
    } else {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
        console.log("[Metronome] useEffect [isRunning]: Cleared scheduler timeout.");
      }
      currentBeatRef.current = 0; // Reset ref
      setCurrentBeatVisual(0); // Reset visual state
      console.log("[Metronome] useEffect [isRunning]: Stopped metronome, reset currentBeat to 0.");
    }

    return () => {
      console.log("[Metronome] useEffect [isRunning]: Cleanup function called.");
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
        console.log("[Metronome] useEffect [isRunning]: Cleanup: Cleared scheduler timeout.");
      }
    };
  }, [isRunning, scheduler, initAudioContext, lookahead]);
  
  // Reset beat counter when division changes while running
  useEffect(() => {
      console.log(`[Metronome] useEffect [division, isRunning]: division changed to ${division}, isRunning: ${isRunning}`);
      if (isRunning) {
          currentBeatRef.current = 0; // Reset ref
          setCurrentBeatVisual(0); // Reset visual state
          console.log("[Metronome] useEffect [division, isRunning]: Metronome running, reset currentBeat to 0 due to division change.");
      }
  }, [division, isRunning]);

  const handleToggleRun = () => {
    console.log(`[Metronome] handleToggleRun: Toggling run state from ${isRunning} to ${!isRunning}`);
    if (!isRunning) {
        // Ensure AudioContext is resumed on user interaction
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
            console.log("[Metronome] handleToggleRun: Resumed AudioContext.");
        }
    }
    setIsRunning(prev => !prev);
  };

  return (
    <div className="flex items-center space-x-2">
      <Button 
        onClick={handleToggleRun} 
        size="sm" 
        className={cn(
          "w-20 font-mono transition-colors",
          isRunning ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : "bg-primary hover:bg-primary/90 text-primary-foreground"
        )}
      >
        {isRunning ? 'STOP' : 'START'}
      </Button>
      
      <Button 
        onClick={() => {
          console.log(`[Metronome] Toggling mute state from ${isMuted} to ${!isMuted}`);
          setIsMuted(prev => !prev);
        }} 
        variant="ghost" 
        size="icon"
        className="text-primary hover:bg-primary/20"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </Button>
      
      <ToggleGroup 
        type="single" 
        value={division} 
        onValueChange={(value) => {
          if (value) {
            console.log(`[Metronome] Changing division from ${division} to ${value}`);
            setDivision(value as NoteDivision);
          }
        }}
        className="bg-secondary/50 rounded-md p-1"
      >
        <ToggleGroupItem 
          value="quarter" 
          aria-label="Quarter Note Division"
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs h-8 px-2 font-mono"
        >
          <Clock className="w-4 h-4 mr-1" /> 1/4
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="eighth" 
          aria-label="Eighth Note Division"
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs h-8 px-2 font-mono"
        >
          <Music className="w-4 h-4 mr-1" /> 1/8
        </ToggleGroupItem>
      </ToggleGroup>
      
      {/* Beat Indicator (Visual feedback) */}
      <div className="flex space-x-1">
        {[0, 1, 2, 3].map(index => (
          <div 
            key={index} 
            className={cn(
              "w-3 h-3 rounded-full transition-colors duration-100",
              isRunning && (currentBeatVisual % 4) === index ? "bg-yellow-400 shadow-md shadow-yellow-400/50" : "bg-muted-foreground/30"
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default Metronome;