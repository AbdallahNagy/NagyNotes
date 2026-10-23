import { getSupabase } from './client';
import {
  CommentsError,
  parseCommentRows,
  toCommentsError,
  type Comment,
  type NewComment,
} from './comment-model';

const PUBLIC_COLUMNS = 'id, author_name, body, created_at';

function requireClient() {
  const supabase = getSupabase();
  if (!supabase) throw new CommentsError('failed', 'Comments are not configured.');
  return supabase;
}

export async function listComments(slug: string): Promise<Comment[]> {
  const { data, error } = await requireClient()
    .from('comments')
    .select(PUBLIC_COLUMNS)
    .eq('post_slug', slug)
    .order('created_at', { ascending: true });
  if (error) throw toCommentsError(error);
  return parseCommentRows(data);
}

/**
 * Inserts a comment. Anonymous readers may only read the public columns back, so the stored row
 * is not re-selected; the caller gets the comment as it was submitted.
 */
export async function addComment({ slug, name, body }: NewComment): Promise<Comment> {
  const authorName = name.trim();
  const text = body.trim();
  const { error } = await requireClient()
    .from('comments')
    .insert({ post_slug: slug, author_name: authorName, body: text });
  if (error) throw toCommentsError(error);

  return {
    id: crypto.randomUUID(),
    authorName,
    body: text,
    createdAt: new Date().toISOString(),
  };
}
