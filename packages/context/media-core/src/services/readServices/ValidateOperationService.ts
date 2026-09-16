import { AppErrorCollection, fail, ok, Operation, OperationResult } from '@packages/contracts';
import { RequestScopeLifeCycle } from '@packages/infrastructure';
import {
  AlbumMemberReadRepository,
  GrantReadRepository,
  MediaItemReadRepository,
} from '../../repositories/readRepositories/types';

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

    const membershipRole = await albumMemberReadRepository.hasMembershipRoleForMediaItem(
      mediaItemId,
      viewerId,
    );
    if (membershipRole?.role.can(Operation.comment)) {
      return ok(undefined);
    }

    return fail(AppErrorCollection.mediaItem.MediaItemNotAuthorized);
  },
});
