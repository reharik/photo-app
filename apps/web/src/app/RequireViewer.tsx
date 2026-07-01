import styled from 'styled-components';
import { useViewer } from '../hooks/useViewer';

import { Navigate, Outlet, useLocation } from 'react-router-dom';

export const RequireViewer = () => {
  const { viewer, loading, error } = useViewer();
  const location = useLocation();

  if (loading) return <LoadingShell />;
  if (error || !viewer)
    return (
      <Navigate to="/login" replace state={{ returnTo: location.pathname + location.search }} />
    );

  return <Outlet context={{ viewer }} />;
};

const LoadingShell = () => {
  return (
    <LoadingContainer>
      <LoadingContent>
        <Spinner />
        <LoadingText>Loading...</LoadingText>
      </LoadingContent>
    </LoadingContainer>
  );
};

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  background: ${({ theme }) => theme.color.body};
`;

const LoadingContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${({ theme }) => theme.color.border};
  border-top-color: ${({ theme }) => theme.color.loadingSpinner};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.div`
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  font-size: 14px;
  letter-spacing: 0.5px;
`;
