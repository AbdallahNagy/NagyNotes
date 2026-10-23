/** Raw post data as handed over by the content layer. */
export interface PostInput {
  id: string;
  title: string;
  summary: string;
  date: Date;
  order?: number | undefined;
  tags: string[];
  draft: boolean;
  body: string;
}

/** Folder metadata from a `_folder.md` file. */
export interface FolderInput {
  id: string;
  title?: string | undefined;
  description?: string | undefined;
  order?: number | undefined;
}

export interface PostNode {
  id: string;
  url: string;
  title: string;
  summary: string;
  date: Date;
  order: number | undefined;
  tags: string[];
  readTime: number;
  /** `null` for a post that sits at the top level of the content directory. */
  folderId: string | null;
}

export interface FolderNode {
  id: string;
  url: string;
  name: string;
  description: string | undefined;
  order: number | undefined;
  parentId: string | null;
  /** Child folder ids, in display order. */
  folderIds: string[];
  /** Ids of the posts directly inside this folder, in reading order. */
  postIds: string[];
}

export interface Library {
  posts: ReadonlyMap<string, PostNode>;
  folders: ReadonlyMap<string, FolderNode>;
  rootFolderIds: string[];
  rootPostIds: string[];
}

export interface Crumb {
  label: string;
  url: string;
}

/** Compact, serialisable post description handed to client islands. */
export interface PostIndexEntry {
  id: string;
  url: string;
  title: string;
  summary: string;
  /** ISO 8601 date. */
  date: string;
  readTime: number;
  folderId: string | null;
  /** Display names of the folders the post sits in, outermost first. */
  folderPath: string[];
}

export type SidebarNode =
  | {
      kind: 'folder';
      id: string;
      url: string;
      name: string;
      count: number;
      children: SidebarNode[];
    }
  | { kind: 'post'; id: string; url: string; title: string };

export interface FolderCard {
  id: string;
  url: string;
  name: string;
  postCount: number;
  folderCount: number;
}
