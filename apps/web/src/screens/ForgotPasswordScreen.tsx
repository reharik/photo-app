import { Camera, Image, Lock, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { APP_NAME, APP_TAGLINE } from '../brand';
import { useAuth } from '../contexts/AuthContext';
import { CODE_LENGTH, VerificationStep } from '../features/auth/VerificationStep';
import {
  CODE_SENT_MESSAGE,
  REQUEST_CODE_FAILURE_MESSAGE,
  setPasswordErrorMessage,
} from '../features/auth/authMessages';
import { FormInput } from '../ui/FormInput';

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
      <ContentWrapper>
        <LeftPanel>
          <BrandSection>
            <BrandTitle>{APP_NAME}</BrandTitle>
            <BrandTagline>{APP_TAGLINE}</BrandTagline>
          </BrandSection>
          <FeatureList>
            <Feature>
              <FeatureIcon>
                <Camera size={24} strokeWidth={2} aria-hidden />
              </FeatureIcon>
              <FeatureText>All your photos in one place</FeatureText>
            </Feature>
            <Feature>
              <FeatureIcon>
                <Image size={24} strokeWidth={2} aria-hidden />
              </FeatureIcon>
              <FeatureText>Share with family and friends</FeatureText>
            </Feature>
            <Feature>
              <FeatureIcon>
                <Lock size={24} strokeWidth={2} aria-hidden />
              </FeatureIcon>
              <FeatureText>Private and secure</FeatureText>
            </Feature>
            <Feature>
              <FeatureIcon>
                <Smartphone size={24} strokeWidth={2} aria-hidden />
              </FeatureIcon>
              <FeatureText>Access anywhere</FeatureText>
            </Feature>
          </FeatureList>
        </LeftPanel>

        <RightPanel>
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
        </RightPanel>
      </ContentWrapper>
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.color.body};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(3)};
`;

const ContentWrapper = styled.div`
  display: flex;
  max-width: 1200px;
  width: 100%;
  gap: ${({ theme }) => theme.spacing(8)};
  align-items: center;

  @media (max-width: 968px) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(4)};
  }
`;

const LeftPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(6)};

  @media (max-width: 968px) {
    text-align: center;
  }
`;

const BrandSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
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
  font-size: 18px;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  margin: 0;
  line-height: 1.6;
  max-width: 480px;

  @media (max-width: 968px) {
    margin: 0 auto;
  }
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};

  @media (max-width: 968px) {
    align-items: center;
  }
`;

const Feature = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const FeatureIcon = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.color.textAccent};
`;

const FeatureText = styled.div`
  color: ${({ theme }) => theme.color.bodyText};
  font-size: 16px;
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
`;

const AuthCard = styled.div`
  background: ${({ theme }) => theme.color.bodyRaised};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing(6)};
  width: 100%;
  max-width: 440px;
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
