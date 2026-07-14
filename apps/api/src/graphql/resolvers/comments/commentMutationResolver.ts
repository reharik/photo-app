import type {
  AddCommentCommand,
  DeleteCommentCommand,
  EditCommentCommand,
} from '@packages/media-core';
import { authenticatedWriteResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';

const commentMutationResolvers: Pick<Resolvers, 'Mutation'> = {
  Mutation: {
    addComment: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const command: AddCommentCommand = {
        authorId: ctx.viewer.id,
        targetType: args.input.targetType,
        targetId: args.input.targetId,
        parentCommentId: args.input.parentCommentId ?? undefined,
        body: args.input.body,
        viewer: ctx.viewer,
      };

      return ctx.writeServices.addComment(command);
    }),

    editComment: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const command: EditCommentCommand = {
        authorId: ctx.viewer.id,
        commentId: args.input.commentId,
        body: args.input.body,
      };

      return ctx.writeServices.editComment(command);
    }),

    deleteComment: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const command: DeleteCommentCommand = {
        authorId: ctx.viewer.id,
        commentId: args.input.commentId,
      };

      return ctx.writeServices.deleteComment(command);
    }),
  },
};

export default commentMutationResolvers;
