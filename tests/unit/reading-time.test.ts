import { describe, expect, it } from 'vitest';
import { countWords, minutesLeft, readingTime } from '@/lib/content/reading-time';

const words = (count: number) => Array.from({ length: count }, () => 'word').join(' ');

describe('countWords', () => {
  it('counts plain words', () => {
    expect(countWords('one two  three\nfour')).toBe(4);
  });

  it('ignores Markdown markers but keeps the words', () => {
    expect(countWords('## Heading here\n\n- first item\n- second **bold** item')).toBe(7);
  });

  it('keeps link text and drops the URL', () => {
    expect(countWords('See [the docs](https://example.com/very/long/path) now')).toBe(4);
  });

  it('drops HTML comments', () => {
    expect(countWords('<!-- seed content: replace before publishing -->\n\nHello world')).toBe(2);
  });

  it('counts the words inside code fences but not the fence markers', () => {
    const markdown = '```bash\ncurl -X POST https://example.com\n```\n';
    expect(countWords(markdown)).toBe(4);
  });

  it('ignores punctuation-only tokens', () => {
    expect(countWords('{ } ; // word')).toBe(1);
  });
});

describe('readingTime', () => {
  it('is at least one minute, even when empty', () => {
    expect(readingTime('')).toBe(1);
    expect(readingTime('short')).toBe(1);
  });

  it('is exactly one minute at 230 words and rounds up after', () => {
    expect(readingTime(words(230))).toBe(1);
    expect(readingTime(words(231))).toBe(2);
    expect(readingTime(words(460))).toBe(2);
    expect(readingTime(words(461))).toBe(3);
  });
});

describe('minutesLeft', () => {
  it('counts down with progress and rounds up', () => {
    expect(minutesLeft(10, 0)).toBe(10);
    expect(minutesLeft(10, 0.25)).toBe(8);
    expect(minutesLeft(10, 0.95)).toBe(1);
  });

  it('never drops below one minute', () => {
    expect(minutesLeft(10, 1)).toBe(1);
    expect(minutesLeft(1, 0.5)).toBe(1);
  });
});
