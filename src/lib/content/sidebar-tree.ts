import type { PostIndexEntry, SidebarNode } from './types';

export function normalizePath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

/** The nodes from the top of the tree down to the node at `url`, or `[]` when there is none. */
export function findNodePath(tree: readonly SidebarNode[], url: string): SidebarNode[] {
  for (const node of tree) {
    if (node.url === url) return [node];
    if (node.kind === 'folder') {
      const inner = findNodePath(node.children, url);
      if (inner.length > 0) return [node, ...inner];
    }
  }
  return [];
}

/** Folders to open so the page at `pathname` is visible: its ancestors, and itself when a folder. */
export function foldersToReveal(tree: readonly SidebarNode[], pathname: string): string[] {
  return findNodePath(tree, normalizePath(pathname))
    .filter((node) => node.kind === 'folder')
    .map((node) => node.id);
}

/** Ids of the folders `depth` levels down; depth 0 is the top level. */
export function folderIdsAtDepth(tree: readonly SidebarNode[], depth: number): string[] {
  return tree.flatMap((node) => {
    if (node.kind !== 'folder') return [];
    return depth === 0 ? [node.id] : folderIdsAtDepth(node.children, depth - 1);
  });
}

/**
 * The depth "Expand one level" should open next: the shallowest one that still has a closed
 * folder, or `null` when every folder is already open.
 */
export function nextExpandDepth(
  tree: readonly SidebarNode[],
  expanded: ReadonlySet<string>,
): number | null {
  for (let depth = 0; ; depth += 1) {
    const ids = folderIdsAtDepth(tree, depth);
    if (ids.length === 0) return null;
    if (ids.some((id) => !expanded.has(id))) return depth;
  }
}

/** Every post, newest first, with ties broken by title so the order is stable. */
export function flatPostsNewestFirst(index: readonly PostIndexEntry[]): PostIndexEntry[] {
  return [...index].sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date) || a.title.localeCompare(b.title),
  );
}
