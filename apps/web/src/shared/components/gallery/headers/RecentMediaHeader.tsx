import styled from 'styled-components';

import { UploadMediaButton } from '../../UploadMediaButton';

type RecentMediaHeaderProps = {
  onComplete: () => void;
};

export const RecentMediaHeader = ({ onComplete }: RecentMediaHeaderProps) => {
  return (
    <div>
      <Title>Recent Media</Title>
      <HeaderActions>
        <UploadMediaButton setAppErrors={setAppErrors} onComplete={onComplete} />
      </HeaderActions>
    </div>
  );
};

const Title = styled.h1`
  font-size: 32px;
  font-weight: 500;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  letter-spacing: -0.5px;
  min-width: 0;

  @media (max-width: 768px) {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.2px;
    flex: 1;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  flex-shrink: 0;
`;
