import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch';
import styled from 'styled-components';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_ACTIVE_EPS = 0.02;
/** Double-tap zoom target (~2.7× with smooth scaling). */
const DOUBLE_TAP_ZOOM_STEP = 1;
const DOUBLE_TAP_MAX_INTERVAL_MS = 300;
const DOUBLE_TAP_MAX_DISTANCE_PX = 30;
const DOUBLE_TAP_ANIMATION_MS = 200;

export type ZoomableImageViewportProps = {
  /** When false, children are rendered without zoom behavior. */
  enabled: boolean;
  /** True while scale is meaningfully above 1 (for disabling outer swipe / tap navigation). */
  onZoomActiveChange?: (zoomActive: boolean) => void;
  /** Set to a function that resets zoom to 1× (used with Escape from the parent screen). */
  resetZoomRef?: MutableRefObject<(() => void) | null>;
  /** Called when a double-tap is confirmed (e.g. cancel deferred single-tap chrome toggle). */
  onDoubleTapRecognized?: () => void;
  children: ReactNode;
};

const isZoomedScale = (scale: number): boolean => {
  return scale > MIN_SCALE + ZOOM_ACTIVE_EPS;
};

export const ZoomableImageViewport = ({
  enabled,
  onZoomActiveChange,
  resetZoomRef,
  onDoubleTapRecognized,
  children,
}: ZoomableImageViewportProps): ReactNode => {
  const [zoomed, setZoomed] = useState(false);
  const controlsRef = useRef<ReactZoomPanPinchRef | null>(null);
  const [tapTargetNode, setTapTargetNode] = useState<HTMLDivElement | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);

  const syncZoomActive = useCallback(
    (scale: number): void => {
      const nextZoomed = isZoomedScale(scale);
      setZoomed(nextZoomed);
      onZoomActiveChange?.(nextZoomed);
    },
    [onZoomActiveChange],
  );

  const handleInit = useCallback(
    (ref: ReactZoomPanPinchRef): void => {
      controlsRef.current = ref;
      syncZoomActive(ref.state.scale);
      if (resetZoomRef != null) {
        resetZoomRef.current = (): void => {
          ref.resetTransform();
        };
      }
    },
    [resetZoomRef, syncZoomActive],
  );

  const handleTransform = useCallback(
    (_ref: ReactZoomPanPinchRef, state: { scale: number }): void => {
      syncZoomActive(state.scale);
    },
    [syncZoomActive],
  );

  const handleDoubleTapZoom = useCallback((clientX: number, clientY: number): void => {
    const controls = controlsRef.current;
    if (controls == null) {
      return;
    }

    const currentScale = controls.state.scale;

    if (isZoomedScale(currentScale)) {
      controls.resetTransform(DOUBLE_TAP_ANIMATION_MS, 'easeOut');
      return;
    }

    const contentEl = controls.instance.contentComponent;
    if (contentEl == null) {
      return;
    }

    const targetScale = Math.min(Math.exp(DOUBLE_TAP_ZOOM_STEP), MAX_SCALE);
    const rect = contentEl.getBoundingClientRect();
    const mouseX = (clientX - rect.left) / currentScale;
    const mouseY = (clientY - rect.top) / currentScale;
    const scaleDiff = targetScale - currentScale;
    const newPositionX = controls.state.positionX - mouseX * scaleDiff;
    const newPositionY = controls.state.positionY - mouseY * scaleDiff;

    controls.setTransform(
      newPositionX,
      newPositionY,
      targetScale,
      DOUBLE_TAP_ANIMATION_MS,
      'easeOut',
    );
  }, []);

  const tryRecognizeDoubleTap = useCallback(
    (clientX: number, clientY: number): boolean => {
      const now = performance.now();
      const lastTap = lastTapRef.current;

      if (lastTap != null) {
        const elapsed = now - lastTap.time;
        const distance = Math.hypot(clientX - lastTap.x, clientY - lastTap.y);

        if (elapsed <= DOUBLE_TAP_MAX_INTERVAL_MS && distance <= DOUBLE_TAP_MAX_DISTANCE_PX) {
          lastTapRef.current = null;
          onDoubleTapRecognized?.();
          handleDoubleTapZoom(clientX, clientY);
          return true;
        }
      }

      lastTapRef.current = { time: now, x: clientX, y: clientY };
      return false;
    },
    [handleDoubleTapZoom, onDoubleTapRecognized],
  );

  useEffect(() => {
    if (tapTargetNode == null || !enabled) {
      return;
    }

    const onTouchStart = (event: TouchEvent): void => {
      if (event.touches.length !== 1) {
        lastTapRef.current = null;
        return;
      }

      const touch = event.touches[0];
      if (tryRecognizeDoubleTap(touch.clientX, touch.clientY)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    const onPointerDown = (event: PointerEvent): void => {
      if (event.pointerType === 'touch' || !event.isPrimary || event.button !== 0) {
        return;
      }

      if (tryRecognizeDoubleTap(event.clientX, event.clientY)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    tapTargetNode.addEventListener('touchstart', onTouchStart, { capture: true, passive: false });
    tapTargetNode.addEventListener('pointerdown', onPointerDown, { capture: true });

    return (): void => {
      tapTargetNode.removeEventListener('touchstart', onTouchStart, { capture: true });
      tapTargetNode.removeEventListener('pointerdown', onPointerDown, { capture: true });
    };
  }, [enabled, tapTargetNode, tryRecognizeDoubleTap]);

  useLayoutEffect(() => {
    if (!enabled) {
      setZoomed(false);
      onZoomActiveChange?.(false);
      controlsRef.current = null;
      if (resetZoomRef != null) {
        resetZoomRef.current = null;
      }
    }
  }, [enabled, onZoomActiveChange, resetZoomRef]);

  useLayoutEffect(() => {
    return (): void => {
      if (resetZoomRef != null) {
        resetZoomRef.current = null;
      }
    };
  }, [resetZoomRef]);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <Viewport $grab={zoomed}>
      <TransformWrapper
        initialScale={MIN_SCALE}
        minScale={MIN_SCALE}
        maxScale={MAX_SCALE}
        limitToBounds
        centerOnInit
        centerZoomedOut
        smooth
        panning={{
          disabled: false,
          velocityDisabled: false,
        }}
        pinch={{
          disabled: false,
          allowPanning: true,
        }}
        doubleClick={{
          disabled: true,
        }}
        wheel={{
          step: 0.12,
        }}
        onInit={handleInit}
        onTransform={handleTransform}
      >
        <TransformComponent
          wrapperStyle={{
            width: 'fit-content',
            maxWidth: '100%',
            overflow: 'hidden',
            touchAction: 'none',
          }}
          contentStyle={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DoubleTapTarget ref={setTapTargetNode}>{children}</DoubleTapTarget>
        </TransformComponent>
      </TransformWrapper>
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
  touch-action: none;
  cursor: ${({ $grab }) => ($grab ? 'grab' : 'default')};

  &:active {
    cursor: ${({ $grab }) => ($grab ? 'grabbing' : 'default')};
  }
`;

const DoubleTapTarget = styled.div`
  position: relative;
  display: block;
  line-height: 0;
  width: fit-content;
  max-width: 100%;
  min-width: 0;
  touch-action: none;
`;
