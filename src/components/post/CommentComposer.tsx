import { useStore } from '@nanostores/preact';
import { useState } from 'preact/hooks';
import { $commenterName } from '@/lib/client/commenter';
import {
  COMMENT_LIMITS,
  CommentsError,
  validateComment,
  type Comment,
} from '@/lib/supabase/comment-model';
import { addComment } from '@/lib/supabase/comments';
import styles from './CommentComposer.module.css';

interface CommentComposerProps {
  slug: string;
  onPosted: (comment: Comment) => void;
}

const errorMessage = (error: unknown): string =>
  error instanceof CommentsError ? error.message : "Your comment couldn't be posted.";

export function CommentComposer({ slug, onPosted }: CommentComposerProps) {
  const name = useStore($commenterName, { ssr: () => '' });
  const [body, setBody] = useState('');
  const [trap, setTrap] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const ready = name.trim() !== '' && body.trim() !== '' && !submitting;

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    if (trap !== '') {
      // Only bots fill the hidden field: behave as if it worked, send nothing.
      setBody('');
      return;
    }
    const problem = validateComment(name, body);
    if (problem) {
      setError(problem);
      return;
    }

    setSubmitting(true);
    setError(null);
    addComment({ slug, name, body })
      .then((comment) => {
        onPosted(comment);
        setBody('');
      })
      .catch((failure: unknown) => {
        setError(errorMessage(failure));
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <form class={styles.composer} onSubmit={submit} noValidate>
      <input
        class={styles.name}
        type="text"
        name="name"
        value={name}
        placeholder="Your name"
        aria-label="Your name"
        autocomplete="nickname"
        maxLength={COMMENT_LIMITS.name}
        onInput={(event) => $commenterName.set(event.currentTarget.value)}
      />
      <textarea
        class={styles.body}
        name="comment"
        rows={3}
        value={body}
        placeholder="Add a comment…"
        aria-label="Comment"
        maxLength={COMMENT_LIMITS.body}
        onInput={(event) => setBody(event.currentTarget.value)}
      />
      <input
        class={styles.trap}
        type="text"
        name="website"
        value={trap}
        tabIndex={-1}
        autocomplete="off"
        aria-hidden="true"
        onInput={(event) => setTrap(event.currentTarget.value)}
      />
      <div class={styles.footer}>
        <span class={styles.error} role="alert">
          {error}
        </span>
        <button type="submit" class={styles.submit} disabled={!ready}>
          Post comment
        </button>
      </div>
    </form>
  );
}
