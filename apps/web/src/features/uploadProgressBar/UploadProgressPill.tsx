import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, type ReactElement } from 'react';
import styled from 'styled-components';

import { Spinner, SuccessMark } from './uploadProgressBox';
import {
  getPanelSummary,
  isUploadWorkOngoing,
  type UploadPanelPhase,
  type UploadProgressCounts,
} from './uploadProgressSummary';

type UploadProgressPillProps = {
  counts: UploadProgressCounts;
  panelPhase: UploadPanelPhase;
  sessionHadFailure: boolean;
  /** The panel's minimize button just unmounted; take focus so it isn't dropped on the page. */
  focusOnMount: boolean;
  onOpen: () => void;
};

/**
 * The minimized upload widget: shown only while the panel is hidden, never alongside it, so
 * it does one thing — open the panel. It sits in the header's flow, so unlike the panel it
 * can't cover anything.
 */
export const UploadProgressPill = ({
  counts,
  panelPhase,
  sessionHadFailure,
  focusOnMount,
  onOpen,
}: UploadProgressPillProps): ReactElement => {
  const summary = getPanelSummary(counts, panelPhase, sessionHadFailure);
  const isSuccess = panelPhase === 'success';
  const pillRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (focusOnMount) {
      pillRef.current?.focus();
    }
    // Mount only: the pill mounts once per minimize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Pill ref={pillRef} type="button" aria-label={`Open uploads: ${summary}`} onClick={onOpen}>
        {isUploadWorkOngoing(counts) ? <PillSpinner aria-hidden /> : null}
        {isSuccess ? (
          <PillSuccessMark aria-hidden>
            <Check size={10} strokeWidth={2.5} aria-hidden />
          </PillSuccessMark>
        ) : (
          <PillText aria-hidden>{summary}</PillText>
        )}
        <ChevronDown size={14} strokeWidth={2} aria-hidden />
      </Pill>
      {/* The panel is the live region while open; minimized, the pill is what's on screen,
          so status changes are announced here. */}
      <VisuallyHidden role="status">{summary}</VisuallyHidden>
    </>
  );
};

const Pill = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  height: 28px;
  margin: 0;
  padding: 0 ${({ theme }) => theme.spacing(1)};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: 999px;
  background: ${({ theme }) => theme.color.body};
  color: ${({ theme }) => theme.color.bodyText};
  font-size: ${({ theme }) => theme.fontSize._12};
  font-weight: ${({ theme }) => theme.weight.medium};
  white-space: nowrap;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }
`;

const PillSpinner = styled(Spinner)`
  width: 14px;
  height: 14px;
`;

const PillSuccessMark = styled(SuccessMark)`
  width: 16px;
  height: 16px;
`;

const PillText = styled.span`
  line-height: 1;
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
`;
