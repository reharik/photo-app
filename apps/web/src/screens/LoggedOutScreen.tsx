import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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

const isValidPhone = (value: string): boolean => {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
};

// Signup is a two-step, email-first flow: verify the email (send a code) BEFORE any
// password is collected, then finish with code + password (+ names) in one call.
type SignupStep = 'email' | 'details';

type LoginLocationState = {
  successMessage?: string;
  returnTo?: string;
};

// Only accept a same-origin internal path — guards against open-redirect via
// crafted router state.
const safeReturnTo = (value: string | undefined): string =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : '/';

export const LoggedOutScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignup, setIsSignup] = useState(location.pathname === '/signup');
  const [signupStep, setSignupStep] = useState<SignupStep>('email');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [info, setInfo] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const { login, requestEmailVerification, completeAuth } = useAuth();
  const locationState = location.state as LoginLocationState | undefined;
  const successMessage = locationState?.successMessage;

  const trimmedEmail = email.trim();
  const trimmedPhone = phone.trim();
  const showSmsOptIn = trimmedPhone.length > 0;

  const resetSignupFields = () => {
    setSignupStep('email');
    setFirstName('');
    setLastName('');
    setCode('');
    setPassword('');
    setPhone('');
    setSmsOptIn(false);
    setInfo(undefined);
  };

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPhone(value);
    if (value.trim().length === 0) {
      setSmsOptIn(false);
    }
  };

  const toggleAuthMode = () => {
    setError(undefined);
    setInfo(undefined);
    if (isSignup) {
      resetSignupFields();
    }
    setIsSignup(!isSignup);
  };

  // Step 1 (signup): verify the email by sending a code. Existence-blind — we advance
  // to the details step regardless of whether the email is new, taken, or garbage, and
  // never surface anything that would reveal which. Only a genuine transport fault is
  // shown, and its copy says nothing about account existence.
  const sendSignupCode = async (): Promise<boolean> => {
    const result = await requestEmailVerification(trimmedEmail);
    if (!result.ok) {
      setError(REQUEST_CODE_FAILURE_MESSAGE);
      return false;
    }
    setInfo(CODE_SENT_MESSAGE);
    return true;
  };

  const handleSignupEmailSubmit = async () => {
    setError(undefined);
    setIsLoading(true);
    try {
      if (await sendSignupCode()) {
        setSignupStep('details');
      }
    } catch {
      setError(REQUEST_CODE_FAILURE_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupResend = async () => {
    setError(undefined);
    setCode('');
    setIsResending(true);
    try {
      await sendSignupCode();
    } catch {
      setError(REQUEST_CODE_FAILURE_MESSAGE);
    } finally {
      setIsResending(false);
    }
  };

  // Step 2 (signup): verify the code AND set the password in one call, carrying the
  // names so the backend knows this is the signup door. On success the session cookie
  // is set and the viewer hydrated — land in the app, never a "now log in" screen.
  const handleSignupDetailsSubmit = async () => {
    setError(undefined);

    if (code.length !== CODE_LENGTH) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (trimmedPhone.length > 0 && !isValidPhone(trimmedPhone)) {
      setError('Enter a valid phone number or leave the field blank.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await completeAuth({
        email: trimmedEmail,
        code,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(trimmedPhone.length > 0 ? { phone: trimmedPhone } : {}),
        smsOptIn: trimmedPhone.length > 0 && smsOptIn,
      });

      if (!result.ok) {
        // Code-level failure: friendly copy, stay on the code step to retry/resend.
        setError(setPasswordErrorMessage(result.reason));
        return;
      }

      await navigate(safeReturnTo(locationState?.returnTo), { replace: true });
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setSignupStep('email');
    setCode('');
    setError(undefined);
    setInfo(undefined);
  };

  const handleLoginSubmit = async () => {
    setError(undefined);
    setIsLoading(true);
    try {
      const result = await login(trimmedEmail, password);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      await navigate(safeReturnTo(locationState?.returnTo), { replace: true });
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isSignup) {
      await handleLoginSubmit();
      return;
    }
    if (signupStep === 'email') {
      await handleSignupEmailSubmit();
      return;
    }
    await handleSignupDetailsSubmit();
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
          <AuthCard $isSignup={isSignup}>
            <AuthHeader>
              <AuthTitle>{isSignup ? 'Create Account' : 'Welcome Back'}</AuthTitle>
              <AuthSubtitle>
                {!isSignup
                  ? 'Welcome back.'
                  : signupStep === 'email'
                    ? "Enter your email and we'll send you a code to get started."
                    : 'Enter the code we sent, then choose your details and password.'}
              </AuthSubtitle>
            </AuthHeader>

            <Form onSubmit={handleSubmit} $isSignup={isSignup}>
              {isSignup && signupStep === 'email' && (
                <FormInput
                  id="signup-email"
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  data-testid="login-email"
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(event.target.value)
                  }
                  required
                  autoComplete="email"
                />
              )}

              {isSignup && signupStep === 'details' && (
                <>
                  <StepBackRow>
                    Code sent to <strong>{trimmedEmail}</strong>.{' '}
                    <StepBackLink type="button" onClick={handleBackToEmail}>
                      Change
                    </StepBackLink>
                  </StepBackRow>
                  {info && <InfoMessage>{info}</InfoMessage>}
                  <VerificationStep
                    idPrefix="signup"
                    code={code}
                    onCodeChange={setCode}
                    onResend={handleSignupResend}
                    isResending={isResending}
                    disabled={isLoading}
                  />
                  <NameRow>
                    <FormInput
                      id="signup-first-name"
                      label="First name"
                      type="text"
                      placeholder="Jane"
                      value={firstName}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setFirstName(event.target.value)
                      }
                      required
                      autoComplete="given-name"
                    />
                    <FormInput
                      id="signup-last-name"
                      label="Last name"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setLastName(event.target.value)
                      }
                      required
                      autoComplete="family-name"
                    />
                  </NameRow>
                  <FormInput
                    id="signup-password"
                    label="Password"
                    type="password"
                    value={password}
                    data-testid="login-password"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(event.target.value)
                    }
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <PhoneField>
                    <FormInput
                      id="signup-phone"
                      label="Phone number"
                      type="tel"
                      placeholder="+1 555 123 4567"
                      value={phone}
                      onChange={handlePhoneChange}
                      autoComplete="tel"
                      inputMode="tel"
                      data-lpignore="true"
                      data-1p-ignore="true"
                    />
                    <FieldHelper>
                      Optional — add a number if you&apos;d like SMS notifications. You can always
                      add it later.
                    </FieldHelper>
                  </PhoneField>
                  {showSmsOptIn && (
                    <SmsOptInRow>
                      <SmsOptInCheckbox
                        id="signup-sms-opt-in"
                        type="checkbox"
                        checked={smsOptIn}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          setSmsOptIn(event.target.checked)
                        }
                      />
                      <SmsOptInLabel>
                        Text me notifications (optional). You can add or change this anytime in
                        settings.
                      </SmsOptInLabel>
                    </SmsOptInRow>
                  )}
                </>
              )}

              {!isSignup && (
                <>
                  <FormInput
                    id="login-email"
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    data-testid="login-email"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setEmail(event.target.value)
                    }
                    required
                    autoComplete="email"
                  />
                  <FormInput
                    id="login-password"
                    label="Password"
                    type="password"
                    placeholder="Your password"
                    value={password}
                    data-testid="login-password"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(event.target.value)
                    }
                    required
                    autoComplete="current-password"
                  />
                  <ForgotPasswordRow>
                    <ForgotPasswordLink to="/forgot-password">Forgot password?</ForgotPasswordLink>
                  </ForgotPasswordRow>
                </>
              )}

              {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}

              {error && <ErrorMessage>{error}</ErrorMessage>}

              <SubmitButton type="submit" disabled={isLoading}>
                {isLoading
                  ? 'Loading...'
                  : !isSignup
                    ? 'Sign In'
                    : signupStep === 'email'
                      ? 'Continue'
                      : 'Create Account'}
              </SubmitButton>
            </Form>

            <AuthFooter>
              <ToggleText>
                {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <ToggleLink type="button" onClick={toggleAuthMode}>
                  {isSignup ? 'Sign In' : 'Create Account'}
                </ToggleLink>
              </ToggleText>
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

const AuthCard = styled.div<{ $isSignup: boolean }>`
  background: ${({ theme }) => theme.color.bodyRaised};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing(6)};
  width: 100%;
  max-width: ${({ $isSignup }) => ($isSignup ? '520px' : '440px')};
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

const Form = styled.form<{ $isSignup: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme, $isSignup }) => theme.spacing($isSignup ? 4 : 3)};
`;

const NameRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing(3)};

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const PhoneField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const FieldHelper = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize._12};
  line-height: 1.5;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;

