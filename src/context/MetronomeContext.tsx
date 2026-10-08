import React, { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useGlobalBPM } from '@/context/GlobalBPMContext';
import { cn } from '@/lib/utils';

export type NoteDivision = 'quarter' | 'eighth';

interface MetronomeContextType {
  isRunning: boolean;
  isMuted: boolean;
  volume: number;
  visualFlashEnabled: boolean;
  division: NoteDivision;
  beatsPerMeasure: number;
  isBeatActive: boolean;
  isAccentBeat: boolean;
  currentMeasure: number;
  pendulumPos: number;
  autoIncrementEnabled: boolean;
  incrementAmount: number;
  incrementEvery: number;
  toggleRun: () => void;
  toggleMuted: () => void;
  setVolume: (volume: number) => void;
  toggleVisualFlash: () => void;
  setDivision: (division: NoteDivision) => void;
  setBeatsPerMeasure: (beats: number) => void;
  setAutoIncrementEnabled: (enabled: boolean) => void;
  setIncrementAmount: (amount: number) => void;
  setIncrementEvery: (every: number) => void;
  tapTempo: () => void;
}

const MetronomeContext = createContext<MetronomeContextType | undefined>(undefined);

const LOOKAHEAD = 25.0;
const SCHEDULE_AHEAD_TIME = 0.1;

