import { UnseenActivityType } from '@packages/contracts';
import { Menu } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useUnseenActivity } from '../../hooks/useUnseenActivity';
import { UploadMediaIconButton } from '../media/UploadMediaIconButton';
import { UploadProgressBox } from '../uploadProgressBar/uploadProgressBox';
import { isNavigationParent, Navigation, type NavigationItem } from './Navigation';
import { Profile } from './Profile';

const MOBILE_SHELL = '(max-width: 768px)';

const NAV_LINKS: NavigationItem[] = [
  // activePrefix keeps the top-level item selected when you drill into its detail routes
  // (/media/:id, /albums/:id). /albums/:id serves both owned and shared albums, so by the
  // "root wins" rule it activates "Albums" even for a shared album.
  { label: 'Recent', to: '/media', activePaths: ['/', '/media'], activePrefix: '/media' },
  { label: 'Albums', to: '/albums', activePrefix: '/albums' },
  {
    label: 'Shared',
    children: [
      {
        label: 'Items',
        to: '/shared/items',
        activePaths: ['/shared/items', '/shared-with-me'],
      },
      { label: 'Albums', to: '/shared/albums' },
    ],
  },
];

type OpenMenu = null | 'nav' | 'profile';

export const AppShell = () => {
  const { viewer } = useOutletContext<{ viewer: { id: string; displayName: string } }>();
  const location = useLocation();
  const isMobileShell = useMediaQuery(MOBILE_SHELL);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const navRef = useRef<HTMLElement | null>(null);

  // Nav dots derive from the one viewer-level unseen-activity array, keyed on
  // `activityKind` — the backend populates it on every row, whereas `source` is only
  // written for comment activity. Comment activity is intentionally NOT surfaced in the
  // nav: a comment row carries no album/container context, so it can't be attributed to
  // a section; comments are discoverable via the media-tile dot and the in-thread avatar
  // dot instead. Errors degrade to `false` (empty array) so a failing query never breaks
  // navigation.
  // AppShell wraps every authed screen (layout route) and stays mounted, so it drives the
  // single authoritative fetch of the unseen-activity array. Every other consumer reads
  // cache-first; clears refetch this query, updating all watchers.
  const { anyUnseenMatching } = useUnseenActivity('cache-and-network');
  const albumsUnseen = anyUnseenMatching((r) =>
    r.activityKind.equals(UnseenActivityType.itemAdded),
  );
  const sharedItemsUnseen = anyUnseenMatching((r) =>
    r.activityKind.equals(UnseenActivityType.itemShared),
  );
  const sharedAlbumsUnseen = anyUnseenMatching((r) =>
    r.activityKind.equals(UnseenActivityType.albumShared),
  );
  const sharedUnseen = sharedItemsUnseen || sharedAlbumsUnseen;

  const navLinks = useMemo<NavigationItem[]>(
    () =>
      NAV_LINKS.map((item) => {
        if (isNavigationParent(item)) {
          if (item.label !== 'Shared') {
            return item;
          }
          // Aggregate dot on the parent; per-category dots on the children so you can
          // see whether the activity is in shared photos or shared albums.
          return {
            ...item,
            hasUnseen: sharedUnseen,
            children: item.children.map((child) => {
              if (child.to === '/shared/items') {
                return { ...child, hasUnseen: sharedItemsUnseen };
              }
              if (child.to === '/shared/albums') {
                return { ...child, hasUnseen: sharedAlbumsUnseen };
              }
              return child;
            }),
          };
        }
        if (item.to === '/albums') {
          return { ...item, hasUnseen: albumsUnseen };
        }
        return item; // Recent gets no nav dot (comment activity is not surfaced here)
      }),
    [albumsUnseen, sharedUnseen, sharedItemsUnseen, sharedAlbumsUnseen],
  );

  useEffect(() => {
    setOpenMenu(null);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isMobileShell) {
      setOpenMenu(null);
    }
  }, [isMobileShell]);

  useEffect(() => {
    if (openMenu == null) {
      return;
    }
    const onDocPointerDown = (e: PointerEvent) => {
      const el = navRef.current;
      const t = e.target;
      if (el != null && t instanceof Node && !el.contains(t)) {
        setOpenMenu(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
      }
    };
    document.addEventListener('pointerdown', onDocPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openMenu]);

  const toggleNavMenu = (): void => {
    setOpenMenu((m) => (m === 'nav' ? null : 'nav'));
  };

  const toggleProfileMenu = (): void => {
    setOpenMenu((m) => (m === 'profile' ? null : 'profile'));
  };

  return (
    <SCShellContainer>
      <UploadProgressBox />
      <SCNavigation ref={navRef}>
        {isMobileShell ? (
          <>
            <SCNavContent>
              <MobileNavLeading>
                <MobileNavMenuButton
                  type="button"
                  aria-expanded={openMenu === 'nav'}
                  aria-controls="app-shell-mobile-nav"
                  id="app-shell-nav-trigger"
                  aria-label="Open navigation menu"
                  onClick={toggleNavMenu}
                >
                  <Menu size={20} strokeWidth={2} aria-hidden />
                </MobileNavMenuButton>
                <Wordmark aria-hidden>Harik family</Wordmark>
              </MobileNavLeading>
              <NavActions>
                <UploadMediaIconButton />
                <Profile
                  displayName={viewer.displayName}
                  variant="mobile"
                  mobileMenuOpen={openMenu === 'profile'}
                  onMobileMenuToggle={toggleProfileMenu}
                />
              </NavActions>
            </SCNavContent>
            {openMenu === 'nav' ? (
              <MobileNavPanel
                id="app-shell-mobile-nav"
                role="region"
                aria-labelledby="app-shell-nav-trigger"
              >
                <Navigation
                  links={navLinks}
                  variant="stacked"
                  onLinkClick={() => {
                    setOpenMenu(null);
                  }}
                />
              </MobileNavPanel>
            ) : null}
          </>
        ) : (
          <SCNavContent>
            <SCAppNavigation>
              <WordmarkLink to="/">Harik family</WordmarkLink>
              <Navigation links={navLinks} variant="inline" />
            </SCAppNavigation>
            <NavActions>
              {/* Search affordance deferred — see Zeta search PR */}
              <UploadMediaIconButton />
              <Profile
                displayName={viewer.displayName}
                variant="desktop"
                mobileMenuOpen={openMenu === 'profile'}
                onMobileMenuToggle={toggleProfileMenu}
              />
            </NavActions>
          </SCNavContent>
        )}
      </SCNavigation>
      <MainContent>
        <Outlet />
      </MainContent>
    </SCShellContainer>
  );
};

const SCShellContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: ${({ theme }) => theme.color.body};
`;

const SCNavigation = styled.nav`
  position: relative;
  z-index: 30;
  background: ${({ theme }) => theme.color.bodyRaised};
  border-bottom: 1px solid ${({ theme }) => theme.color.border};
  padding: 0 ${({ theme }) => theme.spacing(3)};
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: 0 ${({ theme }) => theme.spacing(1.5)};
  }

  @media (max-width: 375px) {
    padding: 0 ${({ theme }) => theme.spacing(1)};
  }
