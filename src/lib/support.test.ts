import { describe, expect, it, vi } from 'vitest';

describe('support contact', () => {
  it('is null when VITE_SUPPORT_EMAIL is unset or invalid', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPPORT_EMAIL', 'not-an-email');
    const mod = await import('./support');
    expect(mod.SUPPORT_EMAIL).toBeNull();
    expect(mod.supportMailto('Hi')).toBeNull();
    vi.unstubAllEnvs();
  });

  it('builds an encoded mailto link when configured', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPPORT_EMAIL', ' help@scales.example ');
    const mod = await import('./support');
    expect(mod.SUPPORT_EMAIL).toBe('help@scales.example');
    expect(mod.supportMailto('Delete my account')).toBe(
      'mailto:help@scales.example?subject=Delete%20my%20account',
    );
    vi.unstubAllEnvs();
  });
});
