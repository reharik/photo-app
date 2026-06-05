import styled from 'styled-components';

export const ShellNavIconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: transparent;
  color: ${({ theme }) => theme.color.bodyText};
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.color.body};
    color: ${({ theme }) => theme.color.bodyText};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }
`;
