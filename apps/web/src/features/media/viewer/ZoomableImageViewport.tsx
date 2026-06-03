import {
  useCallback,
  useLayoutEffect,
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

export type ZoomableImageViewportProps = {
  /** When false, children are rendered without zoom behavior. */
  enabled: boolean;
  /** True while scale is meaningfully above 1 (for disabling outer swipe / tap navigation). */
  onZoomActiveChange?: (zoomActive: boolean) => void;
  /** Set to a function that resets zoom to 1× (used with Escape from the parent screen). */
  resetZoomRef?: MutableRefObject<(() => void) | null>;
  children: ReactNode;
};

const isZoomedScale = (scale: number): boolean => {
  return scale > MIN_SCALE + ZOOM_ACTIVE_EPS;
};

export const ZoomableImageViewport = ({
  enabled,
  onZoomActiveChange,
  resetZoomRef,
  children,
}: ZoomableImageViewportProps): ReactNode => {
  const [zoomed, setZoomed] = useState(false);

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

  useLayoutEffect(() => {
    if (!enabled) {
      setZoomed(false);
      onZoomActiveChange?.(false);
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
          disabled: false,
          mode: 'toggle',
          step: 1,
          animationTime: 200,
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
          }}
          contentStyle={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
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
  cursor: ${({ $grab }) => ($grab ? 'grab' : 'zoom-in')};

  &:active {
    cursor: ${({ $grab }) => ($grab ? 'grabbing' : 'zoom-in')};
  }
`;
