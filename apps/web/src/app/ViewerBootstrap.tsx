import styled from 'styled-components';
import { useViewer } from '../hooks/useViewer';

import type { Viewer } from '../hooks/useViewer';

interface ViewerBootstrapProps {
  children: (viewer?: Viewer) => React.ReactNode;
}

export const ViewerBootstrap = ({ children }: ViewerBootstrapProps) => {
  const { viewer, loading, error } = useViewer();

  if (loading) return <LoadingShell />;
  if (error) return children(undefined);

  return <>{children(viewer)}</>;
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
