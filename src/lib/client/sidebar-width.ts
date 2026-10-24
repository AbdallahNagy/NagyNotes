export const SIDEBAR_WIDTH = {
  min: 220,
  max: 480,
  default: 280,
  /** Releasing a drag narrower than this collapses the sidebar to its icon rail. */
  collapseBelow: 180,
  /** Narrowest width shown while dragging; mirrors `--sidebar-rail-width`. */
  dragFloor: 52,
  keyStep: 16,
} as const;

export function clampSidebarWidth(width: number): number {
  return Math.min(SIDEBAR_WIDTH.max, Math.max(SIDEBAR_WIDTH.min, Math.round(width)));
}

/** The width to preview while the handle is dragged to `raw`. */
export function dragPreviewWidth(raw: number): number {
  return Math.min(SIDEBAR_WIDTH.max, Math.max(SIDEBAR_WIDTH.dragFloor, Math.round(raw)));
}

export type DragRelease = { collapse: true } | { collapse: false; width: number };

/** What letting go of the handle at `raw` px means: a new width, or collapsing to the rail. */
export function releaseDrag(raw: number): DragRelease {
  return raw < SIDEBAR_WIDTH.collapseBelow
    ? { collapse: true }
    : { collapse: false, width: clampSidebarWidth(raw) };
}
