import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  ValidationError,
  formatZodError,
  parseOrThrow,
  safeParse,
} from './parse';

const schema = z.object({ name: z.string().min(1) });

describe('parseOrThrow', () => {
  it('returns parsed data for valid input', () => {
    expect(parseOrThrow(schema, { name: 'ok' }, 'Test')).toEqual({ name: 'ok' });
  });

  it('throws a ValidationError carrying the context', () => {
    expect(() => parseOrThrow(schema, { name: '' }, 'Test')).toThrow(
      ValidationError,
    );
    try {
      parseOrThrow(schema, { name: '' }, 'Test');
    } catch (error) {
      expect((error as Error).message).toContain('Test');
    }
  });
});

describe('formatZodError', () => {
  it('includes the field path in the message', () => {
    const result = schema.safeParse({ name: '' });
    if (result.success) throw new Error('expected validation to fail');
    expect(formatZodError(result.error)).toContain('name');
  });
});

describe('safeParse', () => {
  it('never throws on invalid input', () => {
    expect(safeParse(schema, 42).success).toBe(false);
  });
});
