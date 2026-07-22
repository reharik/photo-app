import { EyeOff, KeyRound, RefreshCw, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { APP_NAME, APP_TAGLINE } from '../brand';
import { useAuth } from '../contexts/AuthContext';
import {
  CODE_SENT_MESSAGE,
  REQUEST_CODE_FAILURE_MESSAGE,
  setPasswordErrorMessage,
} from '../features/auth/authMessages';
import { CODE_LENGTH, VerificationStep } from '../features/auth/VerificationStep';
import { FormInput } from '../ui/FormInput';
import { HeroIllustration } from '../ui/HeroIllustration';

// The forgot-password door. Framing/copy differ from signup, but the call sequence is
// IDENTICAL: email → request a code (existence-blind) → verify code + set password in
// one call → land logged in. It collects NO names (that's how the backend tells reset
// from create without leaking existence). Both doors run through the same auth client.
export const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [info, setInfo] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { requestEmailVerification, completeAuth } = useAuth();
  const navigate = useNavigate();

  const trimmedEmail = email.trim();

  // Existence-blind: advance to the code step for every email. The response can't tell
  // us whether an account exists and we must not infer it. Only a genuine transport
  // fault is surfaced, with copy that reveals nothing about existence.
  const sendCode = async (): Promise<boolean> => {
    const result = await requestEmailVerification(trimmedEmail);
    if (!result.ok) {
      setError(REQUEST_CODE_FAILURE_MESSAGE);
      return false;
    }
    setInfo(CODE_SENT_MESSAGE);
    return true;
  };

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(undefined);
    setIsSendingCode(true);
    try {
      if (await sendCode()) {
        setCodeSent(true);
      }
    } catch {
      setError(REQUEST_CODE_FAILURE_MESSAGE);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleResend = async () => {
    setError(undefined);
    setCode('');
    setIsSendingCode(true);
    try {
      await sendCode();
    } catch {
      setError(REQUEST_CODE_FAILURE_MESSAGE);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleResetSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(undefined);

    if (code.length !== CODE_LENGTH) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      // No names on this door → the backend routes this as a reset/login.
      const result = await completeAuth({ email: trimmedEmail, code, password });

      if (!result.ok) {
        // Code-level failure: friendly copy, stay on the code step to retry/resend.
        setError(setPasswordErrorMessage(result.reason));
        return;
      }

      // 200 → the session cookie is set and the viewer hydrated. Land in the app — NOT
      // a "now log in" screen.
      await navigate('/', { replace: true });
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <PageInner>
        <Hero>
          <HeroLockup>
            <HeroIllustration size={168} />
            <BrandTitle>{APP_NAME}</BrandTitle>
          </HeroLockup>
          <BrandTagline>{APP_TAGLINE}</BrandTagline>
        </Hero>
        <ContentWrapper>
          <LeftPanel>
            <FeatureList>
              <Feature>
                <FeatureIcon>
                  <Smartphone size={22} strokeWidth={2} aria-hidden />
                </FeatureIcon>
                <FeatureText>
                  <FeatureLabel>Nobody gets left out</FeatureLabel>
                  <FeatureDesc>
                    iPhone, Android, an old laptop — if they can open a link, they can see the
                    photos.
                  </FeatureDesc>
                </FeatureText>
              </Feature>
              <Feature>
                <FeatureIcon>
                  <RefreshCw size={22} strokeWidth={2} aria-hidden />
                </FeatureIcon>
                <FeatureText>
                  <FeatureLabel>Keeps up with you</FeatureLabel>
                  <FeatureDesc>
                    Add photos whenever. The album stays current instead of going stale after you
                    send it.
                  </FeatureDesc>
                </FeatureText>
              </Feature>
              <Feature>
                <FeatureIcon>
                  <KeyRound size={22} strokeWidth={2} aria-hidden />
                </FeatureIcon>
                <FeatureText>
                  <FeatureLabel>You decide who sees it</FeatureLabel>
                  <FeatureDesc>
                    Invite people directly or send a link. Set it to expire, or shut it off whenever
                    you want.
                  </FeatureDesc>
                </FeatureText>
              </Feature>
              <Feature>
                <FeatureIcon>
                  <EyeOff size={22} strokeWidth={2} aria-hidden />
                </FeatureIcon>
                <FeatureText>
                  <FeatureLabel>Nothing is public</FeatureLabel>
                  <FeatureDesc>
                    No feed, no strangers, no algorithm deciding who your kids get shown to.
                  </FeatureDesc>
                </FeatureText>
              </Feature>
            </FeatureList>
            <FeatureClosing>
              We&apos;re a small team who think your family&apos;s photos are nobody else&apos;s
              business.
            </FeatureClosing>
          </LeftPanel>

          <AuthCard>
            <AuthHeader>
              <AuthTitle>Reset Password</AuthTitle>
              <AuthSubtitle>
                {codeSent
                  ? 'Enter the code we sent, then choose a new password.'
                  : "Enter your email and we'll send you a code to choose a new password."}
              </AuthSubtitle>
            </AuthHeader>

            <Form onSubmit={codeSent ? handleResetSubmit : handleEmailSubmit}>
              <FormInput
                id="forgot-password-email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setEmail(event.target.value)
                }
                required
                disabled={codeSent}
                autoComplete="email"
              />

              {info && <InfoMessage>{info}</InfoMessage>}

              {codeSent && (
                <>
                  <VerificationStep
                    idPrefix="forgot-password"
                    code={code}
                    onCodeChange={setCode}
                    onResend={handleResend}
                    isResending={isSendingCode}
                    disabled={isSubmitting}
                  />
                  <FormInput
                    id="forgot-password-new-password"
                    label="New password"
                    type="password"
                    value={password}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(event.target.value)
                    }
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </>
              )}

              {error && <ErrorMessage>{error}</ErrorMessage>}

              {!codeSent ? (
                <SubmitButton type="submit" disabled={isSendingCode}>
                  {isSendingCode ? 'Loading...' : 'Send reset code'}
                </SubmitButton>
              ) : (
                <SubmitButton type="submit" disabled={isSubmitting || isSendingCode}>
                  {isSubmitting ? 'Loading...' : 'Set password & sign in'}
                </SubmitButton>
              )}
            </Form>

            <AuthFooter>
              <BackLink to="/login">Back to sign in</BackLink>
            </AuthFooter>
          </AuthCard>
        </ContentWrapper>
      </PageInner>
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.color.body};
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(6)} ${({ theme }) => theme.spacing(3)}
    ${({ theme }) => theme.spacing(8)};
