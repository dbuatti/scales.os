import { describe, expect, it } from 'vitest';
import { clampBpm, stepBpm } from './tempo';

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
