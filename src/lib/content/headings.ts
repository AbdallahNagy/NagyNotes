export interface TocHeading {
  id: string;
  text: string;
}

interface RenderedHeading {
  depth: number;
  slug: string;
  text: string;
}

/** The "On this page" entries: second-level headings, with the ids Astro generated for them. */
export function tocHeadings(headings: readonly RenderedHeading[]): TocHeading[] {
  return headings
    .filter((heading) => heading.depth === 2)
    .map((heading) => ({ id: heading.slug, text: heading.text }));
}
