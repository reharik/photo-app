import { Check, ChevronUp } from 'lucide-react';
import { useEffect, useId, useRef, type ReactElement } from 'react';
import styled, { keyframes } from 'styled-components';

import type { UploadItem } from '../../application/UploadMediaItemQueue/mediaUploadTypes';
import type { AppError } from '../../domain/errors/errorTypes';
import { formatAppErrorMessage } from '../../domain/errors/formatAppErrorMessage';
import { UploadProgressRow } from './uploadProgressRow';
import {
  getPanelSummary,
  getUploadProgressCounts,
  isUploadWorkOngoing,
  type UploadPanelPhase,
} from './uploadProgressSummary';

const ENTER_MS = 280;

/** Clears fixed app nav (64px) + small gap when portaled to `document.body`. */
const PANEL_TOP_OFFSET = '72px';
const PANEL_TOP_OFFSET_MOBILE = '60px';

/** Stable handle on the panel (the drive-web-app skill and tests select it by id). */
export const UPLOAD_PROGRESS_PANEL_ID = 'upload-progress-panel';

type UploadProgressPanelProps = {
  items: UploadItem[];
  batchErrors: AppError[];
  panelPhase: UploadPanelPhase;
  visible: boolean;
  sessionHadFailure: boolean;
  /** Hides the panel behind the header pill; the uploads carry on. */
  onMinimize: () => void;
  /** The pill that opened this just unmounted; take focus so it isn't dropped on the page. */
  focusMinimizeOnMount: boolean;
  onRetry: (localId: string) => void;
  onRemove: (localId: string) => void;
};

/** The upload panel's view; its lifecycle lives in `useUploadProgressPanel`. */
export const UploadProgressPanel = ({
  items,
  batchErrors,
  panelPhase,
  visible,
  sessionHadFailure,
  onMinimize,
  focusMinimizeOnMount,
  onRetry,
  onRemove,
}: UploadProgressPanelProps): ReactElement => {
  const minimizeButtonRef = useRef<HTMLButtonElement>(null);
  const summaryId = useId();
  useEffect(() => {
    if (focusMinimizeOnMount) {
      minimizeButtonRef.current?.focus();
    }
    // Mount only: the panel mounts once per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = getUploadProgressCounts(items);
  const summary = getPanelSummary(counts, panelPhase, sessionHadFailure);
  const progressPercent = counts.total > 0 ? Math.round((counts.finished / counts.total) * 100) : 0;
  const showSpinner = isUploadWorkOngoing(counts);
  const subSummary =
    panelPhase === 'active' && counts.total > 0
      ? counts.inFlight > 0
        ? `${counts.inFlight} in progress`
        : counts.failed > 0
          ? 'Review failed uploads'
          : counts.processing > 0
            ? 'Finishing up'
            : counts.delayed > 0
              ? 'Still processing'
              : undefined
      : undefined;
  // One line per distinct failure; a batch error normally carries a single message.
  const batchMessages = [...new Set(batchErrors.map(formatAppErrorMessage))];

  return (
    <Panel
      id={UPLOAD_PROGRESS_PANEL_ID}
      role="region"
      aria-label="Upload progress"
      aria-live="polite"
      $visible={visible}
    >
      {/* The whole header is the minimize control: a far bigger tap target than an icon, and
          nothing else lives here. Named for its action; the counts are its description. */}
      <Header
        ref={minimizeButtonRef}
        type="button"
        aria-label="Minimize uploads"
        // Two ids, not the wrapper: separate ids are joined with a space ("0 of 3 3 in
        // progress"), while the wrapper's text runs them together ("0 of 33 in progress").
        aria-describedby={
          subSummary != null ? `${summaryId}-summary ${summaryId}-sub` : `${summaryId}-summary`
        }
        onClick={onMinimize}
      >
        <HeaderLeading>
          {/* Check only once everything is done: next to "N failed" or "Still processing"
                a success mark says the opposite of the text. Same rule as the header pill. */}
          {showSpinner ? (
            <Spinner aria-hidden />
          ) : panelPhase === 'success' ? (
            <SuccessMark aria-hidden>
              <Check size={12} strokeWidth={2.5} aria-hidden />
            </SuccessMark>
          ) : null}
          <HeaderText>
            <SummaryRow>
              <Summary id={`${summaryId}-summary`}>{summary}</Summary>
              {subSummary != null ? (
                <SubSummary id={`${summaryId}-sub`}>{subSummary}</SubSummary>
              ) : null}
            </SummaryRow>
          </HeaderText>
        </HeaderLeading>
        {/* Collapse chevron, never an X: an X reads as "cancel the uploads". */}
        <MinimizeIcon aria-hidden>
          <ChevronUp size={16} strokeWidth={2} aria-hidden />
        </MinimizeIcon>
      </Header>

      {batchMessages.length > 0 ? (
        <BatchBanner role="alert">
          {batchMessages.map((message) => (
            <div key={message}>{message}</div>
          ))}
        </BatchBanner>
      ) : null}

      {panelPhase === 'active' && counts.total > 0 ? (
        <Track aria-hidden>
          <TrackFill $percent={progressPercent} />
        </Track>
      ) : null}

      {/* Always shown: the rows (and their Retry/Dismiss) are why the panel is open at all;
          the summary alone is what the minimized pill already says. */}
      {items.length > 0 ? (
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

const Panel = styled.div<{ $visible: boolean }>`
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

/* Bleeds into the panel's padding (negative margin = its own padding) so the hover/press
   fill has room around the text while the text stays aligned with the rows below. */
const Header = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  width: calc(100% + ${({ theme }) => theme.spacing(2)});
  min-height: 44px;
  margin: -${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(1)};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;

  /* One step down the neutral scale per state from the panel's bodyRaised (gray 15 → 20 → 30).
     The ghost-button hover token is gray 15 itself, i.e. invisible on this panel. */
  &:hover {
    background: ${({ theme }) => theme.color.bodyElevated};
  }

  &:active {
    background: ${({ theme }) => theme.color.border};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 0;
  }
`;

const MinimizeIcon = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
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

  /* Below 360px the panel is ~270px wide and this collided with the summary. The summary
     carries the counts; this only restates them, so it's the one to go. */
  @media (max-width: 359px) {
    display: none;
  }
`;

/** Shared with the header pill so both read as the same widget. */
export const Spinner = styled.span`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border: 2px solid ${({ theme }) => theme.color.border};
  border-top-color: ${({ theme }) => theme.color.textAccent};
  border-radius: 50%;
  animation: ${spin} 0.75s linear infinite;
`;

export const SuccessMark = styled.span`
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

const BatchBanner = styled.div`
  margin-top: ${({ theme }) => theme.spacing(1.5)};
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(1.5)};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: ${({ theme }) => theme.color.alertError};
  color: ${({ theme }) => theme.color.alertErrorText};
  font-size: ${({ theme }) => theme.fontSize._12};
  line-height: 1.35;
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
