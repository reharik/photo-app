import { NavLink } from 'react-router-dom';
import styled, { css } from 'styled-components';

export type NavigationLinkItem = { label: string; to: string };

export type NavigationProps = {
  links: NavigationLinkItem[];
  /** Inline row (desktop) vs full-width stack (mobile sheet). */
  variant?: 'inline' | 'stacked';
  /** Called after a navigation link is activated (e.g. close mobile menu). */
  onLinkClick?: () => void;
};

export const Navigation = (props: NavigationProps) => {
  const { links, variant = 'inline', onLinkClick } = props;
  const stacked = variant === 'stacked';

  return (
    <StyledNavigation $stacked={stacked}>
      <StyledNavLinks $stacked={stacked}>
        {links.map((x) => (
          <StyledNavLink
            to={x.to}
            key={x.label}
            $stacked={stacked}
            onClick={() => {
              onLinkClick?.();
            }}
          >
            {x.label}
          </StyledNavLink>
        ))}
      </StyledNavLinks>
    </StyledNavigation>
  );
};

const StyledNavigation = styled.div<{ $stacked: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(6)};
  min-width: 0;

  ${({ $stacked }) =>
    $stacked
      ? css`
          flex-direction: column;
          align-items: stretch;
          gap: 0;
          width: 100%;
        `
      : css`
          @media (max-width: 768px) {
            gap: ${({ theme }) => theme.spacing(1)};
          }
        `}
`;

const StyledNavLinks = styled.div<{ $stacked: boolean }>`
  display: flex;
  gap: ${({ $stacked, theme }) => ($stacked ? 0 : theme.spacing(1))};
  flex-direction: ${({ $stacked }) => ($stacked ? 'column' : 'row')};
`;

const StyledNavLink = styled(NavLink)<{ $stacked: boolean }>`
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  font-size: 14px;
  text-decoration: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  transition:
    background 0.2s ease,
    color 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.color.bodyText};
    background: ${({ theme }) => theme.color.body};
  }

  &.active {
    color: ${({ theme }) => theme.color.bodyText};
    background: ${({ theme }) => theme.color.body};
  }

  ${({ $stacked, theme }) =>
    $stacked
      ? css`
          display: block;
          width: 100%;
          padding: ${theme.spacing(1)};
          font-size: 15px;
          border-radius: ${theme.borderRadius.md};
        `
      : css`
          @media (max-width: 768px) {
            padding: ${theme.spacing(0.5)} ${theme.spacing(1.5)};
            font-size: 13px;
          }
        `}
`;
