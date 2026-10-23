import { describe, expect, it } from 'vitest';
import { applyPrefs, defaultPrefs, nextTheme, parsePrefs } from '@/lib/client/prefs';

describe('defaultPrefs', () => {
  it('follows the system colour scheme for the theme only', () => {
    expect(defaultPrefs(false)).toEqual({
      theme: 'light',
      size: 'm',
      measure: 'normal',
      font: 'serif',
    });
    expect(defaultPrefs(true).theme).toBe('dark');
  });
});

describe('parsePrefs', () => {
  const fallback = defaultPrefs(false);

  it('accepts a full valid object', () => {
    const stored = { theme: 'sepia', size: 'l', measure: 'wide', font: 'sans' };
    expect(parsePrefs(stored, fallback)).toEqual(stored);
  });

  it('replaces invalid fields individually', () => {
    expect(parsePrefs({ theme: 'neon', size: 'l', font: 3 }, fallback)).toEqual({
      ...fallback,
      size: 'l',
    });
  });

  it('falls back entirely for non-objects', () => {
    expect(parsePrefs(null, fallback)).toBe(fallback);
    expect(parsePrefs('dark', fallback)).toBe(fallback);
  });
});

describe('nextTheme', () => {
  it('cycles light, sepia, dark', () => {
    expect(nextTheme('light')).toBe('sepia');
    expect(nextTheme('sepia')).toBe('dark');
    expect(nextTheme('dark')).toBe('light');
  });
});

describe('applyPrefs', () => {
  it('writes data attributes', () => {
    const attributes: Record<string, string> = {};
    const root = { dataset: attributes } as unknown as HTMLElement;
    applyPrefs(root, { theme: 'dark', size: 's', measure: 'narrow', font: 'sans' });
    expect(attributes).toEqual({ theme: 'dark', size: 's', measure: 'narrow', font: 'sans' });
  });
});
