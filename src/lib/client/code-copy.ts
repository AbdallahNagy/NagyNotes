const COPIED_MS = 1600;
const BUTTON_SELECTOR = '.code-copy';

let announcer: HTMLElement | undefined;

function announce(message: string): void {
  announcer ??= Object.assign(document.createElement('div'), {
    className: 'visually-hidden',
    ariaLive: 'polite',
  });
  if (!announcer.isConnected) document.body.append(announcer);
  announcer.textContent = message;
}

async function copy(button: HTMLButtonElement): Promise<void> {
  const code = button.closest('.code-block')?.querySelector('pre')?.textContent;
  if (code === undefined) return;

  try {
    await navigator.clipboard.writeText(code);
  } catch {
    announce('Copy failed');
    return;
  }

  const label = button.querySelector('.code-copy__label');
  button.dataset.copied = '';
  if (label) label.textContent = 'Copied';
  announce('Code copied to clipboard');

  window.setTimeout(() => {
    delete button.dataset.copied;
    if (label) label.textContent = 'Copy';
  }, COPIED_MS);
}

/** One delegated listener on the document, so it works for every code block on every page. */
export function initCodeCopy(): void {
  document.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest(BUTTON_SELECTOR) : null;
    if (button instanceof HTMLButtonElement) void copy(button);
  });
}
