import { getCollection, type CollectionEntry } from 'astro:content';
import { buildLibrary } from './tree';
import type { Library } from './types';

export interface Content {
  library: Library;
  /** Collection entries by post id, for rendering. */
  entries: ReadonlyMap<string, CollectionEntry<'posts'>>;
}

async function loadContent(): Promise<Content> {
  const [posts, folders] = await Promise.all([getCollection('posts'), getCollection('folders')]);

  const library = buildLibrary(
    posts.map(({ id, data, body }) => ({ id, ...data, body: body ?? '' })),
    folders.map(({ id, data }) => ({ id, ...data })),
    { includeDrafts: !import.meta.env.PROD },
  );
  const entries = new Map(posts.filter((post) => library.posts.has(post.id)).map((p) => [p.id, p]));
  return { library, entries };
}

let cached: Promise<Content> | undefined;

/** The only place that reads the content collections. Memoised for production builds. */
export function getContent(): Promise<Content> {
  if (!import.meta.env.PROD) return loadContent();
  cached ??= loadContent();
  return cached;
}
