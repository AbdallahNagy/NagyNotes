import { describe, expect, it } from 'vitest';
import { tocHeadings } from '@/lib/content/headings';

describe('tocHeadings', () => {
  it('keeps only h2 entries, in document order', () => {
    const headings = [
      { depth: 1, slug: 'title', text: 'Title' },
      { depth: 2, slug: 'overview', text: 'Overview' },
      { depth: 3, slug: 'detail', text: 'Detail' },
      { depth: 2, slug: 'errors', text: 'Common errors' },
    ];

    expect(tocHeadings(headings)).toEqual([
      { id: 'overview', text: 'Overview' },
      { id: 'errors', text: 'Common errors' },
    ]);
  });

  it('is empty without second-level headings', () => {
    expect(tocHeadings([{ depth: 3, slug: 'a', text: 'A' }])).toEqual([]);
  });
});
