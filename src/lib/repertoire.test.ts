import { describe, expect, it } from 'vitest';
import {
  clearLastOpenedDocumentId,
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
