import styled from 'styled-components';

type EmptyStateProps = {
  title: string;
  text: string;
  action?: React.ReactNode;
};

export const EmptyState = ({ title, text, action }: EmptyStateProps) => {
  return (
    <EmptyStateContainer>
      <EmptyIcon>📷</EmptyIcon>
      <EmptyTitle>{title}</EmptyTitle>
      <EmptyText>{text}</EmptyText>
      {action ? action : null}
    </EmptyStateContainer>
  );
};

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(8)};
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  opacity: 0.3;
`;

const EmptyTitle = styled.h2`
  font-size: 24px;
  font-weight: 500;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
`;

const EmptyText = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.subtext};
  margin: 0;
  max-width: 400px;
`;
