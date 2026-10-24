import { atom } from 'nanostores';
import { pushRecent, recordProgress } from './library-state';
import { getMain } from './scroll';

/** Scroll progress of the open post (0-1), or `null` when the page is not a post. */
export const $scrollProgress = atom<number | null>(null);

/** Id of the "On this page" heading currently being read. */
export const $activeHeading = atom<string | null>(null);

/** A heading counts as current once its top is within this distance of the container top. */
const ACTIVE_HEADING_OFFSET = 140;

const progressOf = (main: HTMLElement): number => {
  const scrollable = main.scrollHeight - main.clientHeight;
  return scrollable > 0 ? Math.min(1, main.scrollTop / scrollable) : 1;
};

function activeHeadingId(main: HTMLElement, headings: readonly HTMLElement[]): string | null {
  const top = main.getBoundingClientRect().top;
  let active: string | null = null;
  for (const heading of headings) {
    if (heading.getBoundingClientRect().top - top <= ACTIVE_HEADING_OFFSET) active = heading.id;
  }
  return active;
}

function trackPost(main: HTMLElement, article: HTMLElement, postId: string): () => void {
  const headings = [...article.querySelectorAll<HTMLElement>('.prose h2[id]')];
  let frame = 0;

  const update = () => {
    frame = 0;
    const progress = progressOf(main);
    $scrollProgress.set(progress);
    $activeHeading.set(activeHeadingId(main, headings));
    recordProgress(postId, progress * 100);
  };
  const schedule = () => {
    if (frame === 0) frame = requestAnimationFrame(update);
  };

  pushRecent(postId);
  main.addEventListener('scroll', schedule, { passive: true });
  const resizeObserver = new ResizeObserver(schedule);
  resizeObserver.observe(main);
  resizeObserver.observe(article);
  update();

  return () => {
    cancelAnimationFrame(frame);
    main.removeEventListener('scroll', schedule);
    resizeObserver.disconnect();
  };
}

/**
 * Tracks how far the reader has scrolled through the current post on every page load. The
 * progress bar, table of contents and bottom bar read the stores; the highest progress per post
 * and the recently-opened list are persisted.
 */
export function initReadingProgress(): void {
  let stop: (() => void) | undefined;

  document.addEventListener('astro:page-load', () => {
    stop?.();
    stop = undefined;
    $scrollProgress.set(null);
    $activeHeading.set(null);

    const main = getMain();
    const article = document.querySelector<HTMLElement>('article[data-post-id]');
    if (main && article?.dataset.postId) stop = trackPost(main, article, article.dataset.postId);
  });
}
