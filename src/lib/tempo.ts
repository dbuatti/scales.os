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

export interface ExerciseProgress {
  /** 0–100, clamped so a tempo below the recorded best never reads oddly. */
  percentage: number;
  /** Whole BPM still needed to reach the next goal. */
  remaining: number;
}

/** Progress from an exercise's recorded best to its next tempo milestone. */
export const exerciseProgress = (
  currentBpm: number,
  bestBpm: number,
  targetBpm: number,
): ExerciseProgress => {
  const remaining = Math.max(0, targetBpm - currentBpm);
  if (targetBpm <= bestBpm) {
    return { percentage: currentBpm >= targetBpm ? 100 : 0, remaining };
  }
  const percentage = ((currentBpm - bestBpm) / (targetBpm - bestBpm)) * 100;
  return {
    percentage: Math.min(100, Math.max(0, Math.round(percentage))),
    remaining,
  };
};
