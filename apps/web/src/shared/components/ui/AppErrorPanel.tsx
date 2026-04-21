import styled from 'styled-components';
import type { AppError } from '../../../application/errors/types';

type AppErrorPanelProps = {
  errors: AppError[];
  title?: string;
};

const DEFAULT_TITLE = 'Please review the following';

const buildDedupeKey = (e: AppError): string => `${e.code}\0${e.field ?? ''}\0${e.message}`;

export const AppErrorPanel = ({ errors, title = DEFAULT_TITLE }: AppErrorPanelProps) => {
  if (errors.length === 0) {
    return null;
  }

  const seen = new Set<string>();
  const unique = errors.filter((err) => {
    const key = buildDedupeKey(err);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  return (
    <ValidationPanel>
      <PanelTitle>{title}</PanelTitle>
      <List>
        {unique.map((err) => {
          const key = buildDedupeKey(err);
          return (
            <ListItem key={key}>
              <Row>
                {err.field ? <SubtleFieldLabel>{err.field}</SubtleFieldLabel> : null}
                <span>{err.message}</span>
              </Row>
            </ListItem>
          );
        })}
      </List>
    </ValidationPanel>
  );
};

export const SubtleFieldLabel = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.subtext};
  opacity: 0.85;
`;

export const SoftPanel = styled.div`
  width: 100%;
  max-width: 36rem;
  margin-left: auto;
  margin-right: auto;
  box-sizing: border-box;
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing(3)};
  font-family: ${({ theme }) => theme.font.body};
`;

export const PanelTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.spacing(1)};
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
`;

const ValidationPanel = styled(SoftPanel)`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.panel};
  color: ${({ theme }) => theme.colors.text};
`;

const List = styled.ul`
  margin: 0;
  padding-left: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1.5)};
  font-size: 0.875rem;
  line-height: 1.45;
`;

const ListItem = styled.li`
  &::marker {
    color: ${({ theme }) => theme.colors.subtext};
  }
`;

const Row = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;
