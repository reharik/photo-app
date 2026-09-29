import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { ReactElement } from 'react';
import styled from 'styled-components';

import { Spinner, SuccessMark, UPLOAD_PROGRESS_PANEL_ID } from './uploadProgressBox';
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
  minimized: boolean;
  onToggle: () => void;
};

/**
 * The upload widget's place in the header: it sits in the header's flow, so unlike the panel
 * it can't cover anything. Toggles the panel open and minimized. Chevrons only, never an X —
 * minimizing hides the panel; the uploads carry on.
 */
export const UploadProgressPill = ({
  counts,
  panelPhase,
  sessionHadFailure,
  minimized,
  onToggle,
}: UploadProgressPillProps): ReactElement => {
  const summary = getPanelSummary(counts, panelPhase, sessionHadFailure);
  const isSuccess = panelPhase === 'success';
  const Chevron = minimized ? ChevronDown : ChevronUp;

  return (
    <>
      <Pill
        type="button"
        aria-expanded={!minimized}
        aria-controls={UPLOAD_PROGRESS_PANEL_ID}
        aria-label={`Uploads: ${summary}`}
        onClick={onToggle}
      >
        {isUploadWorkOngoing(counts) ? <PillSpinner aria-hidden /> : null}
        {isSuccess ? (
          <PillSuccessMark aria-hidden>
            <Check size={10} strokeWidth={2.5} aria-hidden />
          </PillSuccessMark>
        ) : (
          <PillText aria-hidden>{summary}</PillText>
        )}
        <Chevron size={14} strokeWidth={2} aria-hidden />
      </Pill>
      {/* The panel is the live region while open; minimized, status changes are announced here. */}
      {minimized ? <VisuallyHidden role="status">{summary}</VisuallyHidden> : null}
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
