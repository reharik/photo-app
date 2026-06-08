import { Heart, Info, MessageCircle } from 'lucide-react';
import styled from 'styled-components';

import type { MobileViewerSheet } from './mediaViewerTypes';
import { viewerChromeVisibility } from './viewerChromeVisibility';

type MobileViewerActionBarProps = {
  chromeVisible: boolean;
  activeSheet: MobileViewerSheet;
  onReact: () => void;
  onComment: () => void;
  onInfo: () => void;
};

export const MobileViewerActionBar = ({
  chromeVisible,
  activeSheet,
  onReact,
  onComment,
  onInfo,
}: MobileViewerActionBarProps) => {
  return (
    <ActionBarRoot $visible={chromeVisible}>
      <ActionButton
        type="button"
        aria-label="React"
        aria-pressed={false}
        onClick={onReact}
      >
        <ActionIcon aria-hidden="true">
          <Heart size={22} strokeWidth={2} />
        </ActionIcon>
        <ActionLabel>React</ActionLabel>
      </ActionButton>
      <ActionButton
        type="button"
        aria-label="Comment"
        aria-pressed={activeSheet === 'comment'}
        onClick={onComment}
      >
        <ActionIcon aria-hidden="true">
          <MessageCircle size={22} strokeWidth={2} />
        </ActionIcon>
        <ActionLabel>Comment</ActionLabel>
      </ActionButton>
      <ActionButton
        type="button"
        aria-label="Info"
        aria-pressed={activeSheet === 'info'}
        onClick={onInfo}
      >
        <ActionIcon aria-hidden="true">
          <Info size={22} strokeWidth={2} />
        </ActionIcon>
        <ActionLabel>Info</ActionLabel>
      </ActionButton>
    </ActionBarRoot>
  );
};

const ActionBarRoot = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 5;
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(2)};
  padding-bottom: max(${({ theme }) => theme.spacing(2)}, env(safe-area-inset-bottom, 0px));
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(255, 255, 255, 0.28);
  ${viewerChromeVisibility}
`;

const ActionButton = styled.button`
  flex: 1;
  min-width: 0;
  min-height: 44px;
  margin: 0;
  padding: ${({ theme }) => theme.spacing(0.75)} ${({ theme }) => theme.spacing(1)};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
  font-size: ${({ theme }) => theme.fontSize._12};
  font-weight: ${({ theme }) => theme.weight.medium};
  line-height: 1.2;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid rgba(255, 255, 255, 0.28);
  color: rgba(255, 255, 255, 0.95);
  background: rgba(0, 0, 0, 0.28);
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;

  &[aria-pressed='true'] {
    background: rgba(255, 255, 255, 0.18);
    border-color: rgba(255, 255, 255, 0.45);
    color: rgba(255, 255, 255, 1);
  }

  &:hover {
    background: rgba(0, 0, 0, 0.42);
    border-color: rgba(255, 255, 255, 0.36);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }
`;

const ActionIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ActionLabel = styled.span`
  display: block;
`;
