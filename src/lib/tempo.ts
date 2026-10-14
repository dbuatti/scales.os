import { MIN_BPM, MAX_BPM } from '@/lib/scales';

export const clampBpm = (bpm: number): number =>
  Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));

export const stepBpm = (bpm: number, delta: number): number => clampBpm(bpm + delta);

export const TEMPO_PRESETS = [60, 80, 100, 120, 140] as const;

export const GOAL_INCREMENT_BPM = 3;
export const STARTING_GOAL_BPM = 40;

/** The next tempo goal for an item: a small step above the highest mastered BPM, or the starting goal when nothing is mastered yet. */
export const nextGoalBPM = (highestBPM: number): number =>
  highestBPM > 0 ? highestBPM + GOAL_INCREMENT_BPM : STARTING_GOAL_BPM;
