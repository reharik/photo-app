import { AppErrorCollection, Operation } from '@packages/contracts';
import { fail, ok } from '../..';
import {
  AlbumMemberReadRepository,
  GrantReadRepository,
  MediaItemReadRepository,
} from '../../repositories/readRepositories/types';
import { WriteResult } from '../../types/types';

export type AuthorizeMediaCommentInput = {
  mediaItemId: string;
  viewerId?: string;
};

export type AuthorizeAlbumCommentInput = {
  albumId: string;
  viewerId?: string;
};

export type ValidateOperationService = {
  authorizeMediaComment: (input: AuthorizeMediaCommentInput) => Promise<WriteResult<void>>;
  authorizeAlbumComment: (input: AuthorizeAlbumCommentInput) => Promise<WriteResult<void>>;
};

type ValidateOperationServiceDeps = {
  mediaItemReadRepository: MediaItemReadRepository;
  grantReadRepository: GrantReadRepository;
  albumMemberReadRepository: AlbumMemberReadRepository;
};
export const build__ValidateOperationService = ({
  mediaItemReadRepository,
  grantReadRepository,
  albumMemberReadRepository,
}: ValidateOperationServiceDeps): ValidateOperationService => ({
  authorizeMediaComment: async (input: AuthorizeMediaCommentInput): Promise<WriteResult<void>> => {
    const { mediaItemId, viewerId } = input;
    if (!viewerId) {
      return fail(AppErrorCollection.mediaItem.MediaItemNotAuthorized);
    }

    const mediaItemRow = await mediaItemReadRepository.getByIdForAuthorization({
      mediaItemId,
    });
    if (!mediaItemRow) {
      return fail(AppErrorCollection.mediaItem.MediaItemNotFound);
    }

    const isOwner = viewerId !== undefined && mediaItemRow.ownerId === viewerId;

    if (isOwner) {
      return ok(undefined);
    }

    const granted = await grantReadRepository.hasActiveGrantPermission({
      mediaItemId,
      viewerId,
      operation: Operation.comment,
    });

    if (granted) {
      return ok(undefined);
    }
    return fail(AppErrorCollection.mediaItem.MediaItemNotAuthorized);
  },

  authorizeAlbumComment: async (input: AuthorizeAlbumCommentInput): Promise<WriteResult<void>> => {
    const { albumId, viewerId } = input;
    if (!viewerId) {
      return fail(AppErrorCollection.mediaItem.MediaItemNotAuthorized);
    }

    const albumMember = await albumMemberReadRepository.getMemberByUserId({
      albumId,
      viewerId,
    });

    if (albumMember && albumMember.role.can(Operation.comment)) {
      return ok(undefined);
    }

    const granted = await grantReadRepository.hasActiveAccessGrantPermission({
      albumId,
      viewerId,
      operation: Operation.comment,
    });

    if (granted) {
      return ok(undefined);
    }
    return fail(AppErrorCollection.mediaItem.MediaItemNotAuthorized);
  },
});
