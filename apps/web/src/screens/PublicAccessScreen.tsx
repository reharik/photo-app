import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { FormInput } from '../ui/FormInput';
import { PublicAlbumScreen } from './PublicAlbumScreen';

export const PublicAccessScreen = () => {
  const [isValid, setIsValid] = useState(false);
  const [role, setRole] = useState<'adult' | 'kid'>('adult');
  const [error, setError] = useState<string | undefined>();

  const { publicAccess } = useAuth();

  const { token } = useParams<{ token: string }>();
  useEffect(() => {
    if (!token) return;

    void Promise.all([
      publicAccess(token).then((result) => {
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setIsValid(true);
      }),
      new Promise((resolve) => setTimeout(resolve, 800)),
    ]);
  }, [publicAccess, token]);

  if (isValid) {
    return <PublicAlbumScreen />;
  }

  return (
    <Container>
      <ContentWrapper>
        <LeftPanel>
          <BrandSection>
            <BrandTitle>Family Media</BrandTitle>
            <BrandTagline>
              A private, secure place to share and preserve your family memories
            </BrandTagline>
          </BrandSection>
          <FeatureList>
            <Feature>
              <FeatureIcon>📸</FeatureIcon>
              <FeatureText>Unlimited media storage</FeatureText>
            </Feature>
            <Feature>
              <FeatureIcon>👨‍👩‍👧‍👦</FeatureIcon>
              <FeatureText>Family-friendly sharing</FeatureText>
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
              <AuthTitle>{isSignup ? 'Create Account' : 'Welcome Back'}</AuthTitle>
              <AuthSubtitle>
                {isSignup
                  ? 'Start preserving your family memories'
                  : 'Sign in to access your media'}
              </AuthSubtitle>
            </AuthHeader>

            <Form onSubmit={handleSubmit}>
              {isSignup && (
                <FormInput
                  label="Name"
                  type="text"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              )}
              <FormInput
                label="Email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <FormInput
                label={isSignup ? 'Password (at least 8 characters)' : 'Password'}
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
                minLength={isSignup ? 8 : undefined}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
              />
              {isSignup && (
                <FormInput
                  label="Role"
                  as="select"
                  value={role}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setRole(e.target.value as 'adult' | 'kid')
                  }
                >
                  <option value="adult">Adult</option>
                  <option value="kid">Kid</option>
                </FormInput>
              )}

              {error && <ErrorMessage>{error}</ErrorMessage>}

              <SubmitButton type="submit" disabled={isLoading}>
                {isLoading ? 'Loading...' : isSignup ? 'Create Account' : 'Sign In'}
              </SubmitButton>
            </Form>

            <AuthFooter>
              <ToggleText>
                {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <ToggleLink onClick={() => setIsSignup(!isSignup)}>
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
  background: ${({ theme }) => theme.colors.bg};
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
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  letter-spacing: -1px;

  @media (max-width: 968px) {
    font-size: 36px;
  }
`;

const BrandTagline = styled.p`
  font-size: 18px;
  color: ${({ theme }) => theme.colors.subtext};
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
  color: ${({ theme }) => theme.colors.text};
  font-size: 16px;
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
`;

const AuthCard = styled.div`
  background: ${({ theme }) => theme.colors.panel};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing(6)};
  width: 100%;
  max-width: 440px;
`;

const AuthHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing(4)};
`;

const AuthTitle = styled.h2`
  font-size: 28px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 ${({ theme }) => theme.spacing(1)} 0;
`;

const AuthSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.subtext};
  margin: 0;
  font-size: 14px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing(2)};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.bg};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s ease;
  margin-top: ${({ theme }) => theme.spacing(1)};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.accentHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  padding: ${({ theme }) => theme.spacing(2)};
  background: rgba(217, 140, 126, 0.1);
  border: 1px solid ${({ theme }) => theme.colors.danger};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.danger};
  font-size: 14px;
`;

const AuthFooter = styled.div`
  margin-top: ${({ theme }) => theme.spacing(4)};
  text-align: center;
`;

const ToggleText = styled.div`
  color: ${({ theme }) => theme.colors.subtext};
  font-size: 14px;
`;

const ToggleLink = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.accent};
  font-size: 14px;
  padding: 0;
  text-decoration: underline;
  transition: color 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.accentHover};
  }
`;
