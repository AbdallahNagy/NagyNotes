import type { FolderInput, PostInput } from '@/lib/content/types';

export function post(id: string, overrides: Partial<PostInput> = {}): PostInput {
  return {
    id,
    title: id,
    summary: `Summary of ${id}`,
    date: new Date('2026-01-01T00:00:00Z'),
    tags: [],
    draft: false,
    body: 'Some body text.',
    ...overrides,
  };
}

export function folder(id: string, overrides: Partial<FolderInput> = {}): FolderInput {
  return { id, ...overrides };
}
