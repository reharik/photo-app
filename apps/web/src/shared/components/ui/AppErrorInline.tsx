import styled from 'styled-components';
import type { AppError } from '../../../application/errors/types';

type AppErrorInlineProps = {
  error: AppError;
};

export const AppErrorInline = ({ error }: AppErrorInlineProps) => {
  return (
    <Wrap>
      {error.field ? <Field>{error.field}</Field> : null}
      <span>{error.message}</span>
    </Wrap>
  );
};

const Wrap = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing(1)};
  max-width: 100%;
  font-size: 0.8125rem;
  line-height: 1.35;
  color: ${({ theme }) => theme.colors.text};
`;

const Field = styled.span`
  font-size: 0.75rem;
  opacity: 0.85;
`;
