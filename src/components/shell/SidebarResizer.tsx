import { useRef } from 'preact/hooks';
import { applySidebarWidth } from '@/lib/client/document-state';
import { setSidebarRail, setSidebarWidth } from '@/lib/client/library-state';
import {
  clampSidebarWidth,
  dragPreviewWidth,
  releaseDrag,
  SIDEBAR_WIDTH,
} from '@/lib/client/sidebar-width';
import styles from './SidebarResizer.module.css';

const RESIZING_ATTRIBUTE = 'data-resizing';

interface Drag {
  pointerId: number;
  startX: number;
  startWidth: number;
  /** Width the pointer is asking for, before clamping. */
  raw: number;
}

/** Drag handle on the sidebar's right edge. The width is only written to the store on release. */
export function SidebarResizer({ width }: { width: number }) {
  const handleRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);

  const endDrag = (pointerId: number, restoreWidth: number) => {
    const root = document.documentElement;
    handleRef.current?.releasePointerCapture(pointerId);
    dragRef.current = null;
    root.removeAttribute(RESIZING_ATTRIBUTE);
    applySidebarWidth(root, restoreWidth);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    handleRef.current?.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: width,
      raw: width,
    };
    document.documentElement.setAttribute(RESIZING_ATTRIBUTE, '');
  };

  const onPointerMove = (event: PointerEvent) => {
    const drag = dragRef.current;
    if (drag?.pointerId !== event.pointerId) return;
    drag.raw = drag.startWidth + event.clientX - drag.startX;
    applySidebarWidth(document.documentElement, dragPreviewWidth(drag.raw));
  };

  const onPointerUp = (event: PointerEvent) => {
    const drag = dragRef.current;
    if (drag?.pointerId !== event.pointerId) return;
    const release = releaseDrag(drag.raw);
    endDrag(event.pointerId, release.collapse ? width : release.width);
    if (release.collapse) setSidebarRail(true);
    else setSidebarWidth(release.width);
  };

  const onPointerCancel = (event: PointerEvent) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      endDrag(event.pointerId, width);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const widths: Partial<Record<string, number>> = {
      ArrowLeft: clampSidebarWidth(width - SIDEBAR_WIDTH.keyStep),
      ArrowRight: clampSidebarWidth(width + SIDEBAR_WIDTH.keyStep),
      Home: SIDEBAR_WIDTH.default,
    };
    const next = widths[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setSidebarWidth(next);
  };

  /* A focusable separator is the WAI-ARIA "window splitter" pattern, which the a11y rules do not model. */
  /* eslint-disable jsx-a11y-x/no-noninteractive-element-interactions, jsx-a11y-x/no-noninteractive-tabindex */
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
      aria-valuenow={width}
      aria-valuemin={SIDEBAR_WIDTH.min}
      aria-valuemax={SIDEBAR_WIDTH.max}
      tabIndex={0}
      ref={handleRef}
      class={styles.handle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onKeyDown={onKeyDown}
      onDblClick={() => setSidebarWidth(SIDEBAR_WIDTH.default)}
    />
  );
}
