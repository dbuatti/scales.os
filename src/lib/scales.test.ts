import { describe, expect, it } from 'vitest';
import {
  ACCENT_DISTRIBUTIONS,
  ARTICULATIONS,
  DIRECTION_TYPES,
  HAND_CONFIGURATIONS,
  OCTAVE_CONFIGURATIONS,
  RHYTHMIC_PERMUTATIONS,
  getScalePermutationId,
  parseScalePermutationId,
} from './scales';

describe('scale permutation ids', () => {
  it('round-trip non-default permutations back to their settings', () => {
    const settings = {
      articulation: ARTICULATIONS[1],
      direction: DIRECTION_TYPES[0],
      handConfig: HAND_CONFIGURATIONS[2],
      rhythm: RHYTHMIC_PERMUTATIONS[1],
      accent: ACCENT_DISTRIBUTIONS[0],
      octaves: OCTAVE_CONFIGURATIONS[2],
    };

    const id = getScalePermutationId(
      'G-HarmonicMinor',
      settings.articulation,
      settings.direction,
      settings.handConfig,
      settings.rhythm,
      settings.accent,
      settings.octaves,
    );

    expect(parseScalePermutationId(id)).toEqual({ scaleId: 'G-HarmonicMinor', ...settings });
  });

  it('returns null for ids that do not match a known permutation', () => {
    expect(parseScalePermutationId('C-Major-unknown')).toBeNull();
  });
});
