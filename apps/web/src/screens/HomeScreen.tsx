import { useApolloClient, useQuery } from '@apollo/client/react';
import { DateTime } from 'luxon';
import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import type { MediaItemLocationState } from '../app/mediaItemNavigationState';
import { mediaItemDetailPath } from '../app/paths';
import { AppError } from '../application/errors/types';
import { mediaUploadWorkflow } from '../application/media/mediaUploadWorkflow';
import { ViewerRecentMediaDocument } from '../graphql/generated/types';
import { useMultiSelectIds } from '../hooks/useMultiSelectIds';
import { GallerySelectionBar } from '../shared/components/gallery/GallerySelectionBar';
import { SelectionThumbOverlay } from '../shared/components/gallery/SelectionCornerCheck';
import { SelectionToggleControl } from '../shared/components/gallery/SelectionToggleControl';

export const HomeScreen = () => {
  const navigate = useNavigate();
  const client = useApolloClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [appErrors, setAppErrors] = useState<AppError[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { data, loading, error, refetch } = useQuery(ViewerRecentMediaDocument, {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const nodes = useMemo(() => data?.viewer?.mediaItems.nodes ?? [], [data]);
  const hasItems = nodes.length > 0;

  const orderedMediaIds = useMemo(() => nodes.map((n) => n.id), [nodes]);
  const { selectionCount, isSelected, handleModifierClick, toggleSelectAt, clearSelection } =
    useMultiSelectIds(orderedMediaIds);

  const startUploadPick = () => {
    setAppErrors([]);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) {
      return;
    }

    setIsUploading(true);
    setAppErrors([]);

    const result = await mediaUploadWorkflow(client, file);

    setIsUploading(false);

    if (!result.success) {
      setAppErrors(result.errors);
      return;
    }

    await refetch();
    await navigate(mediaItemDetailPath(result.data.mediaItemId), {
      state: { mediaGalleryIds: [result.data.mediaItemId] } satisfies MediaItemLocationState,
    });
  };

  const formatCreatedAt = (value: unknown): string => {
    if (typeof value === 'string') {
      const dt = DateTime.fromISO(value);
      if (dt.isValid) {
        return dt.toLocaleString(DateTime.DATE_MED);
      }
    }
    return '—';
  };

  const kindLabel = (kind: string): string => {
    if (kind === 'VIDEO') {
      return 'Video';
    }
    if (kind === 'PHOTO') {
      return 'Photo';
    }
    return 'Media';
  };

  return (
    <Container>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <Header>
        {selectionCount > 0 ? (
          <GallerySelectionBar count={selectionCount} onClear={clearSelection} />
        ) : (
          <>
            <Title>Recent Media</Title>
            <HeaderActions>
              <UploadButton type="button" onClick={startUploadPick} disabled={isUploading}>
                {isUploading ? (
                  'Uploading…'
                ) : (
                  <>
                    <UploadButtonLabelWide>Upload Media</UploadButtonLabelWide>
                    <UploadButtonLabelNarrow>Upload</UploadButtonLabelNarrow>
                  </>
                )}
              </UploadButton>
            </HeaderActions>
          </>
        )}
      </Header>

      {appErrors
        ? appErrors.map((err) => <InlineNotice role="alert">{err.message}</InlineNotice>)
        : null}

      <Content>
        {loading ? (
          <StatusMessage>Loading media…</StatusMessage>
        ) : error ? (
          <StatusMessage role="alert">Could not load media. {error.message}</StatusMessage>
        ) : hasItems ? (
          <MediaGrid>
            {nodes.map((item, index) => {
              const thumbUrl = item.derivedUrls.thumbnail;
              const itemLinkState = {
                mediaGalleryIds: nodes.map((n) => n.id),
              } satisfies MediaItemLocationState;
              return (
                <MediaGridItem key={item.id}>
                  <MediaThumb data-selectable-thumb="">
                    <ThumbLink
                      to={mediaItemDetailPath(item.id)}
                      state={itemLinkState}
                      onClickCapture={(e) => {
                        handleModifierClick(e, item.id, index);
                      }}
                    >
                      <SelectionThumbOverlay visible={isSelected(item.id)} />
                      {thumbUrl != null && thumbUrl !== '' ? (
                        <ThumbImage
                          src={thumbUrl}
                          alt={item.title?.trim() || kindLabel(item.kind)}
                        />
                      ) : (
                        <ThumbIcon aria-hidden>{item.kind === 'VIDEO' ? '🎬' : '🖼️'}</ThumbIcon>
                      )}
                    </ThumbLink>
                    <SelectionToggleControl
                      selected={isSelected(item.id)}
                      onToggle={() => {
                        toggleSelectAt(item.id, index);
                      }}
                    />
                    {item.status === 'PENDING' ? <StatusPill>Processing</StatusPill> : null}
                    {item.status === 'FAILED' ? <StatusPill $fail>Failed</StatusPill> : null}
                  </MediaThumb>
                  <CaptionLink
                    to={mediaItemDetailPath(item.id)}
                    state={itemLinkState}
                    onClickCapture={(e) => {
                      handleModifierClick(e, item.id, index);
                    }}
                  >
                    <MediaInfo>
                      <MediaTitle>{item.title?.trim() || kindLabel(item.kind)}</MediaTitle>
                      <MediaMeta>
                        {formatCreatedAt(item.createdAt)}
                        {item.width && item.height ? ` · ${item.width}×${item.height}` : ''}
                      </MediaMeta>
                    </MediaInfo>
                  </CaptionLink>
                </MediaGridItem>
              );
            })}
          </MediaGrid>
        ) : (
          <EmptyState>
            <EmptyIcon>📷</EmptyIcon>
            <EmptyTitle>No media yet</EmptyTitle>
            <EmptyText>Upload your first media to start building your family gallery</EmptyText>
            <EmptyButton type="button" onClick={startUploadPick} disabled={isUploading}>
              {isUploading ? 'Uploading…' : 'Upload Media'}
            </EmptyButton>
          </EmptyState>
        )}
      </Content>
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

const UploadButtonLabelWide = styled.span`
  @media (max-width: 768px) {
    display: none;
  }
`;

const UploadButtonLabelNarrow = styled.span`
  display: none;

  @media (max-width: 768px) {
    display: inline;
  }
`;

const UploadButton = styled.button`
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

const MediaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing(3)};
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: ${({ theme }) => theme.spacing(2)};
  }
`;

const MediaGridItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

const ThumbLink = styled(Link)`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  text-decoration: none;
`;

const CaptionLink = styled(Link)`
  display: block;
  text-align: left;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
`;

const MediaThumb = styled.div`
  position: relative;
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

const StatusPill = styled.span<{ $fail?: boolean }>`
  position: absolute;
  bottom: ${({ theme }) => theme.spacing(1)};
  right: ${({ theme }) => theme.spacing(1)};
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: ${({ theme }) => theme.spacing(0.5)} ${({ theme }) => theme.spacing(1)};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ $fail }) => ($fail ? 'rgba(217, 140, 126, 0.25)' : 'rgba(0, 0, 0, 0.55)')};
  color: ${({ theme }) => theme.colors.bg};
`;

const MediaInfo = styled.div`
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(0.5)};
`;

const MediaTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const MediaMeta = styled.div`
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

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.accentHover};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
