import { CommentTargetType } from '@packages/contracts';
import { ok } from '../../../domain';
import { EntityId, WriteResult } from '../../../types/types';
import { CommentRow } from '../../readServices/types';
import { WriteServiceBase } from '../writeServiceBaseType';

export type EditCommentCommand = {
  viewerUserId: EntityId;
  commentId: EntityId;
  body: string;
};

export type EditCommentResult = {
  comment: CommentRow;
};

export interface EditComment extends WriteServiceBase {
  (command: EditCommentCommand): Promise<WriteResult<EditCommentResult>>;
}

type EditCommentDeps = Record<string, never>;

export const build__EditComment = (_deps: EditCommentDeps): EditComment => {
  return async (command: EditCommentCommand): Promise<WriteResult<EditCommentResult>> => {
    // TODO: Load comment by command.commentId. Return ContractError if not found.
    // TODO: Reject with ContractError if command.viewerUserId !== comment.author_user_id
    //   (only the original author may edit their own comment).
    // TODO: Update comment.body to command.body and bump comment.updated_at to now().

    return ok({
      comment: {
        id: command.commentId,
        targetType: CommentTargetType.mediaItem,
        targetId: '',
        parentCommentId: undefined,
        authorUserId: command.viewerUserId,
        body: command.body,
        displayName: 'STUB_DISPLAY_NAME', // TODO: Get the display name from the viewer
        displayAvatarUrl: undefined,
        createdAt: new Date(), // TODO: Generate a real createdAt
        updatedAt: new Date(), // TODO: Generate a real updatedAt
        deletedAt: undefined,
      },
    });
  };
};
