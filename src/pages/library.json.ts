import type { APIRoute } from 'astro';
import { getContent } from '@/lib/content/load';
import { buildPostIndex, buildSidebarTree } from '@/lib/content/navigation';
import type { LibraryData } from '@/lib/content/types';

/** The folder tree and post index, fetched by the command palette the first time it opens. */
export const GET: APIRoute = async () => {
  const { library } = await getContent();
  const data: LibraryData = { tree: buildSidebarTree(library), index: buildPostIndex(library) };
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
