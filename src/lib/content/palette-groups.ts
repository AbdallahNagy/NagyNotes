import {
  folderContents,
  isInScope,
  searchFolders,
  scopeTrail,
  type PaletteFolder,
} from './command-palette';
import type { LibraryData, PostIndexEntry } from './types';

export type PaletteItem =
  | { kind: 'open-folder'; key: string; folder: PaletteFolder }
  | { kind: 'folder'; key: string; folder: PaletteFolder }
  | { kind: 'post'; key: string; post: PostIndexEntry };

export interface PaletteGroup {
  label: string;
  items: PaletteItem[];
}

const folderItem = (folder: PaletteFolder): PaletteItem => ({
  kind: 'folder',
  key: `folder:${folder.id}`,
  folder,
});

const postItem = (post: PostIndexEntry): PaletteItem => ({
  kind: 'post',
  key: `post:${post.id}`,
  post,
});

interface GroupInput {
  library: LibraryData;
  scopeId: string | null;
  query: string;
  /** Full-text post matches for `query`; `null` while the search is still running. */
  postMatches: readonly PostIndexEntry[] | null;
  recentIds: readonly string[];
}

const nonEmpty = (groups: PaletteGroup[]) => groups.filter((group) => group.items.length > 0);

/** What the palette lists: browsing a folder when the query is empty, matches otherwise. */
export function paletteGroups({
  library,
  scopeId,
  query,
  postMatches,
  recentIds,
}: GroupInput): PaletteGroup[] {
  const { tree, index } = library;

  if (query.trim() !== '') {
    return nonEmpty([
      { label: 'Folders', items: searchFolders(tree, query, scopeId).map(folderItem) },
      {
        label: 'Posts',
        items: (postMatches ?? []).filter((post) => isInScope(post.id, scopeId)).map(postItem),
      },
    ]);
  }

  const contents = folderContents(tree, index, scopeId);
  const scope = scopeTrail(tree, scopeId).at(-1);
  const byId = new Map(index.map((post) => [post.id, post]));

  return nonEmpty([
    scope
      ? { label: '', items: [{ kind: 'open-folder', key: `open:${scope.id}`, folder: scope }] }
      : {
          label: 'Recent',
          items: recentIds.flatMap((id) => byId.get(id) ?? []).map(postItem),
        },
    { label: 'Folders', items: contents.folders.map(folderItem) },
    { label: 'Posts', items: contents.posts.map(postItem) },
  ]);
}
