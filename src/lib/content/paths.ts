export function idToUrl(id: string): string {
  return `/${id}`;
}

export function idToSegments(id: string): string[] {
  return id.split('/');
}

export function segmentsToId(segments: readonly string[]): string {
  return segments.join('/');
}

/** Id of the folder containing `id`, or `null` at the top level. */
export function parentId(id: string): string | null {
  const index = id.lastIndexOf('/');
  return index === -1 ? null : id.slice(0, index);
}

export function lastSegment(id: string): string {
  return id.slice(id.lastIndexOf('/') + 1);
}

/** Every folder id above `id`, outermost first. Excludes `id` itself. */
export function ancestorIds(id: string): string[] {
  const segments = idToSegments(id);
  return segments.slice(0, -1).map((_, i) => segmentsToId(segments.slice(0, i + 1)));
}

/** `oauth-2-0` becomes `Oauth 2 0`; folders that need better should set `title` in `_folder.md`. */
export function prettifyFolderName(segment: string): string {
  return segment
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
