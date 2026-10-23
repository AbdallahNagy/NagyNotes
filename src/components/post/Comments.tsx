import { useCallback, useEffect, useState } from 'preact/hooks';
import { $commentCount } from '@/lib/client/ui-state';
import { formatDate } from '@/lib/format';
import { commentsConfigured } from '@/lib/supabase/client';
import { type Comment } from '@/lib/supabase/comment-model';
import { listComments } from '@/lib/supabase/comments';
import { COMMENTS_ID } from './comments-id';
import { CommentComposer } from './CommentComposer';
import styles from './Comments.module.css';

type LoadState = 'loading' | 'ready' | 'error';

export default function Comments({ slug }: { slug: string }) {
  const configured = commentsConfigured();
  const [state, setState] = useState<LoadState>('loading');
  const [comments, setComments] = useState<Comment[]>([]);

  const load = useCallback(() => {
    setState('loading');
    listComments(slug)
      .then((loaded) => {
        setComments(loaded);
        setState('ready');
      })
      .catch(() => {
        setState('error');
      });
  }, [slug]);

  useEffect(() => {
    if (configured) load();
  }, [configured, load]);

  useEffect(() => {
    $commentCount.set(state === 'ready' ? comments.length : null);
    return () => $commentCount.set(null);
  }, [state, comments.length]);

  return (
    <section
      id={COMMENTS_ID}
      class={styles.comments}
      aria-labelledby="comments-heading"
      data-pagefind-ignore
    >
      <h2 id="comments-heading" class={styles.heading}>
        Comments{state === 'ready' && ` · ${comments.length}`}
      </h2>
      {!configured && <p class={styles.note}>Comments aren't available yet.</p>}
      {configured && state === 'loading' && <p class={styles.note}>Loading comments…</p>}
      {configured && state === 'error' && (
        <p class={styles.note} role="alert">
          Comments couldn't be loaded.{' '}
          <button type="button" class={styles.retry} onClick={load}>
            Try again
          </button>
        </p>
      )}
      {state === 'ready' && (
        <ul class={styles.list}>
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </ul>
      )}
      {configured && (
        <CommentComposer
          slug={slug}
          onPosted={(comment) => {
            setComments((current) => [...current, comment]);
            setState('ready');
          }}
        />
      )}
    </section>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <li class={styles.item}>
      <span class={styles.avatar} aria-hidden="true">
        {comment.authorName.charAt(0).toUpperCase()}
      </span>
      <div class={styles.content}>
        <div class={styles.byline}>
          <span class={styles.name}>{comment.authorName}</span>
          <span class={styles.date}> · {formatDate(comment.createdAt)}</span>
        </div>
        <p class={styles.text}>{comment.body}</p>
      </div>
    </li>
  );
}
