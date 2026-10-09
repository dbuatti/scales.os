import { describe, expect, it } from 'vitest';
import {
  MAX_PDF_BYTES,
  hasPdfMagicBytes,
  validatePdfFile,
  validatePdfFileMeta,
} from './pdf';

const meta = (overrides: Partial<{ name: string; size: number; type: string }> = {}) => ({
  name: 'book.pdf',
  size: 1024,
  type: 'application/pdf',
  ...overrides,
});

describe('validatePdfFileMeta', () => {
  it('accepts a normal PDF', () => {
    expect(validatePdfFileMeta(meta())).toEqual({ ok: true });
  });

  it('rejects an empty file', () => {
    expect(validatePdfFileMeta(meta({ size: 0 })).ok).toBe(false);
  });

  it('rejects files over the size limit', () => {
    expect(validatePdfFileMeta(meta({ size: MAX_PDF_BYTES + 1 })).ok).toBe(false);
  });

  it('rejects a non-PDF mime type', () => {
    expect(validatePdfFileMeta(meta({ type: 'image/png' })).ok).toBe(false);
  });

  it('rejects a non-.pdf extension', () => {
    expect(validatePdfFileMeta(meta({ name: 'book.exe' })).ok).toBe(false);
  });
});

describe('hasPdfMagicBytes', () => {
  it('detects the %PDF- signature', async () => {
    expect(await hasPdfMagicBytes(new Blob(['%PDF-1.7']))).toBe(true);
  });

  it('rejects content without the signature', async () => {
    expect(await hasPdfMagicBytes(new Blob(['hello world']))).toBe(false);
  });
});

describe('validatePdfFile', () => {
  it('accepts a genuine PDF', async () => {
    const file = new File(['%PDF-1.7 content'], 'book.pdf', {
      type: 'application/pdf',
    });
    expect(await validatePdfFile(file)).toEqual({ ok: true });
  });

  it('rejects a file whose contents are not a PDF', async () => {
    const file = new File(['malicious payload'], 'book.pdf', {
      type: 'application/pdf',
    });
    const result = await validatePdfFile(file);
    expect(result.ok).toBe(false);
  });
});
