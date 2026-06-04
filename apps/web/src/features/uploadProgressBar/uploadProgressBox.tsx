import { FrontendUploadStatus } from '@packages/contracts';
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes } from 'styled-components';

import type { UploadItem } from '../../application/UploadMediaItemQueue/mediaUploadTypes';
import { useUploadQueue } from '../../contexts/UploadQueueContext';
import { UploadProgressRow } from './uploadProgressRow';
import { getCollapsedSummary, getUploadProgressCounts } from './uploadProgressSummary';

const READY_DISMISS_MS = 2200;
const SUCCESS_DISMISS_MS = 2600;
const ENTER_MS = 280;

/** Clears fixed app nav (64px) + small gap when portaled to `document.body`. */
const PANEL_TOP_OFFSET = '72px';
const PANEL_TOP_OFFSET_MOBILE = '60px';

type PanelPhase = 'idle' | 'active' | 'success';

export const UploadProgressBox = (): ReactElement | null => {
  const { items, retryItem, removeItem } = useUploadQueue();
  const [expanded, setExpanded] = useState(false);
  const [panelPhase, setPanelPhase] = useState<PanelPhase>('idle');
  const [visible, setVisible] = useState(false);
  const readyDismissTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const hadActiveUploadRef = useRef(false);
  const sessionHadFailureRef = useRef(false);

  const counts = getUploadProgressCounts(items);

  useEffect(() => {
    if (counts.failed > 0) {
      sessionHadFailureRef.current = true;
    }
  }, [counts.failed]);

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
    const shouldShow = panelPhase !== 'idle' || items.length > 0;
    if (!shouldShow) {
      setVisible(false);
      return;
    }

    setVisible(false);
    const rafId = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(rafId);
  }, [panelPhase, items.length]);

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

  if (panelPhase === 'idle' && items.length === 0) {
    return null;
  }

  return createPortal(
    <UploadProgressPanel
      items={items}
      panelPhase={panelPhase}
      visible={visible}
      expanded={expanded}
      sessionHadFailure={sessionHadFailureRef.current}
      onToggleExpanded={toggleExpanded}
      onRetry={retryItem}
      onRemove={removeItem}
    />,
    document.body,
  );
};

type UploadProgressPanelProps = {
  items: UploadItem[];
  panelPhase: PanelPhase;
  visible: boolean;
  expanded: boolean;
  sessionHadFailure: boolean;
  onToggleExpanded: () => void;
  onRetry: (localId: string) => void;
  onRemove: (localId: string) => void;
};

