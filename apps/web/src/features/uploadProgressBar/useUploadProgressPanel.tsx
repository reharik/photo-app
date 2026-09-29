import { FrontendUploadStatus } from '@packages/contracts';
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';

import { useUploadQueue } from '../../contexts/UploadQueueContext';
import { UploadProgressPanel } from './uploadProgressBox';
import {
  getUploadProgressCounts,
  type UploadPanelPhase,
  type UploadProgressCounts,
} from './uploadProgressSummary';

const READY_DISMISS_MS = 2200;
const SUCCESS_DISMISS_MS = 2600;

export type UploadProgressPanelState = {
  /** Something to show: uploads in the queue, or the brief all-done state after the last. */
  isActive: boolean;
  counts: UploadProgressCounts;
  panelPhase: UploadPanelPhase;
  sessionHadFailure: boolean;
  /** Panel hidden behind the header pill. Separate from the panel's own row-list `expanded`. */
  minimized: boolean;
  toggleMinimized: () => void;
  minimize: () => void;
  /** The portaled panel; null while minimized or idle. */
  panel: ReactElement | null;
};

/**
 * The upload widget's lifecycle, kept apart from its view so the panel can be minimized
 * (unmounted) without stopping it: the phase, the auto-removal of finished rows, and the
 * brief all-done state. The shell calls this once and stays mounted; were this state to live
 * in the panel, minimizing would freeze finished rows in place and the pill would never leave.
 */
export const useUploadProgressPanel = (): UploadProgressPanelState => {
  const { items, batchErrors, retryItem, removeItem } = useUploadQueue();
  const [expanded, setExpanded] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [panelPhase, setPanelPhase] = useState<UploadPanelPhase>('idle');
  const [visible, setVisible] = useState(false);
  const readyDismissTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const hadActiveUploadRef = useRef(false);
  const sessionHadFailureRef = useRef(false);
  const previousItemCountRef = useRef(items.length);

  const counts = getUploadProgressCounts(items);
  const isActive = panelPhase !== 'idle' || items.length > 0;

  useEffect(() => {
    if (counts.failed > 0) {
      sessionHadFailureRef.current = true;
    }
  }, [counts.failed]);

  // A new batch opens the panel, even one started while minimized; collapsing is manual.
  useEffect(() => {
    if (items.length > previousItemCountRef.current) {
      setMinimized(false);
    }
    previousItemCountRef.current = items.length;
  }, [items.length]);

  useEffect(() => {
    if (items.length > 0) {
      hadActiveUploadRef.current = true;
      setPanelPhase('active');
      return;
    }

    if (hadActiveUploadRef.current && items.length === 0) {
      hadActiveUploadRef.current = false;
      setExpanded(false);
      setPanelPhase('success');
      const timer = setTimeout(() => {
        setPanelPhase('idle');
        sessionHadFailureRef.current = false;
      }, SUCCESS_DISMISS_MS);
      return () => clearTimeout(timer);
    }
  }, [items.length]);

  useEffect(() => {
    if (!isActive || minimized) {
      setVisible(false);
      return;
    }

    setVisible(false);
    const rafId = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(rafId);
  }, [isActive, minimized, panelPhase, items.length]);

  useEffect(() => {
    for (const item of items) {
      if (!item.status.equals(FrontendUploadStatus.ready)) {
        continue;
      }
      if (readyDismissTimersRef.current.has(item.localId)) {
        continue;
      }
      const timer = setTimeout(() => {
        readyDismissTimersRef.current.delete(item.localId);
        removeItem(item.localId);
      }, READY_DISMISS_MS);
      readyDismissTimersRef.current.set(item.localId, timer);
    }

    for (const [localId, timer] of readyDismissTimersRef.current) {
      const stillReady = items.some(
        (item) => item.localId === localId && item.status.equals(FrontendUploadStatus.ready),
      );
      if (!stillReady) {
        clearTimeout(timer);
        readyDismissTimersRef.current.delete(localId);
      }
    }
  }, [items, removeItem]);

  useEffect(() => {
    return () => {
      for (const timer of readyDismissTimersRef.current.values()) {
        clearTimeout(timer);
      }
      readyDismissTimersRef.current.clear();
    };
  }, []);

  const toggleExpanded = useCallback((): void => {
    setExpanded((value) => !value);
  }, []);

  const toggleMinimized = useCallback((): void => {
    setMinimized((value) => !value);
  }, []);

  const minimize = useCallback((): void => {
    setMinimized(true);
  }, []);

  const panel =
    isActive && !minimized
      ? createPortal(
          <UploadProgressPanel
            items={items}
            batchErrors={batchErrors}
            panelPhase={panelPhase}
            visible={visible}
            expanded={expanded}
            sessionHadFailure={sessionHadFailureRef.current}
            onToggleExpanded={toggleExpanded}
            onRetry={retryItem}
            onRemove={removeItem}
          />,
          document.body,
        )
      : null;

  return {
    isActive,
    counts,
    panelPhase,
    sessionHadFailure: sessionHadFailureRef.current,
    minimized,
    toggleMinimized,
    minimize,
    panel,
  };
};
