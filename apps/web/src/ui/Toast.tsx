import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

const EXIT_MS = 280;
const DISPLAY_MS = 3000;

type ToastProps = {
  message?: string;
  onDismiss: () => void;
};

export const Toast = ({ message = 'Changes saved', onDismiss }: ToastProps): ReactElement => {
  const [shown, setShown] = useState(false);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishedRef = useRef(false);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const finish = useCallback((): void => {
    if (finishedRef.current) {
      return;
    }
    finishedRef.current = true;
    onDismissRef.current();
  }, []);

  const startExit = useCallback((): void => {
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    setShown(false);
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
    }
    exitTimerRef.current = setTimeout(finish, EXIT_MS);
  }, [finish]);

  useEffect(() => {
    finishedRef.current = false;
    setShown(false);

    const clearTimers = (): void => {
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };

    const rafId = requestAnimationFrame(() => setShown(true));
    autoTimerRef.current = setTimeout(startExit, DISPLAY_MS);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimers();
    };
  }, [message, startExit]);

  const bar = (
    <Bar role="status" aria-live="polite" $shown={shown}>
      <Text>{message}</Text>
      <Close type="button" aria-label="Dismiss notification" onClick={startExit}>
        ×
      </Close>
    </Bar>
  );

  return createPortal(bar, document.body);
};

const Bar = styled.div<{ $shown: boolean }>`
  position: fixed;
  bottom: ${({ theme }) => theme.spacing(4)};
  left: 50%;
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  max-width: min(420px, calc(100vw - ${({ theme }) => theme.spacing(6)}));
  padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(3)};
  background: ${({ theme }) => theme.color.body};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateX(-50%) translateY(${(p) => (p.$shown ? 0 : '18px')});
  opacity: ${(p) => (p.$shown ? 1 : 0)};
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
`;

const Text = styled.span`
  flex: 1;
  min-width: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.color.bodyText};
`;

const Close = styled.button`
  flex-shrink: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.color.bodyTextMuted ?? theme.color.bodyText};
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
`;
