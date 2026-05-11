import { CommentTargetType } from '@packages/contracts';
import { ok } from '../../../domain';
import { EntityId, WriteResult } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';

export type AddCommentCommand = {
  /**
   * Nullable mirrors the DB column: v1 rejects null authors in the service body,
   * but keeping it nullable here allows the anon-via-share-token path to land
   * on the same command type in a future iteration without a type change.
   */
  viewerUserId: EntityId | null;
  /**
   * Ignored when parentCommentId is set; the service copies target from the parent.
   */
  targetType?: CommentTargetType;
  /**
   * Ignored when parentCommentId is set; the service copies target from the parent.
   */
  targetId?: EntityId;
  parentCommentId?: EntityId;
  body: string;
};

export type AddCommentResult = {
  commentId: EntityId;
};

export interface AddComment extends WriteServiceBase {
  (command: AddCommentCommand): Promise<WriteResult<AddCommentResult>>;
}

type AddCommentDeps = Record<string, never>;

export const build__AddComment = (_deps: AddCommentDeps): AddComment => {
  return async (command: AddCommentCommand): Promise<WriteResult<AddCommentResult>> => {
    // TODO: Validate viewer is authed (command.viewerUserId present). Return ContractError
    //   if null. (Eventually the anon-via-share-token path will skip this check — leave
    //   a branch point here.)

    if (command.parentCommentId) {
      // TODO: Load parent comment by command.parentCommentId.
      // TODO: Copy parent.target_type and parent.target_id down onto this comment
      //   (silently ignore any targetType / targetId the caller passed).
      // TODO: Reject with ContractError if parent.parent_comment_id is non-null
      //   (two-level cap: replies-to-replies are not allowed; service-layer rule only,
      //   not a DB constraint — easy to remove later).
    } else {
      // TODO: Validate target exists — query media_item or album table based on targetType.
      // TODO: Validate viewer can comment on target: viewer must either own the target
      //   OR have an access_grant with permission IN ('COMMENT', 'DOWNLOAD').
      //   Do NOT introduce a new permission level; use the existing access_grant table.
    }

    // TODO: Look up viewer's display_name and avatar_url from the user table and
    //   snapshot them into the row (denormalized — do not join through user on reads).

    // TODO: Insert into the comment table.

    return ok({
      commentId: 'stub-comment-id',
    });
  };
};