export const MetronomeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { currentBPM, setCurrentBPM, handleBpmChange } = useGlobalBPM();

  const [isRunning, setIsRunning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [visualFlashEnabled, setVisualFlashEnabled] = useState(false);
  const [division, setDivision] = useState<NoteDivision>('quarter');
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [isBeatActive, setIsBeatActive] = useState(false);
  const [isAccentBeat, setIsAccentBeat] = useState(false);
  const [pendulumPos, setPendulumPos] = useState(0);
  const [currentMeasure, setCurrentMeasure] = useState(0);
  const [autoIncrementEnabled, setAutoIncrementEnabled] = useState(false);
  const [incrementAmount, setIncrementAmount] = useState(1);
  const [incrementEvery, setIncrementEvery] = useState(4);

  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);
  const currentBeatRef = useRef(0);
  const measuresCountRef = useRef(0);
  const tapTimesRef = useRef<number[]>([]);

  const bpmRef = useRef(currentBPM);
  const volumeRef = useRef(volume);
  const isMutedRef = useRef(isMuted);
  const divisionRef = useRef(division);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);
  const autoIncRef = useRef({ enabled: autoIncrementEnabled, amount: incrementAmount, every: incrementEvery });
  const handleBpmChangeRef = useRef(handleBpmChange);

  bpmRef.current = currentBPM;
  volumeRef.current = volume;
  isMutedRef.current = isMuted;
  divisionRef.current = division;
  beatsPerMeasureRef.current = beatsPerMeasure;
  autoIncRef.current = { enabled: autoIncrementEnabled, amount: incrementAmount, every: incrementEvery };
  handleBpmChangeRef.current = handleBpmChange;

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioContextCtor();
    }
    return audioContextRef.current;
  }, []);

  const playClick = useCallback(
    (time: number, isAccent: boolean) => {
      if (isMutedRef.current) return;

      const context = initAudioContext();
      const osc = context.createOscillator();
      const gain = context.createGain();

      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(context.destination);

      const frequency = isAccent ? 1000 : 800;
      const baseVolume = isAccent ? volumeRef.current : volumeRef.current * 0.7;
      const duration = 0.03;

      osc.frequency.setValueAtTime(frequency, time);
      gain.gain.setValueAtTime(baseVolume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.start(time);
      osc.stop(time + duration);
    },
    [initAudioContext],
  );

  const scheduler = useCallback(() => {
    const context = audioContextRef.current;
    if (!context) return;

    const secondsPerBeat = 60.0 / bpmRef.current;
    const interval = divisionRef.current === 'quarter' ? secondsPerBeat : secondsPerBeat / 2;

    while (nextNoteTimeRef.current < context.currentTime + SCHEDULE_AHEAD_TIME) {
      const beatsInMeasure =
        divisionRef.current === 'quarter' ? beatsPerMeasureRef.current : beatsPerMeasureRef.current * 2;
      const beatIndex = currentBeatRef.current % beatsInMeasure;
      const isAccent = beatIndex === 0;

      if (isAccent && currentBeatRef.current > 0) {
        measuresCountRef.current++;
        setCurrentMeasure(measuresCountRef.current);

        const auto = autoIncRef.current;
        if (auto.enabled && auto.every > 0 && measuresCountRef.current % auto.every === 0) {
          handleBpmChangeRef.current(auto.amount);
        }
      }

      playClick(nextNoteTimeRef.current, isAccent);

      setIsBeatActive(true);
      setIsAccentBeat(isAccent);
      setPendulumPos((prev) => (prev === 1 ? -1 : 1));

      setTimeout(() => setIsBeatActive(false), 100);

      currentBeatRef.current++;
      nextNoteTimeRef.current += interval;
    }

    timerRef.current = window.setTimeout(scheduler, LOOKAHEAD);
  }, [playClick]);

  useEffect(() => {
    if (isRunning) {
      const context = initAudioContext();
      if (context.state === 'suspended') context.resume();
      currentBeatRef.current = 0;
      measuresCountRef.current = 0;
      setCurrentMeasure(0);
      nextNoteTimeRef.current = context.currentTime;
      timerRef.current = window.setTimeout(scheduler, LOOKAHEAD);
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
  }, [isRunning, scheduler, initAudioContext]);

  const toggleRun = useCallback(() => setIsRunning((prev) => !prev), []);
  const toggleMuted = useCallback(() => setIsMuted((prev) => !prev), []);
  const toggleVisualFlash = useCallback(() => setVisualFlashEnabled((prev) => !prev), []);

  const tapTempo = useCallback(() => {
    const now = Date.now();
    const timeout = 2000;

    if (tapTimesRef.current.length > 0 && now - tapTimesRef.current[tapTimesRef.current.length - 1] > timeout) {
      tapTimesRef.current = [];
    }

    tapTimesRef.current.push(now);

    if (tapTimesRef.current.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
      setCurrentBPM(Math.round(60000 / avgInterval));
    }

    if (tapTimesRef.current.length > 4) {
      tapTimesRef.current.shift();
    }
  }, [setCurrentBPM]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;

      if (e.code === 'Space') {
        e.preventDefault();
        toggleRun();
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleMuted();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleRun, toggleMuted]);

  const contextValue = useMemo(
    () => ({
      isRunning,
      isMuted,
      volume,
      visualFlashEnabled,
      division,
      beatsPerMeasure,
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
      setBeatsPerMeasure,
      setAutoIncrementEnabled,
      setIncrementAmount,
      setIncrementEvery,
      tapTempo,
    }),
    [
      isRunning,
      isMuted,
      volume,
      visualFlashEnabled,
      division,
      beatsPerMeasure,
      isBeatActive,
      isAccentBeat,
      currentMeasure,
      pendulumPos,
      autoIncrementEnabled,
      incrementAmount,
      incrementEvery,
      toggleRun,
      toggleMuted,
      toggleVisualFlash,
      tapTempo,
    ],
  );

  return (
    <MetronomeContext.Provider value={contextValue}>
      {isRunning && visualFlashEnabled && isBeatActive && (
        <div
          className={cn(
            'fixed inset-0 pointer-events-none z-[100] transition-opacity duration-100',
            isAccentBeat ? 'bg-warning/10' : 'bg-primary/5',
          )}
        />
      )}
      {children}
    </MetronomeContext.Provider>
  );
};

export const useMetronome = () => {
  const context = useContext(MetronomeContext);
  if (context === undefined) {
    throw new Error('useMetronome must be used within a MetronomeProvider');
  }
  return context;
};
