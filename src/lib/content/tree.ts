import { ancestorIds, idToUrl, lastSegment, parentId, prettifyFolderName } from './paths';
import { readingTime } from './reading-time';
import type { FolderInput, FolderNode, Library, PostInput, PostNode } from './types';

export interface BuildOptions {
  includeDrafts: boolean;
}

/** Missing `order` sorts last. */
function compareOrder(a: number | undefined, b: number | undefined): number {
  const left = a ?? Number.POSITIVE_INFINITY;
  const right = b ?? Number.POSITIVE_INFINITY;
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function compareFolders(a: FolderNode, b: FolderNode): number {
  return compareOrder(a.order, b.order) || a.name.localeCompare(b.name);
}

/** Reading order: `order`, then oldest first, then title. */
export function comparePosts(a: PostNode, b: PostNode): number {
  return (
    compareOrder(a.order, b.order) ||
    a.date.getTime() - b.date.getTime() ||
    a.title.localeCompare(b.title)
  );
}

function toPostNode(input: PostInput): PostNode {
  return {
    id: input.id,
    url: idToUrl(input.id),
    title: input.title,
    summary: input.summary,
    date: input.date,
    order: input.order,
    tags: input.tags,
    readTime: readingTime(input.body),
    folderId: parentId(input.id),
  };
}

function collectFolderIds(
  posts: readonly PostInput[],
  folders: readonly FolderInput[],
): Set<string> {
  const ids = new Set<string>();
  for (const folder of folders) {
    ids.add(folder.id);
    ancestorIds(folder.id).forEach((id) => ids.add(id));
  }
  for (const post of posts) ancestorIds(post.id).forEach((id) => ids.add(id));
  return ids;
}

function assertNoCollisions(posts: readonly PostInput[], folderIds: ReadonlySet<string>): void {
  for (const post of posts) {
    if (folderIds.has(post.id)) {
      throw new Error(
        `Content conflict: the post "${post.id}" has the same path as a folder. ` +
          `Rename the post file or the "${lastSegment(post.id)}" folder.`,
      );
    }
  }
}

/**
 * Builds the post/folder tree from flat content entries. Folders are inferred from post paths and
 * from `_folder.md` files, so a folder may exist with only metadata.
 */
export function buildLibrary(
  postInputs: readonly PostInput[],
  folderInputs: readonly FolderInput[],
  { includeDrafts }: BuildOptions,
): Library {
  const visiblePosts = includeDrafts ? postInputs : postInputs.filter((post) => !post.draft);
  const folderIds = collectFolderIds(visiblePosts, folderInputs);
  assertNoCollisions(visiblePosts, folderIds);

  const metadata = new Map(folderInputs.map((folder) => [folder.id, folder]));
  const folders = new Map<string, FolderNode>();
  for (const id of folderIds) {
    const meta = metadata.get(id);
    folders.set(id, {
      id,
      url: idToUrl(id),
      name: meta?.title ?? prettifyFolderName(lastSegment(id)),
      description: meta?.description,
      order: meta?.order,
      parentId: parentId(id),
      folderIds: [],
      postIds: [],
    });
  }

  const posts = new Map(visiblePosts.map((input) => [input.id, toPostNode(input)]));

  const rootFolders: FolderNode[] = [];
  for (const folder of folders.values()) {
    const parent = folder.parentId === null ? undefined : folders.get(folder.parentId);
    if (parent) parent.folderIds.push(folder.id);
    else rootFolders.push(folder);
  }

  const postsByFolder = new Map<string | null, PostNode[]>();
  for (const post of posts.values()) {
    const siblings = postsByFolder.get(post.folderId) ?? [];
    siblings.push(post);
    postsByFolder.set(post.folderId, siblings);
  }

  const sortedIds = (nodes: FolderNode[]) => nodes.sort(compareFolders).map((n) => n.id);
  for (const folder of folders.values()) {
    folder.folderIds = sortedIds(folder.folderIds.map((id) => requireFolder(folders, id)));
    folder.postIds = (postsByFolder.get(folder.id) ?? []).sort(comparePosts).map((p) => p.id);
  }

  return {
    posts,
    folders,
    rootFolderIds: sortedIds(rootFolders),
    rootPostIds: (postsByFolder.get(null) ?? []).sort(comparePosts).map((p) => p.id),
  };
}

function requireFolder(folders: ReadonlyMap<string, FolderNode>, id: string): FolderNode {
  const folder = folders.get(id);
  if (!folder) throw new Error(`Unknown folder "${id}"`);
  return folder;
}
