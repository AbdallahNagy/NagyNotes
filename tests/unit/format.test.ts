import { describe, expect, it } from 'vitest';
import { formatCount, formatDate } from '@/lib/format';

describe('formatDate', () => {
  it('formats a Date as "Mon D, YYYY"', () => {
    expect(formatDate(new Date('2026-10-18T00:00:00Z'))).toBe('Oct 18, 2026');
  });

  it('is stable for dates at the edge of a day in UTC', () => {
    expect(formatDate(new Date('2026-01-01T00:00:00Z'))).toBe('Jan 1, 2026');
    expect(formatDate(new Date('2026-12-31T23:59:59Z'))).toBe('Dec 31, 2026');
  });

  it('accepts ISO strings', () => {
    expect(formatDate('2026-09-02')).toBe('Sep 2, 2026');
  });
});

describe('formatCount', () => {
  it('pluralises', () => {
    expect(formatCount(1, 'post')).toBe('1 post');
    expect(formatCount(0, 'post')).toBe('0 posts');
    expect(formatCount(3, 'folder')).toBe('3 folders');
  });

  it('accepts an explicit plural', () => {
    expect(formatCount(2, 'entry', 'entries')).toBe('2 entries');
  });
});
