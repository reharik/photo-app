import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { Navigation } from './Navigation';
import { Profile } from './Profile';

const MOBILE_SHELL = '(max-width: 768px)';

const NAV_LINKS = [
  { label: 'Media', to: '/media' },
  { label: 'Albums', to: '/albums' },
  { label: 'Shared with you', to: '/shared-with-me' },
] as const;

type OpenMenu = null | 'nav' | 'profile';

interface AppShellProps {
  viewer: { id: string; displayName: string };
}

export const AppShell = ({ viewer }: AppShellProps) => {
  const location = useLocation();
  const isMobileShell = useMediaQuery(MOBILE_SHELL);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const navRef = useRef<HTMLElement | null>(null);

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
      <SCNavigation ref={navRef}>
        {isMobileShell ? (
          <>
            <SCNavContent>
              <MobileNavLeading>
                <MobileAppTitleButton
                  type="button"
                  aria-expanded={openMenu === 'nav'}
                  aria-controls="app-shell-mobile-nav"
                  id="app-shell-nav-trigger"
                  onClick={toggleNavMenu}
                >
                  Family Media
                  <TitleChevron aria-hidden $open={openMenu === 'nav'}>
                    ▾
                  </TitleChevron>
                </MobileAppTitleButton>
              </MobileNavLeading>
              <Profile
                displayName={viewer.displayName}
                variant="mobile"
                mobileMenuOpen={openMenu === 'profile'}
                onMobileMenuToggle={toggleProfileMenu}
              />
            </SCNavContent>
            {openMenu === 'nav' ? (
              <MobileNavPanel
                id="app-shell-mobile-nav"
                role="region"
                aria-labelledby="app-shell-nav-trigger"
              >
                <Navigation
                  links={[...NAV_LINKS]}
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
              <SCAppTitle to="/">Family Media</SCAppTitle>
              <Navigation links={[...NAV_LINKS]} variant="inline" />
            </SCAppNavigation>
            <Profile displayName={viewer.displayName} variant="desktop" />
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
    padding: 0 ${({ theme }) => theme.spacing(2)};
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
  }
`;

const MobileNavLeading = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
`;

const MobileAppTitleButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  margin: 0;
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(1.5)};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: transparent;
  color: ${({ theme }) => theme.color.bodyText};
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.25px;
  line-height: 1.2;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.color.body};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }
`;

const TitleChevron = styled.span<{ $open: boolean }>`
  flex-shrink: 0;
  font-size: 10px;
  line-height: 1;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0')});
  transition: transform 0.15s ease;
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

const SCAppTitle = styled(Link)`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.bodyText};
  text-decoration: none;
  letter-spacing: -0.5px;
  flex-shrink: 0;

  &:hover {
    color: ${({ theme }) => theme.color.bodyText};
  }

  @media (max-width: 768px) {
    font-size: 15px;
    letter-spacing: -0.25px;
  }
`;

const MainContent = styled.main`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;
