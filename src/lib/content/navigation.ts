import type {
  Crumb,
  FolderCard,
  FolderNode,
  Library,
  PostIndexEntry,
  PostNode,
  SidebarNode,
} from './types';

const HOME_CRUMB: Crumb = { label: 'Home', url: '/' };

export function getPost(library: Library, id: string): PostNode {
  const post = library.posts.get(id);
  if (!post) throw new Error(`Unknown post "${id}"`);
  return post;
}

export function getFolder(library: Library, id: string): FolderNode {
  const folder = library.folders.get(id);
  if (!folder) throw new Error(`Unknown folder "${id}"`);
  return folder;
}

/** The folder and all of its ancestors, outermost first. */
export function folderChain(library: Library, folderId: string | null): FolderNode[] {
  const chain: FolderNode[] = [];
  let current = folderId === null ? undefined : getFolder(library, folderId);
  while (current) {
    chain.unshift(current);
    current = current.parentId === null ? undefined : getFolder(library, current.parentId);
  }
  return chain;
}

function toCrumb(folder: FolderNode): Crumb {
  return { label: folder.name, url: folder.url };
}

export function postBreadcrumbs(library: Library, postId: string): Crumb[] {
  const post = getPost(library, postId);
  return [HOME_CRUMB, ...folderChain(library, post.folderId).map(toCrumb)];
}

/** Ancestors only; the folder's own name is the page heading. */
export function folderBreadcrumbs(library: Library, folderId: string): Crumb[] {
  return [HOME_CRUMB, ...folderChain(library, folderId).slice(0, -1).map(toCrumb)];
}

function siblingPosts(library: Library, postId: string): PostNode[] {
  const post = getPost(library, postId);
  const ids =
    post.folderId === null ? library.rootPostIds : getFolder(library, post.folderId).postIds;
  return ids.map((id) => getPost(library, id));
}

export function prevNext(
  library: Library,
  postId: string,
): { prev: PostNode | null; next: PostNode | null } {
  const siblings = siblingPosts(library, postId);
  const index = siblings.findIndex((post) => post.id === postId);
  return { prev: siblings[index - 1] ?? null, next: siblings[index + 1] ?? null };
}

/** Posts in a folder and all of its subfolders, in tree order (subfolders first). */
export function descendantPosts(library: Library, folderId: string): PostNode[] {
  const folder = getFolder(library, folderId);
  return [
    ...folder.folderIds.flatMap((id) => descendantPosts(library, id)),
    ...folder.postIds.map((id) => getPost(library, id)),
  ];
}

function descendantFolderCount(library: Library, folderId: string): number {
  const folder = getFolder(library, folderId);
  return folder.folderIds.reduce((total, id) => total + 1 + descendantFolderCount(library, id), 0);
}

function newestFirst(posts: readonly PostNode[]): PostNode[] {
  return [...posts].sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function latestPosts(library: Library, limit: number): PostNode[] {
  return newestFirst([...library.posts.values()]).slice(0, limit);
}

export function newestInFolder(library: Library, folderId: string, limit: number): PostNode[] {
  return newestFirst(descendantPosts(library, folderId)).slice(0, limit);
}

export function folderCard(library: Library, folder: FolderNode): FolderCard {
  return {
    id: folder.id,
    url: folder.url,
    name: folder.name,
    postCount: descendantPosts(library, folder.id).length,
    folderCount: descendantFolderCount(library, folder.id),
  };
}

export function childFolderCards(library: Library, folderId: string | null): FolderCard[] {
  const ids = folderId === null ? library.rootFolderIds : getFolder(library, folderId).folderIds;
  return ids.map((id) => folderCard(library, getFolder(library, id)));
}

export function toIndexEntry(library: Library, post: PostNode): PostIndexEntry {
  return {
    id: post.id,
    url: post.url,
    title: post.title,
    summary: post.summary,
    date: post.date.toISOString(),
    readTime: post.readTime,
    folderId: post.folderId,
    folderPath: folderChain(library, post.folderId).map((folder) => folder.name),
  };
}

/** Every post in tree order, for client-side filtering and personalised lists. */
export function buildPostIndex(library: Library): PostIndexEntry[] {
  const rootPosts = library.rootPostIds.map((id) => getPost(library, id));
  const folderPosts = library.rootFolderIds.flatMap((id) => descendantPosts(library, id));
  return [...folderPosts, ...rootPosts].map((post) => toIndexEntry(library, post));
}

function folderToSidebarNode(library: Library, folder: FolderNode): SidebarNode {
  return {
    kind: 'folder',
    id: folder.id,
    url: folder.url,
    name: folder.name,
    count: descendantPosts(library, folder.id).length,
    children: [
      ...folder.folderIds.map((id) => folderToSidebarNode(library, getFolder(library, id))),
      ...folder.postIds.map((id) => postToSidebarNode(getPost(library, id))),
    ],
  };
}

function postToSidebarNode(post: PostNode): SidebarNode {
  return { kind: 'post', id: post.id, url: post.url, title: post.title };
}

export function buildSidebarTree(library: Library): SidebarNode[] {
  return [
    ...library.rootFolderIds.map((id) => folderToSidebarNode(library, getFolder(library, id))),
    ...library.rootPostIds.map((id) => postToSidebarNode(getPost(library, id))),
  ];
}
