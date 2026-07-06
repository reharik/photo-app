import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { ShellUserAvatar } from './ShellUserAvatar';

export type ProfileProps = {
  displayName: string;
  variant: 'desktop' | 'mobile';
  /** Mobile only: profile menu (sign out) is expanded. */
  mobileMenuOpen?: boolean;
  /** Mobile only: toggles profile menu. */
  onMobileMenuToggle?: () => void;
};

export const Profile = (props: ProfileProps) => {
  const { displayName, variant, mobileMenuOpen = false, onMobileMenuToggle } = props;
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    // Navigate to the public login route *before* clearing the session. logout()
    // resets the Apollo store, which nulls the viewer and would otherwise trigger
    // RequireViewer's deep-link bounce — capturing the current protected path as
    // `returnTo` and sending the next user who logs in back to it.
    await navigate('/login', { replace: true });
    await logout();
  };

  if (variant === 'mobile') {
    return (
      <MobileProfileRoot>
        <ProfileMenuTrigger
          type="button"
          aria-expanded={mobileMenuOpen}
          aria-haspopup="true"
          aria-controls="app-shell-profile-menu"
          aria-label={displayName}
          id="app-shell-profile-trigger"
          onClick={() => {
            onMobileMenuToggle?.();
          }}
        >
          <ShellUserAvatar displayName={displayName} size={32} />
        </ProfileMenuTrigger>
        {mobileMenuOpen ? (
          <ProfileDropdown
            id="app-shell-profile-menu"
            role="menu"
            aria-labelledby="app-shell-profile-trigger"
          >
            <SignOutMenuItem
              type="button"
              role="menuitem"
              onClick={() => {
                void handleLogout();
              }}
            >
              Sign out
            </SignOutMenuItem>
          </ProfileDropdown>
        ) : null}
      </MobileProfileRoot>
    );
  }

  return (
    <DesktopProfileRoot>
      <ProfileMenuTrigger
        type="button"
        aria-haspopup="true"
        aria-controls="app-shell-profile-menu-desktop"
        aria-label={displayName}
        id="app-shell-profile-trigger-desktop"
        onClick={() => {
          onMobileMenuToggle?.();
        }}
      >
        <ShellUserAvatar displayName={displayName} size={32} />
      </ProfileMenuTrigger>
      {mobileMenuOpen ? (
        <ProfileDropdown
          id="app-shell-profile-menu-desktop"
          role="menu"
          aria-labelledby="app-shell-profile-trigger-desktop"
        >
          <SignOutMenuItem
            type="button"
            role="menuitem"
            onClick={() => {
              void handleLogout();
            }}
          >
            Sign out
          </SignOutMenuItem>
        </ProfileDropdown>
      ) : null}
    </DesktopProfileRoot>
  );
};

const MobileProfileRoot = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const DesktopProfileRoot = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const ProfileMenuTrigger = styled.button`
  display: inline-flex;
  align-items: center;
  margin: 0;
  padding: ${({ theme }) => theme.spacing(0.25)};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: transparent;
  cursor: pointer;
  transition: background 0.15s ease;
  flex-shrink: 0;

  @media (max-width: 375px) {
    padding: 0;
  }

  &:hover {
    background: ${({ theme }) => theme.color.body};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }
`;

const ProfileDropdown = styled.div`
  position: absolute;
  top: calc(100% + ${({ theme }) => theme.spacing(1)});
  right: 0;
  left: auto;
  min-width: 160px;
  padding: ${({ theme }) => theme.spacing(1)};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.color.bodyRaised};
  box-shadow: ${({ theme }) => theme.boxShadow.md};
  z-index: 40;
`;

const SignOutMenuItem = styled.button`
  display: block;
  width: 100%;
  margin: 0;
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: transparent;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.color.body};
    color: ${({ theme }) => theme.color.bodyText};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 0;
  }
`;
