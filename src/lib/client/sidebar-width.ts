export const SIDEBAR_WIDTH = {
  min: 220,
  max: 480,
  default: 280,
  /** Dragging the handle narrower than this closes the sidebar completely. */
  closeBelow: 160,
  keyStep: 16,
} as const;

export function clampSidebarWidth(width: number): number {
  return Math.min(SIDEBAR_WIDTH.max, Math.max(SIDEBAR_WIDTH.min, Math.round(width)));
}

export type DragResult = { close: true } | { close: false; width: number };

/**
 * What dragging the handle to `raw` px means, both while dragging and on release: a width within
 * the allowed range, or closing the sidebar once the pointer goes well past the minimum.
 */
export function resolveDrag(raw: number): DragResult {
  return raw < SIDEBAR_WIDTH.closeBelow
    ? { close: true }
    : { close: false, width: clampSidebarWidth(raw) };
}
