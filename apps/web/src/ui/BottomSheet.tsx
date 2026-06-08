import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

import { useVisualViewportBottomInset } from '../hooks/useVisualViewportBottomInset';

const DISMISS_THRESHOLD_PX = 80;
const ENTER_TRANSITION_MS = 300;

export type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: ReactNode;
  maxHeightRatio?: number;
};

export const BottomSheet = (props: BottomSheetProps) => {
  if (!props.open) {
    return null;
  }

  return <BottomSheetContent {...props} />;
};

const BottomSheetContent = ({
  onClose,
  ariaLabel,
  children,
  maxHeightRatio = 0.85,
}: BottomSheetProps) => {
  const keyboardInset = useVisualViewportBottomInset();
  const [isEntered, setIsEntered] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef<number | null>(null);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      setIsEntered(true);
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  const handleScrimClick = useCallback((): void => {
    onClose();
  }, [onClose]);

  const handlePanelClick = useCallback((event: MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation();
  }, []);

  const handleDragPointerDown = useCallback((event: PointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0) {
      return;
    }

    dragStartYRef.current = event.clientY;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const handleDragPointerMove = useCallback((event: PointerEvent<HTMLDivElement>): void => {
    const startY = dragStartYRef.current;
    if (startY == null) {
      return;
    }

    const deltaY = event.clientY - startY;
    setDragOffset(Math.max(0, deltaY));
  }, []);

  const handleDragPointerEnd = useCallback(
    (event: PointerEvent<HTMLDivElement>): void => {
      const startY = dragStartYRef.current;
      dragStartYRef.current = null;
      setIsDragging(false);

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (startY == null) {
        return;
      }

      const deltaY = event.clientY - startY;
      if (deltaY >= DISMISS_THRESHOLD_PX) {
        onClose();
        return;
      }

      setDragOffset(0);
    },
    [onClose],
  );

  const sheet = (
    <Scrim role="presentation" onClick={handleScrimClick}>
      <Panel
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        $maxHeightRatio={maxHeightRatio}
        $isEntered={isEntered}
        $dragOffset={dragOffset}
        $isDragging={isDragging}
        onClick={handlePanelClick}
      >
        <DragHandle
          onPointerDown={handleDragPointerDown}
          onPointerMove={handleDragPointerMove}
          onPointerUp={handleDragPointerEnd}
          onPointerCancel={handleDragPointerEnd}
        >
          <HandleBar />
        </DragHandle>
        <ScrollBody $keyboardInset={keyboardInset}>{children}</ScrollBody>
      </Panel>
    </Scrim>
  );

  return createPortal(sheet, document.body);
};

const Scrim = styled.div`
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.45);
`;

const Panel = styled.div<{
  $maxHeightRatio: number;
  $isEntered: boolean;
  $dragOffset: number;
  $isDragging: boolean;
}>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  max-height: min(${({ $maxHeightRatio }) => $maxHeightRatio * 100}dvh, 100dvh);
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: ${({ theme }) => theme.color.bodyRaised};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-bottom: none;
  border-radius: ${({ theme }) => theme.borderRadius.xl} ${({ theme }) => theme.borderRadius.xl} 0 0;
  box-shadow: ${({ theme }) => theme.boxShadow.lg};
  transform: translateY(
    ${({ $isEntered, $dragOffset }) => ($isEntered ? `${$dragOffset}px` : '100%')}
  );
  transition: ${({ $isDragging }) =>
    $isDragging ? 'none' : `transform ${ENTER_TRANSITION_MS}ms ease`};
`;

const DragHandle = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(1.5)} 0 ${({ theme }) => theme.spacing(1)};
  touch-action: none;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`;

const HandleBar = styled.div`
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: ${({ theme }) => theme.color.bodyTextMuted ?? theme.color.border};
`;

const ScrollBody = styled.div<{ $keyboardInset: number }>`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding-bottom: calc(
    max(${({ theme }) => theme.spacing(4)}, env(safe-area-inset-bottom, 0px)) +
      ${({ $keyboardInset }) => $keyboardInset}px
  );
`;
