import { describe, expect, it } from 'vitest';
import {
  clearLastOpenedDocumentId,
  detectBookSource,
  formatDocumentTitle,
  getLastOpenedDocumentId,
  setLastOpenedDocumentId,
} from './repertoire';

describe('last opened document persistence', () => {
  it('returns null and no-ops when localStorage is unavailable', () => {
    expect(getLastOpenedDocumentId()).toBeNull();
    expect(() => setLastOpenedDocumentId('doc-1')).not.toThrow();
    expect(() => clearLastOpenedDocumentId()).not.toThrow();
  });
});

describe('detectBookSource', () => {
  it('detects Hanon from title or text', () => {
    expect(detectBookSource('Hanon.pdf')).toBe('hanon');
    expect(detectBookSource('IMSLP91547-PMLP03129-Hanon_Final.pdf')).toBe('hanon');
    expect(detectBookSource('book.pdf', 'The Virtuoso Pianist in 60 exercises')).toBe('hanon');
  });

  it('detects Dohnányi from title or text', () => {
    expect(detectBookSource('Dohnanyi_SUVINI.pdf')).toBe('dohnanyi');
    expect(detectBookSource('Dohnányi exercises')).toBe('dohnanyi');
    expect(detectBookSource('book.pdf', 'Essential finger exercises for piano')).toBe('dohnanyi');
  });

  it('returns null when nothing matches', () => {
    expect(detectBookSource('Scales.pdf', 'Major and minor scales')).toBeNull();
  });
});

describe('formatDocumentTitle', () => {
  it('strips the .pdf extension and IMSLP prefix', () => {
    expect(formatDocumentTitle('IMSLP91547-PMLP03129-Hanon_Final.pdf')).toBe('Hanon Final');
  });

  it('replaces underscores and hyphens with spaces', () => {
    expect(formatDocumentTitle('my-method_book.pdf')).toBe('my method book');
  });

  it('falls back to the raw name for unknown formats', () => {
    expect(formatDocumentTitle('plain.pdf')).toBe('plain');
  });
});
