import type {
  AddCommentCommand,
  DeleteCommentCommand,
  EditCommentCommand,
} from '@packages/media-core';
import { authenticatedResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';

const commentMutationResolvers: Pick<Resolvers, 'Mutation'> = {
  Mutation: {
    addComment: authenticatedResolver(async (_parent, args, ctx) => {
      const command: AddCommentCommand = {
        viewerUserId: ctx.viewer.id,
        targetType: args.input.targetType ?? undefined,
        targetId: args.input.targetId ?? undefined,
        parentCommentId: args.input.parentCommentId ?? undefined,
        body: args.input.body,
      };

      return ctx.writeServices.addComment(command);
    }),

    editComment: authenticatedResolver(async (_parent, args, ctx) => {
      const command: EditCommentCommand = {
        viewerUserId: ctx.viewer.id,
        commentId: args.input.commentId,
        body: args.input.body,
      };

      return ctx.writeServices.editComment(command);
    }),

    deleteComment: authenticatedResolver(async (_parent, args, ctx) => {
      const command: DeleteCommentCommand = {
        viewerUserId: ctx.viewer.id,
        commentId: args.input.commentId,
      };

      return ctx.writeServices.deleteComment(command);
    }),
  },
};

export default commentMutationResolvers;
