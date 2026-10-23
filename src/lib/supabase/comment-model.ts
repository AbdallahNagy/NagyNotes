export const COMMENT_LIMITS = { name: 80, body: 4000 } as const;

export interface Comment {
  id: string;
  authorName: string;
  body: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
}

export interface NewComment {
  slug: string;
  name: string;
  body: string;
}

export type CommentsErrorKind = 'rate_limited' | 'failed';

export class CommentsError extends Error {
  constructor(
    readonly kind: CommentsErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'CommentsError';
  }
}

/** The reason a comment cannot be posted, or `null` when it can. */
export function validateComment(name: string, body: string): string | null {
  const trimmedName = name.trim();
  const trimmedBody = body.trim();
  if (trimmedName === '') return 'Enter your name.';
  if (trimmedName.length > COMMENT_LIMITS.name) {
    return `Names can be up to ${COMMENT_LIMITS.name} characters.`;
  }
  if (trimmedBody === '') return 'Write a comment first.';
  if (trimmedBody.length > COMMENT_LIMITS.body) {
    return `Comments can be up to ${COMMENT_LIMITS.body} characters.`;
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseRow(row: unknown): Comment | null {
  if (!isRecord(row)) return null;
  const { id, author_name: authorName, body, created_at: createdAt } = row;
  if (
    typeof id !== 'string' ||
    typeof authorName !== 'string' ||
    typeof body !== 'string' ||
    typeof createdAt !== 'string'
  ) {
    return null;
  }
  return { id, authorName, body, createdAt };
}

/** Keeps the well-formed rows of an API response and drops anything else. */
export function parseCommentRows(rows: unknown): Comment[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row: unknown) => parseRow(row) ?? []);
}

/** Maps a PostgREST error (the database trigger raises `rate_limited`) to a typed error. */
export function toCommentsError(error: { message: string }): CommentsError {
  return error.message.includes('rate_limited')
    ? new CommentsError(
        'rate_limited',
        "You're posting too quickly. Please wait a few minutes and try again.",
      )
    : new CommentsError('failed', "Your comment couldn't be posted. Please try again.");
}
