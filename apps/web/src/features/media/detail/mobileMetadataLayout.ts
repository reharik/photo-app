import styled, { css } from 'styled-components';

const MOBILE_LAYOUT_MEDIA = '(max-width: 968px)';

const mobileCardChrome = css`
  @media ${MOBILE_LAYOUT_MEDIA} {
    background: ${({ theme }) => theme.color.bodyRaised};
    border: 1px solid ${({ theme }) => theme.color.border};
    border-radius: ${({ theme }) => theme.borderRadius.xl};
    box-shadow: ${({ theme }) => theme.boxShadow.md};
    padding: ${({ theme }) => theme.spacing(4)};
    padding-bottom: max(${({ theme }) => theme.spacing(4)}, env(safe-area-inset-bottom, 0px));
    overflow: hidden;
  }
`;

/** Desktop: unified rail. Mobile: transparent stack spacing two cream cards. */
export const MetadataPanelStack = styled.aside`
  width: 340px;
  flex-shrink: 0;
  align-self: stretch;
  background: ${({ theme }) => theme.color.bodyRaised};
  border-left: 1px solid ${({ theme }) => theme.color.border};
  padding: ${({ theme }) => theme.spacing(4)};
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};

  @media ${MOBILE_LAYOUT_MEDIA} {
    width: min(960px, calc(100% - ${({ theme }) => theme.spacing(8)}));
    max-width: 960px;
    margin-inline: auto;
    border: none;
    background: transparent;
    box-shadow: none;
    padding: 0;
    gap: ${({ theme }) => theme.spacing(2)};
    flex: 0 0 auto;
    overflow: visible;
    padding-bottom: max(${({ theme }) => theme.spacing(6)}, env(safe-area-inset-bottom, 0px));
  }
`;

/** Moment, title, description, photo details (mobile); same block in desktop rail order. */
export const DescriptiveMetadataZone = styled.div<{ $hiddenOnMobile?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};

  ${mobileCardChrome}

  ${({ $hiddenOnMobile }) =>
    $hiddenOnMobile
      ? css`
          @media ${MOBILE_LAYOUT_MEDIA} {
            display: none;
          }
        `
      : undefined}
`;

/** Reactions + comments — always visible on mobile. */
export const ConversationMetadataZone = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};

  ${mobileCardChrome}
`;

export const RailHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-end;
`;

export const DetailsPanelCloseButton = styled.button`
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  background: ${({ theme }) => theme.color.body};
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    color 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.color.primaryButtonBg};
    color: ${({ theme }) => theme.color.bodyText};
    background: ${({ theme }) => theme.color.bodyRaised};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }

  @media ${MOBILE_LAYOUT_MEDIA} {
    display: none;
  }
`;

export const CommentsSection = styled.div<{ $showTopRule?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-top: ${({ $showTopRule = true, theme }) => ($showTopRule ? theme.spacing(1) : 0)};
  border-top: ${({ $showTopRule = true, theme }) =>
    $showTopRule ? `1px solid ${theme.color.border}` : 'none'};
`;
