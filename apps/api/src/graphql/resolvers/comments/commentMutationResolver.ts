import type {
  AddCommentCommand,
  DeleteCommentCommand,
  EditCommentCommand,
} from '@packages/media-core';
import { authenticatedWriteResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';
import { writeResultToPayload } from '../../util/writeResultToPayload';

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

      const result = await ctx.writeServices.addComment(command);
      return writeResultToPayload(result);
    }),

    editComment: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const command: EditCommentCommand = {
        authorId: ctx.viewer.id,
        commentId: args.input.commentId,
        body: args.input.body,
      };

      const result = await ctx.writeServices.editComment(command);
      return writeResultToPayload(result);
    }),

    deleteComment: authenticatedWriteResolver(async (_parent, args, ctx) => {
      const command: DeleteCommentCommand = {
        authorId: ctx.viewer.id,
        commentId: args.input.commentId,
      };

      const result = await ctx.writeServices.deleteComment(command);
      return writeResultToPayload(result);
    }),
  },
};

export default commentMutationResolvers;
