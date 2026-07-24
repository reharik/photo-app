import { X } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { safeReturnTo } from '../auth/safeReturnTo';

// Session-scoped, per-album dismissal. sessionStorage (not local state) so it survives the
// tile → media-detail → back remount and in-session reloads; keyed by token so dismissing on
// one shared album doesn't silence the offer on another. Mirrors the app's ephemeral-UI-state
// convention (see useGalleryScrollRestoration's namespaced sessionStorage prefix).
const DISMISS_PREFIX = 'homeroll:public-cta-dismissed:';

// Untrusted-input note is moot here: the returnTo is built from our own trusted album id, but
// it still passes through the shared safeReturnTo whitelist — one source of truth, and /signup
// re-validates it on consumption regardless.
const BODY_COPY =
  "Sign up and this album stays in your Homeroll — you'll get an email whenever there's something new.";

type PublicSignupCtaProps = {
  albumId: string;
  /** Sender's display name; '' when the owner isn't resolvable → fallback heading. */
  senderName: string;
};

export const PublicSignupCta = ({ albumId, senderName }: PublicSignupCtaProps) => {
  const { token } = useParams<{ token: string }>();
  const storageKey = token ? `${DISMISS_PREFIX}${token}` : undefined;
  const [dismissed, setDismissed] = useState(() =>
    storageKey ? sessionStorage.getItem(storageKey) === '1' : false,
  );

  if (dismissed) {
    return null;
  }

  const heading = senderName
    ? `Get notified when ${senderName} adds new photos.`
    : 'Get notified when new photos are added.';

  const signupHref = `/signup?returnTo=${encodeURIComponent(safeReturnTo(`/albums/${albumId}`))}`;

  const handleDismiss = () => {
    if (storageKey) {
      sessionStorage.setItem(storageKey, '1');
    }
    setDismissed(true);
  };

  return (
    <Bar>
      <Copy>
        <Heading>{heading}</Heading>
        <Body>{BODY_COPY}</Body>
      </Copy>
      <Actions>
        <SignupButton to={signupHref}>Sign up</SignupButton>
        <DismissButton type="button" onClick={handleDismiss} aria-label="Dismiss">
          <X size={18} strokeWidth={2} aria-hidden />
        </DismissButton>
      </Actions>
    </Bar>
  );
};

// flex-shrink:0 so it sits above the scrolling grid without ever overlaying photos. Print
// surface (bodyRaised) with a clay accent rail on the leading edge — an offer, not an ad.
const Bar = styled.section`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(3)};
  margin: 0 ${({ theme }) => theme.spacing(6)} ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(3)};
  background: ${({ theme }) => theme.color.bodyRaised};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-left: 3px solid ${({ theme }) => theme.color.textAccent};
  border-radius: ${({ theme }) => theme.borderRadius.md};

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: ${({ theme }) => theme.spacing(2)};
    margin: 0 ${({ theme }) => theme.spacing(3)} ${({ theme }) => theme.spacing(1.5)};
  }
`;

const Copy = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.5)};
  min-width: 0;
`;

const Heading = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize._16};
  font-weight: ${({ theme }) => theme.weight.medium};
  color: ${({ theme }) => theme.color.bodyText};
  line-height: 1.4;
`;

const Body = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize._14};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  line-height: 1.5;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  flex-shrink: 0;

  @media (max-width: 768px) {
    justify-content: flex-end;
  }
`;

// Clay primary in the app's own button register — weight 500, no shout.
const SignupButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(3)};
  background: ${({ theme }) => theme.color.primaryButtonBg};
  color: ${({ theme }) => theme.color.body};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSize._14};
  font-weight: ${({ theme }) => theme.weight.medium};
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.color.primaryButtonHover};
  }
`;

const DismissButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  padding: 0;
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  cursor: pointer;
  transition:
    color 0.2s ease,
    background 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.color.bodyText};
    background: ${({ theme }) => theme.color.selectionBg};
  }
`;
