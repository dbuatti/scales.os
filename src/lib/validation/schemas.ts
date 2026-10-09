import { z } from 'zod';
import { MIN_BPM, MAX_BPM } from '@/lib/scales';
import { TIME_SIGNATURES } from '@/lib/repertoire';

export const MAX_LABEL_LENGTH = 200;
export const MAX_EXERCISE_ID_LENGTH = 200;
export const MAX_TITLE_LENGTH = 300;
export const MAX_NOTES_LENGTH = 4000;

export const repertoireModeSchema = z.enum(['technical', 'repertoire']);

export const timeSignatureSchema = z.enum(
  TIME_SIGNATURES as unknown as [string, ...string[]],
);

export const bpmSchema = z
  .number({ invalid_type_error: 'BPM must be a number' })
  .int('BPM must be a whole number')
  .min(MIN_BPM, `BPM must be at least ${MIN_BPM}`)
  .max(MAX_BPM, `BPM must be at most ${MAX_BPM}`);

export const MAX_PAGES = 100_000;

export const pageNumberSchema = z
  .number()
  .int()
  .min(1, 'Page number must be at least 1')
  .max(MAX_PAGES);

export const pageCountSchema = z.number().int().min(0).max(MAX_PAGES);

export const documentTitleSchema = z
  .string()
  .trim()
  .min(1, 'A document title is required')
  .max(MAX_TITLE_LENGTH, `Title must be ${MAX_TITLE_LENGTH} characters or fewer`);

/** A single page mapping as edited by the user in the reader. */
export const pageMappingSchema = z
  .object({
    id: z.string().min(1, 'Mapping id is required').max(128),
    pageStart: z.number().int().min(1, 'Start page must be at least 1'),
    pageEnd: z.number().int().min(1, 'End page must be at least 1'),
    exerciseId: z.string().max(MAX_EXERCISE_ID_LENGTH),
    label: z.string().max(MAX_LABEL_LENGTH),
    targetBpm: bpmSchema,
    timeSignature: timeSignatureSchema,
    mode: repertoireModeSchema,
  })
  .refine((mapping) => mapping.pageEnd >= mapping.pageStart, {
    message: 'End page must be greater than or equal to the start page',
    path: ['pageEnd'],
  });

export const pageMappingListSchema = z.array(pageMappingSchema);

/**
 * Lenient shape for rows read back from Postgres. Values are coerced and fall
 * back to safe defaults so a single malformed row can never break the reader.
 */
export const pageMappingRowSchema = z.object({
  id: z.string(),
  page_start: z.coerce.number().int().min(1).catch(1),
  page_end: z.coerce.number().int().min(1).catch(1),
  exercise_id: z.string().catch(''),
  label: z.string().catch(''),
  target_bpm: z.coerce.number().int().min(MIN_BPM).max(MAX_BPM).catch(60),
  time_signature: z.string().catch('4/4'),
  mode: z.string().catch('technical'),
});

export const documentTitleInputSchema = z.object({
  title: z.string().trim().min(1).max(MAX_TITLE_LENGTH),
});

export const practiceLogInputSchema = z.object({
  durationMinutes: z.number().int().min(0).max(24 * 60),
  notes: z.string().max(MAX_NOTES_LENGTH).optional().default(''),
  itemsPracticed: z.array(z.record(z.unknown())).max(200).default([]),
});

export type PageMappingInput = z.infer<typeof pageMappingSchema>;
export type PracticeLogInput = z.infer<typeof practiceLogInputSchema>;
