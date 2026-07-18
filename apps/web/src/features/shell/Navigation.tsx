import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { AnchoredMenu } from '../../ui/AnchoredMenu';
import { UnseenDot } from '../../ui/UnseenDot';

export type NavigationChildItem = {
  label: string;
  to: string;
  activePaths?: string[];
  /** Show an unseen-activity dot on this specific child row. */
  hasUnseen?: boolean;
};

export type NavigationLinkItem = {
  label: string;
  to: string;
  activePaths?: string[];
  /**
   * Also mark active when the path equals this prefix or is nested under it — keeps the
   * item selected on its detail routes (e.g. `/albums` stays active on `/albums/:id`).
   * Scoped per-item, so `/shared/*` siblings (which have no prefix) are unaffected.
   */
  activePrefix?: string;
  /** Show an unseen-activity dot on this top-level link. */
  hasUnseen?: boolean;
};

export type NavigationParentItem = {
  label: string;
  children: NavigationChildItem[];
  /** Show the aggregate unseen-activity dot on this parent's trigger. */
  hasUnseen?: boolean;
};

export type NavigationItem = NavigationLinkItem | NavigationParentItem;

export const isNavigationParent = (item: NavigationItem): item is NavigationParentItem =>
  'children' in item && Array.isArray(item.children);

export type NavigationProps = {
  links: NavigationItem[];
  /** Inline row (desktop) vs full-width stack (mobile sheet). */
  variant?: 'inline' | 'stacked';
  /** Called after a navigation link is activated (e.g. close mobile menu). */
  onLinkClick?: () => void;
};

/** Exact-match only — never prefix. /shared/* siblings share a prefix; prefix would false-active them. */
const isChildActive = (child: NavigationChildItem, pathname: string): boolean => {
  if (child.activePaths != null && child.activePaths.length > 0) {
    return child.activePaths.includes(pathname);
  }
  return pathname === child.to;
};

const isParentActive = (parent: NavigationParentItem, pathname: string): boolean =>
  parent.children.some((child) => isChildActive(child, pathname));

const isLinkActive = (link: NavigationLinkItem, pathname: string): boolean => {
  const exactMatch =
    link.activePaths != null && link.activePaths.length > 0
      ? link.activePaths.includes(pathname)
      : pathname === link.to;
  if (exactMatch) {
    return true;
  }
  // Stay selected when drilling into this item's detail routes (/albums/:id, /media/:id).
  if (link.activePrefix != null) {
    return pathname === link.activePrefix || pathname.startsWith(`${link.activePrefix}/`);
  }
  return false;
};

type NavigationParentInlineProps = {
  item: NavigationParentItem;
  onLinkClick?: () => void;
};

const NavigationParentInline = ({ item, onLinkClick }: NavigationParentInlineProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const parentActive = isParentActive(item, location.pathname);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const handleClick = (e: MouseEvent): void => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setMenuOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <ParentInlineWrap>
      <ParentTrigger
        ref={triggerRef}
        type="button"
        $active={parentActive}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {item.label}
      </ParentTrigger>
      {item.hasUnseen ? <UnseenDot size={7} top={4} right={-2} /> : null}
      <AnchoredMenu
        open={menuOpen}
        anchorRef={triggerRef}
        menuRef={menuRef}
        aria-label={item.label}
        align="start"
      >
        {item.children.map((child) => (
          <MenuNavLink
            key={child.label}
            to={child.to}
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              onLinkClick?.();
            }}
          >
            {child.label}
            {child.hasUnseen ? <UnseenDot size={7} top={12} right={8} /> : null}
          </MenuNavLink>
        ))}
      </AnchoredMenu>
    </ParentInlineWrap>
  );
};

type NavigationParentStackedProps = {
  item: NavigationParentItem;
  onLinkClick?: () => void;
};

