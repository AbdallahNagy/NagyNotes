import { describe, expect, it } from 'vitest';
import {
  COMMENT_LIMITS,
  CommentsError,
  parseCommentRows,
  toCommentsError,
  validateComment,
} from '@/lib/supabase/comment-model';

describe('validateComment', () => {
  it('accepts a normal comment', () => {
    expect(validateComment('Priya', 'Nice post.')).toBeNull();
  });

  it('requires a name and a body, ignoring surrounding whitespace', () => {
    expect(validateComment('  ', 'text')).toBe('Enter your name.');
    expect(validateComment('Priya', '   ')).toBe('Write a comment first.');
  });

  it('enforces the length limits', () => {
    expect(validateComment('a'.repeat(COMMENT_LIMITS.name), 'x')).toBeNull();
    expect(validateComment('a'.repeat(COMMENT_LIMITS.name + 1), 'x')).toMatch(
      /Names can be up to 80/,
    );
    expect(validateComment('a', 'x'.repeat(COMMENT_LIMITS.body))).toBeNull();
    expect(validateComment('a', 'x'.repeat(COMMENT_LIMITS.body + 1))).toMatch(
      /Comments can be up to 4000/,
    );
  });
});

describe('parseCommentRows', () => {
  it('maps database rows to comments', () => {
    const rows = [
      { id: '1', author_name: 'Tom', body: 'Hi', created_at: '2026-10-20T10:00:00Z', extra: 1 },
    ];
    expect(parseCommentRows(rows)).toEqual([
      { id: '1', authorName: 'Tom', body: 'Hi', createdAt: '2026-10-20T10:00:00Z' },
    ]);
  });

  it('drops malformed rows and tolerates non-arrays', () => {
    const rows = [{ id: 1 }, null, 'x', { id: '2', author_name: 'A', body: 'B', created_at: 'C' }];
    expect(parseCommentRows(rows).map((c) => c.id)).toEqual(['2']);
    expect(parseCommentRows(null)).toEqual([]);
  });
});

describe('toCommentsError', () => {
  it('maps the trigger error to a friendly rate limit message', () => {
    const error = toCommentsError({ message: 'rate_limited' });
    expect(error).toBeInstanceOf(CommentsError);
    expect(error.kind).toBe('rate_limited');
    expect(error.message).toMatch(/too quickly/);
  });

  it('maps anything else to a generic failure', () => {
    const error = toCommentsError({ message: 'permission denied for table comments' });
    expect(error.kind).toBe('failed');
  });
});
