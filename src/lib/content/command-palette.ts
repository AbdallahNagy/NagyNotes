import type { PostIndexEntry, SidebarNode } from './types';

type FolderNode = Extract<SidebarNode, { kind: 'folder' }>;

export interface PaletteFolder {
  id: string;
  url: string;
  name: string;
  /** Names of the folders above this one, outermost first. */
  path: string[];
  count: number;
}

export interface FolderContents {
  folders: PaletteFolder[];
  posts: PostIndexEntry[];
}

/** Every folder in the tree with the names of its ancestors, in tree order. */
export function flattenFolders(tree: readonly SidebarNode[], path: string[] = []): PaletteFolder[] {
  return tree.flatMap((node) => {
    if (node.kind !== 'folder') return [];
    const folder = { id: node.id, url: node.url, name: node.name, path, count: node.count };
    return [folder, ...flattenFolders(node.children, [...path, node.name])];
  });
}

function findFolderNode(tree: readonly SidebarNode[], id: string): FolderNode | null {
  for (const node of tree) {
    if (node.kind !== 'folder') continue;
    if (node.id === id) return node;
    const inner = findFolderNode(node.children, id);
    if (inner) return inner;
  }
  return null;
}

/** `true` when the folder or post `id` sits inside the folder `scopeId` (any depth). */
export function isInScope(id: string, scopeId: string | null): boolean {
  return scopeId === null || id.startsWith(`${scopeId}/`);
}

/**
 * What a folder holds one level down: its subfolders and its own posts, in reading order.
 * `null` is the top level of the library.
 */
export function folderContents(
  tree: readonly SidebarNode[],
  index: readonly PostIndexEntry[],
  scopeId: string | null,
): FolderContents {
  const scope = scopeId === null ? null : findFolderNode(tree, scopeId);
  if (scopeId !== null && !scope) return { folders: [], posts: [] };

  const children = scope ? scope.children : tree;
  const path = scopeTrail(tree, scopeId).map((folder) => folder.name);
  const byId = new Map(index.map((post) => [post.id, post]));

  return {
    folders: children.flatMap((node) =>
      node.kind === 'folder'
        ? [{ id: node.id, url: node.url, name: node.name, path, count: node.count }]
        : [],
    ),
    posts: children.flatMap((node) => (node.kind === 'post' ? (byId.get(node.id) ?? []) : [])),
  };
}

/** Folders inside `scopeId` (any depth) whose name contains `query`, case-insensitively. */
export function searchFolders(
  tree: readonly SidebarNode[],
  query: string,
  scopeId: string | null,
): PaletteFolder[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return [];
  return flattenFolders(tree).filter(
    (folder) => isInScope(folder.id, scopeId) && folder.name.toLowerCase().includes(needle),
  );
}

/** The folder chain from the top of the library down to `scopeId`, for the scope breadcrumb. */
export function scopeTrail(tree: readonly SidebarNode[], scopeId: string | null): PaletteFolder[] {
  if (scopeId === null) return [];
  const folders = new Map(flattenFolders(tree).map((folder) => [folder.id, folder]));
  const segments = scopeId.split('/');
  return segments.flatMap((_, i) => folders.get(segments.slice(0, i + 1).join('/')) ?? []);
}

export interface MatchPart {
  text: string;
  match: boolean;
}

/** Splits `text` around the first case-insensitive occurrence of `query`, for highlighting. */
export function splitMatch(text: string, query: string): MatchPart[] {
  const needle = query.trim().toLowerCase();
  const at = needle === '' ? -1 : text.toLowerCase().indexOf(needle);
  if (at === -1) return [{ text, match: false }];
  return [
    { text: text.slice(0, at), match: false },
    { text: text.slice(at, at + needle.length), match: true },
    { text: text.slice(at + needle.length), match: false },
  ].filter((part) => part.text !== '');
}
