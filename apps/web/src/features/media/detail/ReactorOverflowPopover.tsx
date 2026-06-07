import { type JSX, type RefObject, useEffect, useRef } from 'react';
import styled from 'styled-components';
import type { ReactorVM } from '../../../viewModels';
import { displayNameForReactor, sortReactorsForDisplay } from './formatReactorLine';
import { railPopoverBackground } from './reactionPopoverStyles';

export type ReactorOverflowPopoverProps = {
  reactors: ReactorVM[];
  isOpen: boolean;
  onClose: () => void;
  /** Clicks inside the anchor (trigger + bridge) do not dismiss. */
  anchorRef: RefObject<HTMLElement | null>;
};

export const ReactorOverflowPopover = ({
  reactors,
  isOpen,
  onClose,
  anchorRef,
}: ReactorOverflowPopoverProps): JSX.Element | null => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) {
        return;
      }
      onClose();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [anchorRef, isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const sorted = sortReactorsForDisplay(reactors);

  return (
    <Panel ref={panelRef} role="tooltip">
      <NameList>
        {sorted.map((reactor) => (
          <NameItem key={reactor.userId}>{displayNameForReactor(reactor)}</NameItem>
        ))}
      </NameList>
    </Panel>
  );
};

const Panel = styled.div`
  position: relative;
  z-index: 20;
  min-width: 120px;
  max-width: 220px;
  max-height: 240px;
  overflow-y: auto;
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${railPopoverBackground};
  color: ${({ theme }) => theme.color.primaryButtonText};
  box-shadow: ${({ theme }) => theme.boxShadow.md};
`;

const NameList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const NameItem = styled.li`
  font-size: 11px;
  font-weight: ${({ theme }) => theme.weight.medium};
  line-height: 1.3;
  white-space: nowrap;
`;
