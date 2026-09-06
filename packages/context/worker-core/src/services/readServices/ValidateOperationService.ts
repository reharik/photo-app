import { AppErrorCollection, fail, ok, Operation, OperationResult } from '@packages/contracts';
import {
  AlbumMemberReadRepository,
  GrantReadRepository,
  MediaItemReadRepository,
} from '../../repositories/readRepositories/types';
import { RequestScopeLifeCycle } from './readServiceBaseType';

export type AuthorizeMediaCommentInput = {
  mediaItemId: string;
  viewerId?: string;
};

export type AuthorizeAlbumCommentInput = {
  albumId: string;
  viewerId?: string;
};

export interface ValidateOperationService extends RequestScopeLifeCycle {
  authorizeMediaComment: (input: AuthorizeMediaCommentInput) => Promise<OperationResult<void>>;
  authorizeAlbumComment: (input: AuthorizeAlbumCommentInput) => Promise<OperationResult<void>>;
}

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
  authorizeMediaComment: async (
    input: AuthorizeMediaCommentInput,
  ): Promise<OperationResult<void>> => {
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

  authorizeAlbumComment: async (
    input: AuthorizeAlbumCommentInput,
  ): Promise<OperationResult<void>> => {
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
