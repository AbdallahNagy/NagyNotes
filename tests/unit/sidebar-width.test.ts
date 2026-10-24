import { describe, expect, it } from 'vitest';
import {
  clampSidebarWidth,
  dragPreviewWidth,
  releaseDrag,
  SIDEBAR_WIDTH,
} from '@/lib/client/sidebar-width';

describe('clampSidebarWidth', () => {
  it('keeps widths inside the allowed range and rounds', () => {
    expect(clampSidebarWidth(100)).toBe(SIDEBAR_WIDTH.min);
    expect(clampSidebarWidth(900)).toBe(SIDEBAR_WIDTH.max);
    expect(clampSidebarWidth(300.6)).toBe(301);
  });
});

describe('dragPreviewWidth', () => {
  it('follows the pointer between the rail width and the maximum', () => {
    expect(dragPreviewWidth(300)).toBe(300);
    expect(dragPreviewWidth(10)).toBe(SIDEBAR_WIDTH.dragFloor);
    expect(dragPreviewWidth(2000)).toBe(SIDEBAR_WIDTH.max);
  });
});

describe('releaseDrag', () => {
  it('collapses to the rail below the threshold', () => {
    expect(releaseDrag(179)).toEqual({ collapse: true });
  });

  it('snaps up to the minimum between the threshold and the minimum', () => {
    expect(releaseDrag(180)).toEqual({ collapse: false, width: SIDEBAR_WIDTH.min });
  });

  it('keeps an in-range width and caps the maximum', () => {
    expect(releaseDrag(350)).toEqual({ collapse: false, width: 350 });
    expect(releaseDrag(700)).toEqual({ collapse: false, width: SIDEBAR_WIDTH.max });
  });
});
