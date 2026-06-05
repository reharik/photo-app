import { NavLink, useLocation } from 'react-router-dom';
import styled, { css } from 'styled-components';

export type NavigationLinkItem = {
  label: string;
  to: string;
  /** When set, active if pathname is in this list (e.g. Recent on `/` and `/media`). */
  activePaths?: string[];
};

export type NavigationProps = {
  links: NavigationLinkItem[];
  /** Inline row (desktop) vs full-width stack (mobile sheet). */
  variant?: 'inline' | 'stacked';
  /** Called after a navigation link is activated (e.g. close mobile menu). */
  onLinkClick?: () => void;
};

const isLinkActive = (link: NavigationLinkItem, pathname: string): boolean => {
  if (link.activePaths != null && link.activePaths.length > 0) {
    return link.activePaths.includes(pathname);
  }
  return pathname === link.to;
};

export const Navigation = (props: NavigationProps) => {
  const { links, variant = 'inline', onLinkClick } = props;
  const location = useLocation();
  const stacked = variant === 'stacked';

  return (
    <StyledNavigation $stacked={stacked}>
      <StyledNavLinks $stacked={stacked}>
        {links.map((x) => {
          const active = isLinkActive(x, location.pathname);
          return (
            <StyledNavLink
              to={x.to}
              key={x.label}
              $stacked={stacked}
              $active={active}
              onClick={() => {
                onLinkClick?.();
              }}
            >
              {x.label}
            </StyledNavLink>
          );
        })}
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
  gap: ${({ $stacked, theme }) => ($stacked ? 0 : theme.spacing(3))};
  flex-direction: ${({ $stacked }) => ($stacked ? 'column' : 'row')};
  align-items: ${({ $stacked }) => ($stacked ? 'stretch' : 'center')};
`;

const StyledNavLink = styled(NavLink)<{ $stacked: boolean; $active: boolean }>`
  padding: ${({ theme }) => theme.spacing(0.5)} ${({ theme }) => theme.spacing(1)};
  color: ${({ $active, theme }) =>
    $active ? theme.color.bodyText : theme.color.bodyTextMuted};
  font-size: ${({ theme }) => theme.fontSize._13};
  font-weight: ${({ $active, theme }) => ($active ? theme.weight.medium : theme.weight.regular)};
  text-decoration: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: transparent;
  transition: color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.color.bodyText};
  }

  ${({ $stacked, theme }) =>
    $stacked
      ? css`
          display: block;
          width: 100%;
          padding: ${theme.spacing(1)};
        `
      : undefined}
`;
