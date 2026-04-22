import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import styled from 'styled-components';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_ACTIVE_EPS = 0.02;
const WHEEL_ZOOM_SENSITIVITY = 0.008;
/** Ignore the synthetic click after a pan (movement above this). */
const PAN_STALL_PX = 12;

export type ZoomableImageViewportProps = {
  /** When false, children are rendered without zoom behavior. */
  enabled: boolean;
  /** True while scale is meaningfully above 1 (for disabling outer swipe / tap navigation). */
  onZoomActiveChange?: (zoomActive: boolean) => void;
  /** Set to a function that resets zoom to 1× (used with Escape from the parent screen). */
  resetZoomRef?: MutableRefObject<(() => void) | null>;
  children: ReactNode;
};

type TransformState = {
  scale: number;
  tx: number;
  ty: number;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

export const ZoomableImageViewport = ({
  enabled,
  onZoomActiveChange,
  resetZoomRef,
  children,
}: ZoomableImageViewportProps): ReactNode => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<HTMLDivElement>(null);
  const baseSizeRef = useRef({ w: 0, h: 0 });
  const transformLiveRef = useRef<TransformState>({ scale: MIN_SCALE, tx: 0, ty: 0 });

  const [transform, setTransform] = useState<TransformState>({
    scale: MIN_SCALE,
    tx: 0,
    ty: 0,
  });

  transformLiveRef.current = transform;

  const measureBase = useCallback((): void => {
    const inner = transformRef.current;
    if (inner == null) {
      return;
    }
    const img = inner.querySelector('img');
    const w = img?.offsetWidth ?? inner.offsetWidth;
    const h = img?.offsetHeight ?? inner.offsetHeight;
    if (w > 0 && h > 0) {
      baseSizeRef.current = { w, h };
    }
  }, []);

  useLayoutEffect(() => {
    measureBase();
  }, [children, measureBase]);

  useEffect(() => {
    const onResize = (): void => {
      measureBase();
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [measureBase]);

  useLayoutEffect(() => {
    const inner = transformRef.current;
    if (inner == null || !enabled) {
      return;
    }
    const ro = new ResizeObserver(() => {
      measureBase();
    });
    ro.observe(inner);
    const img = inner.querySelector('img');
    const onImgLoad = (): void => {
      measureBase();
    };
    if (img != null) {
      if (img.complete) {
        measureBase();
      } else {
        img.addEventListener('load', onImgLoad);
      }
    }
    return () => {
      ro.disconnect();
      if (img != null) {
        img.removeEventListener('load', onImgLoad);
      }
    };
  }, [children, enabled, measureBase]);

  const clampPan = useCallback(
    (tx: number, ty: number, scale: number): { tx: number; ty: number } => {
      const vp = viewportRef.current;
      const { w, h } = baseSizeRef.current;
      if (vp == null || w <= 0 || h <= 0) {
        return { tx, ty };
      }
      const vw = vp.clientWidth;
      const vh = vp.clientHeight;
      const scaledW = w * scale;
      const scaledH = h * scale;
      const maxTx = Math.max(0, (scaledW - vw) / 2);
      const maxTy = Math.max(0, (scaledH - vh) / 2);
      return {
        tx: clamp(tx, -maxTx, maxTx),
        ty: clamp(ty, -maxTy, maxTy),
      };
    },
    [],
  );

  useEffect(() => {
    onZoomActiveChange?.(transform.scale > MIN_SCALE + ZOOM_ACTIVE_EPS);
  }, [onZoomActiveChange, transform.scale]);

  const pinchRef = useRef<{
    initialDistance: number;
    initialScale: number;
    initialTx: number;
    initialTy: number;
  } | null>(null);

  const touchesInsideViewport = useCallback((e: TouchEvent): boolean => {
    const vp = viewportRef.current;
    if (vp == null || e.touches.length < 2) {
      return false;
    }
    const t0 = e.touches.item(0);
    const t1 = e.touches.item(1);
    if (t0 == null || t1 == null) {
      return false;
    }
    const a = t0.target;
    const b = t1.target;
    const hasNode = (x: EventTarget): x is Node => x instanceof Node;
    return hasNode(a) && hasNode(b) && vp.contains(a) && vp.contains(b);
  }, []);

  const touchDistance = (e: TouchEvent): number => {
    const t0 = e.touches.item(0);
    const t1 = e.touches.item(1);
    if (t0 == null || t1 == null) {
      return 0;
    }
    const dx = t1.clientX - t0.clientX;
    const dy = t1.clientY - t0.clientY;
    return Math.hypot(dx, dy);
  };

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onTouchStart = (e: TouchEvent): void => {
      if (e.touches.length !== 2 || !touchesInsideViewport(e)) {
        return;
      }
      const d0 = touchDistance(e);
      if (d0 <= 0) {
        return;
      }
      const cur = transformLiveRef.current;
      pinchRef.current = {
        initialDistance: d0,
        initialScale: cur.scale,
        initialTx: cur.tx,
        initialTy: cur.ty,
      };
    };

    const onTouchMove = (e: TouchEvent): void => {
      const pinch = pinchRef.current;
      if (e.touches.length !== 2 || pinch == null) {
        return;
      }
      if (!touchesInsideViewport(e)) {
        return;
      }
      const d = touchDistance(e);
      if (d <= 0) {
        return;
      }
      e.preventDefault();
      const factor = d / pinch.initialDistance;
      const nextScale = clamp(pinch.initialScale * factor, MIN_SCALE, MAX_SCALE);
      setTransform(() => {
        const pan =
          nextScale <= MIN_SCALE + ZOOM_ACTIVE_EPS
            ? { tx: 0, ty: 0 }
            : clampPan(pinch.initialTx, pinch.initialTy, nextScale);
        return { scale: nextScale, ...pan };
      });
    };

    const endPinch = (): void => {
      pinchRef.current = null;
    };

    window.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
    window.addEventListener('touchmove', onTouchMove, { capture: true, passive: false });
    window.addEventListener('touchend', endPinch, { capture: true });
    window.addEventListener('touchcancel', endPinch, { capture: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart, { capture: true });
      window.removeEventListener('touchmove', onTouchMove, { capture: true });
      window.removeEventListener('touchend', endPinch, { capture: true });
      window.removeEventListener('touchcancel', endPinch, { capture: true });
    };
  }, [clampPan, enabled, touchesInsideViewport]);

  const panTotalMoveRef = useRef(0);
  /** Suppress the next click when it would duplicate a pan end (browsers differ on whether click fires). */
  const suppressNextClickRef = useRef(false);
  /** Removes document-level pan listeners when pan ends or the component unmounts. */
  const detachDocPanListenersRef = useRef<(() => void) | null>(null);

  const toggleClickZoom = useCallback((): void => {
    setTransform((cur) => {
      const zoomed = cur.scale > MIN_SCALE + ZOOM_ACTIVE_EPS;
      if (zoomed) {
        return { scale: MIN_SCALE, tx: 0, ty: 0 };
      }
      const nextScale = 2;
      return { scale: nextScale, ...clampPan(0, 0, nextScale) };
    });
  }, [clampPan]);

  /**
   * Single click when at 1× (no document pan path). When zoomed, toggle runs from document pointerup
   * because pointerdown uses preventDefault and can suppress the click event.
   */
  const onClickZoom = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enabled) {
        return;
      }
      if (suppressNextClickRef.current) {
        suppressNextClickRef.current = false;
        return;
      }
      if (transformLiveRef.current.scale > MIN_SCALE + ZOOM_ACTIVE_EPS) {
        return;
      }
      e.preventDefault();
      toggleClickZoom();
    },
    [enabled, toggleClickZoom],
  );

  /**
   * While zoomed, pan with document-level listeners so move/up still fire after the pointer leaves
   * the viewport and so we can {@link preventDefault} on each move (stops native image drag).
   */
  const onPointerDownPan = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      panTotalMoveRef.current = 0;
      suppressNextClickRef.current = false;
      if (!enabled) {
        return;
      }
      if (transformLiveRef.current.scale <= MIN_SCALE + ZOOM_ACTIVE_EPS) {
        return;
      }
      if (e.pointerType === 'mouse' && e.button !== 0) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      detachDocPanListenersRef.current?.();

      const pointerId = e.pointerId;
      const startX = e.clientX;
      const startY = e.clientY;
      const originTx = transformLiveRef.current.tx;
      const originTy = transformLiveRef.current.ty;

      const move = (ev: PointerEvent): void => {
        if (ev.pointerId !== pointerId) {
          return;
        }
        ev.preventDefault();
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        panTotalMoveRef.current = Math.max(panTotalMoveRef.current, Math.hypot(dx, dy));
        setTransform((prev) => ({
          scale: prev.scale,
          ...clampPan(originTx + dx, originTy + dy, prev.scale),
        }));
      };

      const up = (ev: PointerEvent): void => {
        if (ev.pointerId !== pointerId) {
          return;
        }
        ev.preventDefault();
        document.removeEventListener('pointermove', move, true);
        document.removeEventListener('pointerup', up, true);
        document.removeEventListener('pointercancel', up, true);
        detachDocPanListenersRef.current = null;
        suppressNextClickRef.current = true;
        if (panTotalMoveRef.current <= PAN_STALL_PX) {
          toggleClickZoom();
        }
      };

      document.addEventListener('pointermove', move, { capture: true, passive: false });
      document.addEventListener('pointerup', up, { capture: true });
      document.addEventListener('pointercancel', up, { capture: true });

      detachDocPanListenersRef.current = (): void => {
        document.removeEventListener('pointermove', move, true);
        document.removeEventListener('pointerup', up, true);
        document.removeEventListener('pointercancel', up, true);
        detachDocPanListenersRef.current = null;
      };
    },
    [clampPan, enabled, toggleClickZoom],
  );

  useEffect(() => {
    return (): void => {
      detachDocPanListenersRef.current?.();
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setTransform({ scale: MIN_SCALE, tx: 0, ty: 0 });
    }
  }, [enabled]);

  useLayoutEffect(() => {
    if (resetZoomRef == null || !enabled) {
      return;
    }
    resetZoomRef.current = (): void => {
      setTransform({ scale: MIN_SCALE, tx: 0, ty: 0 });
    };
    return (): void => {
      resetZoomRef.current = null;
    };
  }, [enabled, resetZoomRef]);

  useEffect(() => {
    const el = viewportRef.current;
    if (el == null || !enabled) {
      return;
    }
    const blockDrag = (ev: Event): void => {
      ev.preventDefault();
    };
    el.addEventListener('dragstart', blockDrag, true);
    el.addEventListener('selectstart', blockDrag, true);
    return () => {
      el.removeEventListener('dragstart', blockDrag, true);
      el.removeEventListener('selectstart', blockDrag, true);
    };
  }, [enabled]);

  useEffect(() => {
    const el = viewportRef.current;
    if (el == null || !enabled) {
      return;
    }
    const wheelHandler = (e: WheelEvent): void => {
      if (!e.ctrlKey) {
        return;
      }
      if (!el.contains(e.target as Node)) {
        return;
      }
      e.preventDefault();
      const delta = -e.deltaY * WHEEL_ZOOM_SENSITIVITY;
      setTransform((prev) => {
        const nextScale = clamp(prev.scale * (1 + delta), MIN_SCALE, MAX_SCALE);
        const pan =
          nextScale <= MIN_SCALE + ZOOM_ACTIVE_EPS
            ? { tx: 0, ty: 0 }
            : clampPan(prev.tx, prev.ty, nextScale);
        return { scale: nextScale, ...pan };
      });
    };
    el.addEventListener('wheel', wheelHandler, { passive: false });
    return () => {
      el.removeEventListener('wheel', wheelHandler);
    };
  }, [clampPan, enabled]);

  if (!enabled) {
    return <>{children}</>;
  }

  const zoomed = transform.scale > MIN_SCALE + ZOOM_ACTIVE_EPS;

  return (
    <Viewport
      ref={viewportRef}
      $grab={zoomed}
      onPointerDown={onPointerDownPan}
      onClick={onClickZoom}
      onDragStart={(e) => {
        e.preventDefault();
      }}
    >
      <TransformInner
        ref={transformRef}
        $grab={zoomed}
        style={{
          transform: `translate3d(${transform.tx}px, ${transform.ty}px, 0) scale(${transform.scale})`,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </TransformInner>
    </Viewport>
  );
};

const Viewport = styled.div<{ $grab: boolean }>`
  position: relative;
  width: fit-content;
  max-width: 100%;
  min-height: 0;
  min-width: 0;
  margin-inline: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  touch-action: ${({ $grab }) => ($grab ? 'none' : 'manipulation')};
  user-select: ${({ $grab }) => ($grab ? 'none' : 'auto')};
  cursor: default;
`;

const TransformInner = styled.div<{ $grab: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  will-change: transform;
  -webkit-user-drag: none;
  user-select: none;
  cursor: ${({ $grab }) => ($grab ? 'grab' : 'zoom-in')};

  &:active {
    cursor: ${({ $grab }) => ($grab ? 'grabbing' : 'zoom-in')};
  }
`;
