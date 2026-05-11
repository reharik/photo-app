import type {
  AddCommentCommand,
  DeleteCommentCommand,
  EditCommentCommand,
} from '@packages/media-core';
import { authenticatedResolver } from '../../context/contextWrappers';
import type { Resolvers } from '../../generated/types.generated';
import { writeResultToPayload } from '../../util/writeResultToPayload';

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

      const result = await ctx.writeServices.addComment(command);
      return writeResultToPayload(result);
    }),

    editComment: authenticatedResolver(async (_parent, args, ctx) => {
      const command: EditCommentCommand = {
        viewerUserId: ctx.viewer.id,
        commentId: args.input.commentId,
        body: args.input.body,
      };

      const result = await ctx.writeServices.editComment(command);
      return writeResultToPayload(result);
    }),

    deleteComment: authenticatedResolver(async (_parent, args, ctx) => {
      const command: DeleteCommentCommand = {
        viewerUserId: ctx.viewer.id,
        commentId: args.input.commentId,
      };

      const result = await ctx.writeServices.deleteComment(command);
      return writeResultToPayload(result);
    }),
  },
};

export default commentMutationResolvers;