`;

const SCNavContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  min-width: 0;

  @media (max-width: 768px) {
    height: 52px;
    gap: ${({ theme }) => theme.spacing(1)};
  }
`;

const MobileNavLeading = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  min-width: 0;
  flex: 1;
`;

const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
  flex-shrink: 0;

  @media (max-width: 375px) {
    gap: ${({ theme }) => theme.spacing(0.25)};
  }
`;

const wordmarkCss = css`
  font-family: ${({ theme }) => theme.font.serif};
  font-size: ${({ theme }) => theme.fontSize._17};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.bodyText};
  letter-spacing: -0.02em;
  line-height: 1.2;
`;

const Wordmark = styled.span`
  ${wordmarkCss}
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 375px) {
    font-size: ${({ theme }) => theme.fontSize._16};
  }
`;

const WordmarkLink = styled(Link)`
  ${wordmarkCss}
  text-decoration: none;
  flex-shrink: 0;

  &:hover {
    color: ${({ theme }) => theme.color.bodyText};
  }
`;

const MobileNavMenuButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: transparent;
  color: ${({ theme }) => theme.color.bodyText};
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease;

  @media (max-width: 375px) {
    width: 32px;
    height: 32px;
  }

  &:hover {
    background: ${({ theme }) => theme.color.body};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }
`;

const MobileNavPanel = styled.div`
  border-top: 1px solid ${({ theme }) => theme.color.border};
  padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(2)} ${theme.spacing(1.5)}`};
  background: ${({ theme }) => theme.color.bodyRaised};
`;

const SCAppNavigation = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(6)};
  min-width: 0;
  flex: 1;

  @media (max-width: 768px) {
    gap: ${({ theme }) => theme.spacing(2)};
  }
`;

const MainContent = styled.main`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;
