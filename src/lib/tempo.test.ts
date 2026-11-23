import { describe, expect, it } from 'vitest';
import { clampBpm, exerciseProgress, nextGoalBPM, stepBpm } from './tempo';

describe('clampBpm', () => {
  it('clamps to the supported range', () => {
    expect(clampBpm(10)).toBe(40);
    expect(clampBpm(1000)).toBe(250);
    expect(clampBpm(120)).toBe(120);
  });

  it('rounds fractional values', () => {
    expect(clampBpm(120.6)).toBe(121);
  });
});

describe('stepBpm', () => {
  it('applies a delta and stays in range', () => {
    expect(stepBpm(120, 5)).toBe(125);
    expect(stepBpm(249, 5)).toBe(250);
    expect(stepBpm(41, -5)).toBe(40);
  });
});

describe('nextGoalBPM', () => {
  it('starts at 40 BPM when nothing has been mastered yet', () => {
    expect(nextGoalBPM(0)).toBe(40);
  });

  it('steps 3 BPM above the highest mastered tempo', () => {
    expect(nextGoalBPM(40)).toBe(43);
    expect(nextGoalBPM(120)).toBe(123);
  });
});

describe('exerciseProgress', () => {
  it('measures the step from an exercise best to its next goal', () => {
    expect(exerciseProgress(40, 40, 43)).toEqual({ percentage: 0, remaining: 3 });
    expect(exerciseProgress(42, 40, 43)).toEqual({ percentage: 67, remaining: 1 });
    expect(exerciseProgress(43, 40, 43)).toEqual({ percentage: 100, remaining: 0 });
  });

  it('clamps progress and never reports negative tempo remaining', () => {
    expect(exerciseProgress(35, 40, 43).percentage).toBe(0);
    expect(exerciseProgress(50, 40, 43)).toEqual({ percentage: 100, remaining: 0 });
  });
});
