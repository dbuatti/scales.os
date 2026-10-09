import { describe, expect, it } from 'vitest';
import {
  MAX_LABEL_LENGTH,
  bpmSchema,
  pageMappingListSchema,
  pageMappingRowSchema,
  pageMappingSchema,
  pageNumberSchema,
  repertoireModeSchema,
  timeSignatureSchema,
} from '@/lib/validation/schemas';

const validMapping = {
  id: 'map-1',
  pageStart: 10,
  pageEnd: 12,
  exerciseId: 'Hanon-1',
  label: 'Hanon No. 1',
  targetBpm: 80,
  timeSignature: '4/4',
  mode: 'technical' as const,
};

describe('repertoireModeSchema', () => {
  it('accepts known modes', () => {
    expect(repertoireModeSchema.parse('technical')).toBe('technical');
    expect(repertoireModeSchema.parse('repertoire')).toBe('repertoire');
  });

  it('rejects unknown modes', () => {
    expect(repertoireModeSchema.safeParse('jazz').success).toBe(false);
  });
});

describe('timeSignatureSchema', () => {
  it('accepts supported signatures', () => {
    expect(timeSignatureSchema.safeParse('6/8').success).toBe(true);
  });

  it('rejects unsupported signatures', () => {
    expect(timeSignatureSchema.safeParse('5/4').success).toBe(false);
  });
});

describe('bpmSchema', () => {
  it('accepts in-range whole numbers', () => {
    expect(bpmSchema.safeParse(120).success).toBe(true);
  });

  it('rejects out-of-range values', () => {
    expect(bpmSchema.safeParse(10).success).toBe(false);
    expect(bpmSchema.safeParse(999).success).toBe(false);
  });

  it('rejects fractions', () => {
    expect(bpmSchema.safeParse(120.5).success).toBe(false);
  });
});

describe('pageNumberSchema', () => {
  it('rejects zero and negative pages', () => {
    expect(pageNumberSchema.safeParse(0).success).toBe(false);
    expect(pageNumberSchema.safeParse(-3).success).toBe(false);
  });
});

describe('pageMappingSchema', () => {
  it('accepts a well-formed mapping', () => {
    expect(pageMappingSchema.safeParse(validMapping).success).toBe(true);
  });

  it('rejects an end page before the start page', () => {
    const result = pageMappingSchema.safeParse({
      ...validMapping,
      pageStart: 10,
      pageEnd: 4,
    });
    expect(result.success).toBe(false);
  });

  it('rejects an over-long label', () => {
    const result = pageMappingSchema.safeParse({
      ...validMapping,
      label: 'x'.repeat(500),
    });
    expect(result.success).toBe(false);
  });
});

describe('pageMappingListSchema', () => {
  it('accepts an array of mappings', () => {
    expect(pageMappingListSchema.safeParse([validMapping]).success).toBe(true);
  });

  it('rejects a payload containing an invalid mapping', () => {
    expect(
      pageMappingListSchema.safeParse([validMapping, { ...validMapping, targetBpm: 5 }])
        .success,
    ).toBe(false);
  });
});

describe('pageMappingRowSchema', () => {
  it('coerces database rows into the mapping shape', () => {
    const parsed = pageMappingRowSchema.parse({
      id: 'row-1',
      page_start: '3',
      page_end: '4',
      exercise_id: 'Hanon-1',
      label: 'Hanon No. 1',
      target_bpm: '90',
      time_signature: '4/4',
      mode: 'technical',
    });
    expect(parsed.page_start).toBe(3);
    expect(parsed.target_bpm).toBe(90);
  });

  it('falls back to safe defaults for malformed rows', () => {
    const parsed = pageMappingRowSchema.parse({
      id: 'row-2',
      page_start: 'not-a-number',
      target_bpm: 9999,
    });
    expect(parsed.page_start).toBe(1);
    expect(parsed.target_bpm).toBe(60);
    expect(parsed.label).toBe('');
    expect(parsed.mode).toBe('technical');
  });
});