const NavigationParentStacked = ({ item, onLinkClick }: NavigationParentStackedProps) => {
  const location = useLocation();
  const parentActive = isParentActive(item, location.pathname);
  const [expanded, setExpanded] = useState(parentActive);

  useEffect(() => {
    if (parentActive) {
      setExpanded(true);
    }
  }, [parentActive]);

  return (
    <StackedParentWrap>
      <StackedParentButton
        type="button"
        $active={parentActive}
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
      >
        {item.label}
      </StackedParentButton>
      {item.hasUnseen ? <UnseenDot size={7} top={12} right={8} /> : null}
      {expanded ? (
        <StackedChildren>
          {item.children.map((child) => {
            const active = isChildActive(child, location.pathname);
            return (
              <StyledNavLink
                key={child.label}
                to={child.to}
                $stacked
                $active={active}
                $indented
                onClick={() => {
                  onLinkClick?.();
                }}
              >
                {child.label}
                {child.hasUnseen ? <UnseenDot size={7} top={12} right={8} /> : null}
              </StyledNavLink>
            );
          })}
        </StackedChildren>
      ) : null}
    </StackedParentWrap>
  );
};

export const Navigation = (props: NavigationProps) => {
  const { links, variant = 'inline', onLinkClick } = props;
  const location = useLocation();
  const stacked = variant === 'stacked';

  return (
    <StyledNavigation $stacked={stacked}>
      <StyledNavLinks $stacked={stacked}>
        {links.map((item) => {
          if (isNavigationParent(item)) {
            return stacked ? (
              <NavigationParentStacked key={item.label} item={item} onLinkClick={onLinkClick} />
            ) : (
              <NavigationParentInline key={item.label} item={item} onLinkClick={onLinkClick} />
            );
          }

          const active = isLinkActive(item, location.pathname);
          return (
            <StyledNavLink
              to={item.to}
              key={item.label}
              $stacked={stacked}
              $active={active}
              onClick={() => {
                onLinkClick?.();
              }}
            >
              {item.label}
              {item.hasUnseen ? (
                <UnseenDot size={7} {...(stacked ? { top: 12, right: 8 } : { top: 4, right: -6 })} />
              ) : null}
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

const navLinkTextCss = css<{ $active: boolean }>`
  position: relative;
  color: ${({ $active, theme }) => ($active ? theme.color.bodyText : theme.color.bodyTextMuted)};
  font-size: ${({ theme }) => theme.fontSize._13};
  font-weight: ${({ $active, theme }) => ($active ? theme.weight.medium : theme.weight.regular)};
  text-decoration: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: transparent;
  transition: color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.color.bodyText};
  }
`;

const StyledNavLink = styled(NavLink)<{
  $stacked: boolean;
  $active: boolean;
  $indented?: boolean;
}>`
  ${navLinkTextCss}

  ${({ $stacked, $indented, theme }) => {
    if ($stacked && $indented) {
      return css`
        display: block;
        width: 100%;
        padding: ${theme.spacing(0.75)} ${theme.spacing(1)} ${theme.spacing(0.75)}
          ${theme.spacing(2.5)};
      `;
    }
    if ($stacked) {
      return css`
        display: block;
        width: 100%;
        padding: ${theme.spacing(1)};
      `;
    }
    return css`
      padding: ${theme.spacing(0.5)} ${theme.spacing(1)};
    `;
  }}
`;

const ParentInlineWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const ParentTrigger = styled.button<{ $active: boolean }>`
  margin: 0;
  border: none;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing(0.5)} ${({ theme }) => theme.spacing(1)};
  ${navLinkTextCss}

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }
`;

const MenuNavLink = styled(NavLink)`
  position: relative;
  display: block;
  width: 100%;
  padding: ${({ theme }) => theme.spacing(0.75)} ${({ theme }) => theme.spacing(2.5)}
    ${({ theme }) => theme.spacing(0.75)} ${({ theme }) => theme.spacing(1.5)};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: transparent;
  color: ${({ theme }) => theme.color.bodyText};
  font-size: ${({ theme }) => theme.fontSize._14};
  text-align: left;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.1s ease;
  white-space: nowrap;

  &:hover {
    background: ${({ theme }) => theme.color.bodyElevated};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 0;
  }
`;

const StackedParentWrap = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const StackedParentButton = styled.button<{ $active: boolean }>`
  display: block;
  width: 100%;
  margin: 0;
  border: none;
  cursor: pointer;
  text-align: left;
  padding: ${({ theme }) => theme.spacing(1)};
  ${navLinkTextCss}

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }
`;

const StackedChildren = styled.div`
  display: flex;
  flex-direction: column;
`;
