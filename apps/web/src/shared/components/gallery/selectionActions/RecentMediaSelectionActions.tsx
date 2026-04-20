import styled from 'styled-components';

export const RecentMediaSelectionActions = () => {
  return (
    <>
      <ToolbarAction type="button" disabled title="Coming soon">
        Share
      </ToolbarAction>
      <ToolbarAction type="button" disabled title="Coming soon">
        Add to album
      </ToolbarAction>
      <ToolbarAction type="button" disabled title="Coming soon">
        Delete
      </ToolbarAction>
    </>
  );
};

const ToolbarAction = styled.button`
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.subtext};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: not-allowed;
  opacity: 0.75;

  &:disabled {
    pointer-events: none;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;
