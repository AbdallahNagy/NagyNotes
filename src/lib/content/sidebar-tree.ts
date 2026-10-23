import type { SidebarNode } from './types';

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
