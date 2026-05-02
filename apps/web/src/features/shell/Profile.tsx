import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';

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

  const handleLogout = async () => {
    await logout();
    await navigate('/', { replace: true });
  };

  if (variant === 'mobile') {
    return (
      <MobileProfileRoot>
        <ProfileMenuTrigger
          type="button"
          aria-expanded={mobileMenuOpen}
          aria-haspopup="true"
          aria-controls="app-shell-profile-menu"
          id="app-shell-profile-trigger"
          onClick={() => {
            onMobileMenuToggle?.();
          }}
        >
          <MobileProfileName title={displayName}>{displayName}</MobileProfileName>
          <ChevronIcon aria-hidden $open={mobileMenuOpen}>
            ▾
          </ChevronIcon>
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
    <StyledProfile>
      <StyledUserInfo>{displayName}</StyledUserInfo>
      <StyledLogoutButton type="button" onClick={() => void handleLogout()}>
        Sign Out
      </StyledLogoutButton>
    </StyledProfile>
  );
};

const MobileProfileRoot = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const ProfileMenuTrigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.75)};
  max-width: min(140px, 36vw);
  margin: 0;
  padding: ${({ theme }) => theme.spacing(0.75)} ${({ theme }) => theme.spacing(1)};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.color.body};
  color: ${({ theme }) => theme.color.bodyText};
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.color.primaryButtonBg};
    background: ${({ theme }) => theme.color.bodyRaised};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }
`;

const MobileProfileName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;

const ChevronIcon = styled.span<{ $open: boolean }>`
  flex-shrink: 0;
  font-size: 9px;
  line-height: 1;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0')});
  transition: transform 0.15s ease;
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
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.12),
    0 1px 2px rgba(0, 0, 0, 0.06);
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

const StyledProfile = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)};
  flex-shrink: 0;

  @media (max-width: 768px) {
    gap: ${({ theme }) => theme.spacing(1.5)};
  }
`;
const StyledUserInfo = styled.div`
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  font-size: 14px;

  @media (max-width: 768px) {
    max-width: min(120px, 28vw);
    font-size: 12px;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const StyledLogoutButton = styled.button`
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.color.border};
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  font-size: 14px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: ${({ theme }) => theme.color.body};
    border-color: ${({ theme }) => theme.color.primaryButtonBg};
    color: ${({ theme }) => theme.color.bodyText};
  }

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(0.5)} ${({ theme }) => theme.spacing(1.5)};
    font-size: 12px;
  }
`;
