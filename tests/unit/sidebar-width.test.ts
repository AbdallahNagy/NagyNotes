import { describe, expect, it } from 'vitest';
import { clampSidebarWidth, resolveDrag, SIDEBAR_WIDTH } from '@/lib/client/sidebar-width';

describe('clampSidebarWidth', () => {
  it('keeps widths inside the allowed range and rounds', () => {
    expect(clampSidebarWidth(100)).toBe(SIDEBAR_WIDTH.min);
    expect(clampSidebarWidth(900)).toBe(SIDEBAR_WIDTH.max);
    expect(clampSidebarWidth(300.6)).toBe(301);
  });
});

describe('resolveDrag', () => {
  it('closes the sidebar once the pointer goes past the threshold', () => {
    expect(resolveDrag(SIDEBAR_WIDTH.closeBelow - 1)).toEqual({ close: true });
    expect(resolveDrag(-40)).toEqual({ close: true });
  });

  it('holds at the minimum width between the threshold and the minimum', () => {
    expect(resolveDrag(SIDEBAR_WIDTH.closeBelow)).toEqual({
      close: false,
      width: SIDEBAR_WIDTH.min,
    });
  });

  it('keeps an in-range width and caps the maximum', () => {
    expect(resolveDrag(350)).toEqual({ close: false, width: 350 });
    expect(resolveDrag(700)).toEqual({ close: false, width: SIDEBAR_WIDTH.max });
  });
});
