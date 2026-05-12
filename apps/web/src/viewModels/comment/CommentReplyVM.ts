import { CommentTargetType } from '@packages/contracts';

export type CommentReplyVM = {
  id: string;
  targetType: CommentTargetType;
  targetId: string;
  parentCommentId?: string;
  authorId: string;
  body: string;
  displayName: string;
  displayAvatarUrl?: string;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};
