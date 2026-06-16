import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { APP_NAME, APP_TAGLINE } from '../brand';
import { config } from '../config';
import { FormInput } from '../ui/FormInput';

const STAGE1_SUCCESS_MESSAGE =
  "If an account exists for that email, we've sent a reset code. Check your inbox and enter the code below.";

const RESET_ERROR_INVALID_CODE =
  "That code isn't right or has expired. Check the code, or request a new one.";

const RESET_ERROR_TOO_MANY_ATTEMPTS = 'Too many attempts. Request a new code and try again.';

type ApiPostResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

const apiPost = async (path: string, body: unknown): Promise<ApiPostResult> => {
  const apiBase = config.apiBaseUrl.endsWith('/')
    ? config.apiBaseUrl.slice(0, -1)
    : config.apiBaseUrl;
  const url = `${apiBase}${path}`;

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (response.ok) {
    return { ok: true };
  }

  const data = (await response.json()) as { error?: string; message?: string };
  return {
    ok: false,
    status: response.status,
    error: data.error ?? data.message ?? `HTTP ${response.status}`,
  };
};

export const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [stage1Submitted, setStage1Submitted] = useState(false);
  const [stage1Message, setStage1Message] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const navigate = useNavigate();

  const trimmedEmail = email.trim();

  const sendResetCode = async (): Promise<void> => {
    setError(undefined);
    setIsSendingCode(true);

    try {
      const result = await apiPost('/auth/forgot-password', { email: trimmedEmail });

      if (!result.ok) {
        setError('An unexpected error occurred. Please try again.');
        return;
      }

      setStage1Submitted(true);
      setStage1Message(STAGE1_SUCCESS_MESSAGE);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSendCodeSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await sendResetCode();
  };

  const handleResendCode = async () => {
    setError(undefined);
    setCode('');
    await sendResetCode();
  };

  const handleResetSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(undefined);

    if (code.length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsResetting(true);

    try {
      const result = await apiPost('/auth/reset-password', {
        email: trimmedEmail,
        code,
        password,
      });

      if (!result.ok) {
        if (result.status === 429) {
          setError(RESET_ERROR_TOO_MANY_ATTEMPTS);
        } else if (result.status === 400) {
          setError(RESET_ERROR_INVALID_CODE);
        } else {
          setError(result.error);
        }
        return;
      }

      await navigate('/login', {
        replace: true,
        state: { successMessage: 'Your password has been changed. Please sign in.' },
      });
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
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
              <FeatureIcon>📸</FeatureIcon>
              <FeatureText>All your photos in one place</FeatureText>
            </Feature>
            <Feature>
              <FeatureIcon>🖼️</FeatureIcon>
              <FeatureText>Share with family and friends</FeatureText>
            </Feature>
            <Feature>
              <FeatureIcon>🔒</FeatureIcon>
              <FeatureText>Private and secure</FeatureText>
            </Feature>
            <Feature>
              <FeatureIcon>📱</FeatureIcon>
              <FeatureText>Access anywhere</FeatureText>
            </Feature>
          </FeatureList>
        </LeftPanel>

        <RightPanel>
          <AuthCard>
            <AuthHeader>
              <AuthTitle>Reset Password</AuthTitle>
              <AuthSubtitle>
                Enter your email and we&apos;ll send you a code to choose a new password.
              </AuthSubtitle>
            </AuthHeader>

            <Form onSubmit={stage1Submitted ? handleResetSubmit : handleSendCodeSubmit}>
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
                autoComplete="email"
              />

              {stage1Message && <InfoMessage>{stage1Message}</InfoMessage>}

              {stage1Submitted && (
                <>
                  <FormInput
                    id="forgot-password-code"
                    label="Reset code"
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={handleCodeChange}
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
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
                  <ResendRow>
                    Didn&apos;t get a code?{' '}
                    <ResendLink type="button" onClick={handleResendCode} disabled={isSendingCode}>
                      Send again
                    </ResendLink>
                  </ResendRow>
                </>
              )}

              {error && <ErrorMessage>{error}</ErrorMessage>}

              {!stage1Submitted ? (
                <SubmitButton type="submit" disabled={isSendingCode}>
                  {isSendingCode ? 'Loading...' : 'Send reset code'}
                </SubmitButton>
              ) : (
                <SubmitButton type="submit" disabled={isResetting || isSendingCode}>
                  {isResetting ? 'Loading...' : 'Reset password'}
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
  font-size: 24px;
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

const ResendRow = styled.div`
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  font-size: 14px;
`;

const ResendLink = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.color.link};
  font-size: 14px;
  padding: 0;
  text-decoration: underline;
  transition: color 0.2s ease;
  cursor: pointer;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.color.linkHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
