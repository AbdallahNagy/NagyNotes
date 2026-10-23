const WORDS_PER_MINUTE = 230;

/** Strips Markdown syntax so only the words a reader would see (code included) remain. */
function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/^\s*(```|~~~).*$/gm, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, ' ')
    .replace(/[*_`]/g, ' ');
}

export function countWords(markdown: string): number {
  return stripMarkdown(markdown)
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}

/** Whole minutes, rounded up, never less than one. */
export function readingTime(markdown: string): number {
  return Math.max(1, Math.ceil(countWords(markdown) / WORDS_PER_MINUTE));
}