const SmsOptInRow = styled.label`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(2)};
  min-height: 44px;
  padding: ${({ theme }) => theme.spacing(1)} 0;
  cursor: pointer;
`;

const SmsOptInCheckbox = styled.input`
  width: 20px;
  height: 20px;
  margin-top: 2px;
  flex-shrink: 0;
  accent-color: ${({ theme }) => theme.color.primaryButtonBg};
  cursor: pointer;
`;

const SmsOptInLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSize._14};
  line-height: 1.5;
  color: ${({ theme }) => theme.color.bodyText};
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

const SuccessMessage = styled.div`
  padding: ${({ theme }) => theme.spacing(2)};
  background: ${({ theme }) => theme.color.alertSuccess};
  border: 1px solid ${({ theme }) => theme.color.alertSuccessText};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.color.alertSuccessText};
  font-size: 14px;
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

const StepBackRow = styled.div`
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  font-size: 14px;
`;

const StepBackLink = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.color.link};
  font-size: 14px;
  padding: 0;
  text-decoration: underline;
  transition: color 0.2s ease;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.color.linkHover};
  }
`;

const ForgotPasswordRow = styled.div`
  text-align: right;
  margin-top: -${({ theme }) => theme.spacing(1)};
`;

const ForgotPasswordLink = styled(Link)`
  color: ${({ theme }) => theme.color.link};
  font-size: 14px;
  text-decoration: underline;
  transition: color 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.color.linkHover};
  }
`;

const AuthFooter = styled.div`
  margin-top: ${({ theme }) => theme.spacing(4)};
  text-align: center;
`;

const ToggleText = styled.div`
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  font-size: 14px;
`;

const ToggleLink = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.color.link};
  font-size: 14px;
  padding: 0;
  text-decoration: underline;
  transition: color 0.2s ease;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.color.linkHover};
  }
`;
