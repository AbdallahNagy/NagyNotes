import { READ_THRESHOLD } from '@/lib/client/library-state';

export type PostStatus = 'bookmarked' | 'read';

export const STATUS_ICON = { bookmarked: 'bookmark-simple-fill', read: 'check' } as const;

export function postStatus(bookmarked: boolean, percent: number): PostStatus | null {
  if (bookmarked) return 'bookmarked';
  return percent >= READ_THRESHOLD ? 'read' : null;
}
