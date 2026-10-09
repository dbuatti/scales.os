import { MIN_BPM, MAX_BPM } from '@/lib/scales';

export const clampBpm = (bpm: number): number =>
  Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));

export const stepBpm = (bpm: number, delta: number): number => clampBpm(bpm + delta);

export const TEMPO_PRESETS = [60, 80, 100, 120, 140] as const;