`;

const PageInner = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  width: 100%;
  gap: ${({ theme }) => theme.spacing(6)};
`;

const Hero = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  text-align: center;
`;

const HeroLockup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)};

  @media (max-width: 520px) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(1)};
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  width: 100%;
  gap: ${({ theme }) => theme.spacing(8)};
  align-items: stretch;

  @media (max-width: 968px) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(4)};
  }
`;

const LeftPanel = styled.div`
  flex: 1;
  /* strip the implicit min-width: auto so flex-basis:0 splits the row evenly —
     otherwise the form column's wider content floor steals space from this one */
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(5)};
  background: ${({ theme }) => theme.color.bodyRaised};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing(6)};
`;

const BrandTitle = styled.h1`
  font-size: 48px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.bodyText};
  margin: 0;
  letter-spacing: -1px;

  @media (max-width: 968px) {
    font-size: 36px;
  }
`;

const BrandTagline = styled.p`
  font-size: 22px;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  margin: 0;
  line-height: 1.5;
  max-width: 720px;

  @media (max-width: 968px) {
    font-size: 18px;
  }
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const Feature = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(2)};
`;

// Marketing surface — a soft clay-tint badge carries the two-line blocks with more
// presence than a bare outline glyph, without the filled disc pulling focus from the
// copy. Clay glyph on a clay_lightest tint.
const FeatureIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${({ theme }) => theme.color.selectionBg};
  color: ${({ theme }) => theme.color.textAccent};

  /* On phones the badge eats ~60px and forces short line breaks — give the text the
     full column width. */
  @media (max-width: 520px) {
    display: none;
  }
`;

const FeatureText = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

const FeatureLabel = styled.div`
  color: ${({ theme }) => theme.color.bodyText};
  font-size: 16px;
  font-weight: ${({ theme }) => theme.weight.medium};
`;

const FeatureDesc = styled.div`
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  font-size: 15px;
  line-height: 1.5;
  max-width: 420px;
`;

const FeatureClosing = styled.p`
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  font-size: 15px;
  line-height: 1.6;
  max-width: 420px;
  margin: 0;
`;

// A direct flex sibling of LeftPanel with the identical box model (flex:1 + min-width:0
// + own padding/border). Both cards must carry their padding on the flex ITEM itself —
// wrapping one in a bare flex parent makes flex-grow equalize content boxes, leaving the
// padded item wider by its own padding+border.
const AuthCard = styled.div`
  flex: 1;
  min-width: 0;
  background: ${({ theme }) => theme.color.bodyRaised};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing(6)};

  /* When the columns stack, a returning user shouldn't scroll past the pitch to log in. */
  @media (max-width: 968px) {
    order: -1;
  }
`;

const AuthHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing(5)};
`;

const AuthTitle = styled.h2`
  font-size: 28px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.bodyText};
  margin: 0 0 ${({ theme }) => theme.spacing(1)} 0;
`;

const AuthSubtitle = styled.p`
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const InfoMessage = styled.div`
  padding: ${({ theme }) => theme.spacing(2)};
  background: ${({ theme }) => theme.color.alertInfo};
  border: 1px solid ${({ theme }) => theme.color.alertInfoText};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.color.alertInfoText};
  font-size: 14px;
  line-height: 1.5;
`;

const SubmitButton = styled.button`
  width: 100%;
  min-height: 48px;
  padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(3)};
  background: ${({ theme }) => theme.color.primaryButtonBg};
  color: ${({ theme }) => theme.color.body};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s ease;
  margin-top: ${({ theme }) => theme.spacing(1)};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.color.primaryButtonHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  padding: ${({ theme }) => theme.spacing(2)};
  background: ${({ theme }) => theme.color.alertError};
  border: 1px solid ${({ theme }) => theme.color.formError};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.color.alertErrorText};
  font-size: 14px;
`;

const AuthFooter = styled.div`
  margin-top: ${({ theme }) => theme.spacing(4)};
  text-align: center;
`;

const BackLink = styled(Link)`
  color: ${({ theme }) => theme.color.link};
  font-size: 14px;
  text-decoration: underline;
  transition: color 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.color.linkHover};
  }
`;
