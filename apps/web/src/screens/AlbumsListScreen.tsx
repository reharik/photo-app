import { useApolloClient, useQuery } from '@apollo/client/react';
import { DateTime } from 'luxon';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { mapSystemError } from '../application/errors/mapToError';
import type { AppError } from '../application/errors/types';
import { executeMutation } from '../application/graphql/executeMutation';
import {
  CreateAlbumDocument,
  ViewerAlbumsDocument,
  type CreateAlbumMutation,
} from '../graphql/generated/types';

export const AlbumsListScreen = () => {
  const navigate = useNavigate();
  const client = useApolloClient();
  const { data, loading, error, refetch } = useQuery(ViewerAlbumsDocument, {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [appErrors, setAppErrors] = useState<AppError[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const nodes = data?.viewer?.albums.nodes ?? [];
  const hasItems = nodes.length > 0;

  const formatUpdatedAt = (value: unknown): string => {
    if (typeof value === 'string') {
      const dt = DateTime.fromISO(value);
      if (dt.isValid) {
        return dt.toLocaleString(DateTime.DATE_MED);
      }
    }
    return '—';
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setNewTitle('');
    setAppErrors([]);
  };

  const submitCreate = async () => {
    const title = newTitle.trim();
    if (!title) {
      setAppErrors([mapSystemError('VALIDATION', 'Enter an album title.', false)]);
      return;
    }

    setIsCreating(true);
    setAppErrors([]);

    const result = await executeMutation(
      client,
      {
        mutation: CreateAlbumDocument,
        variables: { input: { title } },
      },
      (mutationData: CreateAlbumMutation) => mutationData.createAlbum,
    );

    setIsCreating(false);

    if (!result.success) {
      setAppErrors(result.errors);
      return;
    }

    closeCreate();
    await refetch();
    await navigate(`/albums/${result.data.albumId}`);
  };

  return (
    <Container>
      <Header>
        <Title>Albums</Title>
        <HeaderActions>
          <PrimaryButton type="button" onClick={() => setCreateOpen(true)}>
            <PrimaryButtonLabelWide>Add album</PrimaryButtonLabelWide>
            <PrimaryButtonLabelNarrow>Add</PrimaryButtonLabelNarrow>
          </PrimaryButton>
        </HeaderActions>
      </Header>

      {appErrors.length > 0
        ? appErrors.map((err) => (
            <InlineNotice key={`${err.code}-${err.message}`} role="alert">
              {err.message}
            </InlineNotice>
          ))
        : null}

      <Content>
        {loading ? (
          <StatusMessage>Loading albums…</StatusMessage>
        ) : error ? (
          <StatusMessage role="alert">Could not load albums. {error.message}</StatusMessage>
        ) : hasItems ? (
          <AlbumGrid>
            {nodes.map((album) => (
              <AlbumCard key={album.id} to={`/albums/${album.id}`}>
                <AlbumThumb>
                  {(() => {
                    const u = album.coverMedia ? album.coverMedia.derivedUrls.thumbnail : undefined;
                    return u != null && u !== '' ? (
                      <ThumbImage src={u} alt={album.title} />
                    ) : (
                      <ThumbIcon aria-hidden>
                        {album.coverMedia?.kind === 'VIDEO' ? '🎬' : '🖼️'}
                      </ThumbIcon>
                    );
                  })()}
                </AlbumThumb>
                <AlbumInfo>
                  <AlbumName>{album.title}</AlbumName>
                  <AlbumMeta>Updated {formatUpdatedAt(album.updatedAt)}</AlbumMeta>
                </AlbumInfo>
              </AlbumCard>
            ))}
          </AlbumGrid>
        ) : (
          <EmptyState>
            <EmptyIcon>📁</EmptyIcon>
            <EmptyTitle>No albums yet</EmptyTitle>
            <EmptyText>Create an album to organize your media.</EmptyText>
            <EmptyButton type="button" onClick={() => setCreateOpen(true)}>
              Add album
            </EmptyButton>
          </EmptyState>
        )}
      </Content>

      {createOpen ? (
        <ModalBackdrop role="presentation" onClick={() => !isCreating && closeCreate()}>
          <Modal
            role="dialog"
            aria-labelledby="create-album-title"
            onClick={(e) => e.stopPropagation()}
          >
            <ModalTitle id="create-album-title">New album</ModalTitle>
            <ModalFieldLabel htmlFor="album-title-input">Title</ModalFieldLabel>
            <ModalTextInput
              id="album-title-input"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Summer 2026"
              autoFocus
              disabled={isCreating}
            />
            <ModalActions>
              <SecondaryButton type="button" onClick={closeCreate} disabled={isCreating}>
                Cancel
              </SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={() => void submitCreate()}
                disabled={isCreating}
              >
                {isCreating ? 'Creating…' : 'Create'}
              </PrimaryButton>
            </ModalActions>
          </Modal>
        </ModalBackdrop>
      ) : null}
    </Container>
  );
};

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: ${({ theme }) => theme.spacing(4)} ${({ theme }) => theme.spacing(6)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)};
  min-width: 0;

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(3)};
    align-items: center;
  }
`;

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

const PrimaryButtonLabelWide = styled.span`
  @media (max-width: 768px) {
    display: none;
  }
`;

const PrimaryButtonLabelNarrow = styled.span`
  display: none;

  @media (max-width: 768px) {
    display: inline;
  }
`;

const PrimaryButton = styled.button`
  padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(3)};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.bg};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.accentHover};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
    font-size: 13px;
    font-weight: 600;
  }
`;

const SecondaryButton = styled.button`
  padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(3)};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 14px;
  font-weight: 500;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.accent};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const InlineNotice = styled.div`
  padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(6)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.danger};
  font-size: 14px;

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(3)};
    font-size: 13px;
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing(6)};

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(3)};
  }
`;

const StatusMessage = styled.div`
  max-width: 560px;
  margin: 0 auto;
  color: ${({ theme }) => theme.colors.subtext};
  font-size: 15px;
`;

const AlbumGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing(3)};
  max-width: 1400px;
  margin: 0 auto;
`;

const AlbumCard = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

const AlbumThumb = styled.div`
  aspect-ratio: 4 / 3;
  background: ${({ theme }) => theme.colors.panel};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const ThumbIcon = styled.div`
  font-size: 48px;
  opacity: 0.35;
`;

const ThumbImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AlbumInfo = styled.div`
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(0.5)};
`;

const AlbumName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const AlbumMeta = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.subtext};
`;

const EmptyState = styled.div`
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

const EmptyButton = styled.button`
  margin-top: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(4)};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.bg};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
  }
`;

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: ${({ theme }) => theme.spacing(3)};
`;

const Modal = styled.div`
  width: 100%;
  max-width: 400px;
  background: ${({ theme }) => theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing(4)};
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.spacing(3)};
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const ModalFieldLabel = styled.label`
  display: block;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ theme }) => theme.colors.subtext};
  margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

const ModalTextInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(2)};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.panel};
  color: ${({ theme }) => theme.colors.text};
  font-size: 15px;
  margin-bottom: ${({ theme }) => theme.spacing(3)};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accent};
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing(2)};
`;