const UploadProgressPanel = ({
  items,
  panelPhase,
  visible,
  expanded,
  sessionHadFailure,
  onToggleExpanded,
  onRetry,
  onRemove,
}: UploadProgressPanelProps): ReactElement => {
  const counts = getUploadProgressCounts(items);
  const summary =
    panelPhase === 'success'
      ? getCollapsedSummary(counts, 'success', sessionHadFailure)
      : getCollapsedSummary(counts, 'active');
  const progressPercent = counts.total > 0 ? Math.round((counts.finished / counts.total) * 100) : 0;
  const showSpinner = counts.inFlight > 0 || counts.processing > 0;
  const subSummary =
    panelPhase === 'active' && counts.total > 0
      ? counts.inFlight > 0
        ? `${counts.inFlight} in progress`
        : counts.failed > 0
          ? 'Review failed uploads'
          : counts.processing > 0
            ? 'Finishing up'
            : undefined
      : undefined;

  return (
    <Panel
      role="region"
      aria-label="Upload progress"
      aria-live="polite"
      $visible={visible}
      $expanded={expanded}
    >
      <Header>
        <HeaderButton type="button" onClick={onToggleExpanded} aria-expanded={expanded}>
          <HeaderLeading>
            {showSpinner ? <Spinner aria-hidden /> : <SuccessMark aria-hidden>✓</SuccessMark>}
            <HeaderText>
              <SummaryRow>
                <Summary>{summary}</Summary>
                {subSummary != null ? <SubSummary>{subSummary}</SubSummary> : null}
              </SummaryRow>
            </HeaderText>
          </HeaderLeading>
          <Chevron aria-hidden $expanded={expanded}>
            ▾
          </Chevron>
        </HeaderButton>
      </Header>

      {panelPhase === 'active' && counts.total > 0 ? (
        <Track aria-hidden>
          <TrackFill $percent={progressPercent} />
        </Track>
      ) : null}

      {expanded && items.length > 0 ? (
        <ItemList>
          {items.map((item) => (
            <UploadProgressRow
              key={item.localId}
              item={item}
              onRetry={() => onRetry(item.localId)}
              onRemove={() => onRemove(item.localId)}
            />
          ))}
        </ItemList>
      ) : null}
    </Panel>
  );
};

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const Panel = styled.div<{ $visible: boolean; $expanded: boolean }>`
  position: fixed;
  top: ${PANEL_TOP_OFFSET};
  right: ${({ theme }) => theme.spacing(3)};
  z-index: 9990;
  width: min(360px, calc(100vw - ${({ theme }) => theme.spacing(6)}));
  background: ${({ theme }) => theme.color.bodyRaised};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.boxShadow.lg};
  padding: ${({ theme }) => theme.spacing(2)};
  transform: translateY(${(p) => (p.$visible ? 0 : '-12px')});
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transition:
    opacity ${ENTER_MS}ms ease,
    transform ${ENTER_MS}ms ease;

  @media (max-width: 768px) {
    top: ${PANEL_TOP_OFFSET_MOBILE};
    right: ${({ theme }) => theme.spacing(2)};
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
`;

const HeaderButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  width: 100%;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.borderRadius.sm};
  }
`;

const HeaderLeading = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  min-width: 0;
  flex: 1;
`;

const HeaderText = styled.div`
  flex: 1;
  min-width: 0;
`;

const SummaryRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  width: 100%;
  min-width: 0;
`;

const Summary = styled.div`
  min-width: 0;
  font-size: ${({ theme }) => theme.fontSize._14};
  font-weight: ${({ theme }) => theme.weight.semi};
  color: ${({ theme }) => theme.color.bodyText};
  white-space: nowrap;
`;

const SubSummary = styled.div`
  flex-shrink: 0;
  font-size: ${({ theme }) => theme.fontSize._12};
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  white-space: nowrap;
`;

const Chevron = styled.span<{ $expanded: boolean }>`
  flex-shrink: 0;
  font-size: 10px;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  transform: rotate(${(p) => (p.$expanded ? '180deg' : '0')});
  transition: transform 0.15s ease;
`;

const Spinner = styled.span`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border: 2px solid ${({ theme }) => theme.color.border};
  border-top-color: ${({ theme }) => theme.color.textAccent};
  border-radius: 50%;
  animation: ${spin} 0.75s linear infinite;
`;

const SuccessMark = styled.span`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: ${({ theme }) => theme.weight.bold};
  color: ${({ theme }) => theme.color.alertSuccessText};
  background: ${({ theme }) => theme.color.bodyElevated};
  border-radius: 50%;
`;

const Track = styled.div`
  margin-top: ${({ theme }) => theme.spacing(1.5)};
  height: 3px;
  border-radius: 999px;
  background: ${({ theme }) => theme.color.bodyElevated};
  overflow: hidden;
`;

const TrackFill = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  border-radius: inherit;
  background: ${({ theme }) => theme.color.textAccent};
  transition: width 0.3s ease;
`;

const ItemList = styled.div`
  margin-top: ${({ theme }) => theme.spacing(2)};
  padding-top: ${({ theme }) => theme.spacing(1)};
  border-top: 1px solid ${({ theme }) => theme.color.border};
  max-height: 240px;
  overflow-y: auto;
`;
