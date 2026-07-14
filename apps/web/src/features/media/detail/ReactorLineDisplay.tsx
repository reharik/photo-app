import { type JSX, useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import type { ReactorLine } from './formatReactorLine';
import { ReactorOverflowPopover } from './ReactorOverflowPopover';

const MOBILE_LAYOUT_MEDIA = '(max-width: 968px)';
const HOVER_CLOSE_DELAY_MS = 200;

export type ReactorLineDisplayProps = {
  reactorLine: ReactorLine;
};

export const ReactorLineDisplay = ({ reactorLine }: ReactorLineDisplayProps): JSX.Element => {
  const isMobileLayout = useMediaQuery(MOBILE_LAYOUT_MEDIA);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overflowAnchorRef = useRef<HTMLSpanElement>(null);
  const { inlineNames, overflowCount, allReactors } = reactorLine;
  const hasOverflow = overflowCount > 0;

  const clearCloseTimer = useCallback((): void => {
    if (closeTimerRef.current != null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openPopover = useCallback((): void => {
    clearCloseTimer();
    setPopoverOpen(true);
  }, [clearCloseTimer]);

  const closePopover = useCallback((): void => {
    clearCloseTimer();
    setPopoverOpen(false);
  }, [clearCloseTimer]);

  const scheduleClosePopover = useCallback((): void => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setPopoverOpen(false);
    }, HOVER_CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  const handleOverflowClick = (): void => {
    if (!isMobileLayout) {
      return;
    }
    setPopoverOpen((open) => !open);
  };

  const handleLineMouseEnter = (): void => {
    if (isMobileLayout || !hasOverflow) {
      return;
    }
    openPopover();
  };

  const handleLineMouseLeave = (): void => {
    if (isMobileLayout || !hasOverflow) {
      return;
    }
    scheduleClosePopover();
  };

  const handlePopoverMouseEnter = (): void => {
    if (isMobileLayout) {
      return;
    }
    openPopover();
  };

  const handlePopoverMouseLeave = (): void => {
    if (isMobileLayout) {
      return;
    }
    scheduleClosePopover();
  };

  const nameLine = (
    <>
      <ReactorName>{inlineNames[0]}</ReactorName>
      {inlineNames.length === 2 && overflowCount === 0 ? (
        <>
          <LineMuted> and </LineMuted>
          <ReactorName>{inlineNames[1]}</ReactorName>
        </>
      ) : null}
      {inlineNames.length === 2 && overflowCount > 0 ? (
        <>
          <LineMuted>, </LineMuted>
          <ReactorName>{inlineNames[1]}</ReactorName>
        </>
      ) : null}
      {hasOverflow ? (
        <OverflowTrigger type="button" onClick={handleOverflowClick} aria-expanded={popoverOpen}>
          +{overflowCount}
        </OverflowTrigger>
      ) : null}
    </>
  );

  return (
    <LineText>
      {hasOverflow ? (
        <OverflowAnchor
          ref={overflowAnchorRef}
          onMouseEnter={handleLineMouseEnter}
          onMouseLeave={handleLineMouseLeave}
        >
          {nameLine}
          <PopoverWrap
            onMouseEnter={handlePopoverMouseEnter}
            onMouseLeave={handlePopoverMouseLeave}
          >
            <ReactorOverflowPopover
              reactors={allReactors}
              isOpen={popoverOpen}
              onClose={closePopover}
              anchorRef={overflowAnchorRef}
            />
          </PopoverWrap>
        </OverflowAnchor>
      ) : (
        nameLine
      )}
      <ReactedSuffix> reacted</ReactedSuffix>
    </LineText>
  );
};

const LineText = styled.span`
  display: inline;
  font-size: ${({ theme }) => theme.fontSize._14};
  line-height: 1.4;
`;

const LineMuted = styled.span`
  color: ${({ theme }) => theme.color.textSecondary};
`;

const ReactorName = styled.span`
  color: ${({ theme }) => theme.color.textAccent};

  &:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`;

const OverflowAnchor = styled.span`
  position: relative;
  display: inline;
`;

const OverflowTrigger = styled.button`
  all: unset;
  display: inline;
  cursor: pointer;
  color: ${({ theme }) => theme.color.textAccent};
  font-size: inherit;
  line-height: inherit;
  margin-inline: ${({ theme }) => theme.spacing(0.5)};

  &:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.borderRadius.sm};
  }
`;

const ReactedSuffix = styled.span`
  color: ${({ theme }) => theme.color.textSecondary};
  margin-inline-start: ${({ theme }) => theme.spacing(0.5)};
`;

/** Padding bridges the gap so desktop hover does not flicker between trigger and panel. */
const PopoverWrap = styled.span`
  position: absolute;
  left: 0;
  top: 100%;
  padding-top: 4px;
  display: block;
`;
