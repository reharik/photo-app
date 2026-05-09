import { EntityId, WriteResult } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';

export type DeleteCommentCommand = {
  viewerUserId: EntityId;
  commentId: EntityId;
};

export type DeleteCommentResult = {
  commentId: EntityId;
};

export interface DeleteComment extends WriteServiceBase {
  (command: DeleteCommentCommand): Promise<WriteResult<DeleteCommentResult>>;
}

type DeleteCommentDeps = Record<string, never>;

export const build__DeleteComment = (_deps: DeleteCommentDeps): DeleteComment => {
  return async (command: DeleteCommentCommand): Promise<WriteResult<DeleteCommentResult>> => {
    // TODO: Load comment by command.commentId. Return ContractError if not found.
    // TODO: Allow the delete if viewer is the comment's author OR if viewer owns
    //   the comment's target (media_item.owner_id or album owner via album_member with
    //   OWNER role). Reject with ContractError otherwise.
    // TODO: Soft-delete: set comment.deleted_at = now(). Do NOT hard delete.

    return {
      success: true,
      value: {
        commentId: command.commentId,
      },
    };
  };
};
