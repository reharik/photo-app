import { AsyncNotificationKind, BatchedPayloadKind, EntityType } from '@packages/contracts';
import { EnumSubset } from '@reharik/smart-enum';

export type ActivityDigestData = {
  data: Map<BatchedPayloadKind, ActivitySection>; // ← keyed by BatchedPayloadKind not EntityType
  appUrl: string; // client base URL; each row builds its own absolute link from it
};

export type ReactionTargetKind = EnumSubset<EntityType, 'comment' | 'mediaItem'>;
export type CommentRowKind = EnumSubset<AsyncNotificationKind, 'commentPosted' | 'replyPosted'>;

export type AlbumSection = { albumTitle: string; albumId: string; itemCount: number }[];

export type CommentSectionComment = {
  commenterName: string;
  kind: CommentRowKind;
  snippet: string;
};
export type CommentSectionItem = {
  mediaItemId: string;
  comments: CommentSectionComment[];
};
export type CommentSection = CommentSectionItem[];

export type ReactionItem = { reactorName: string; reactionTargetType: ReactionTargetKind };
export type ReactionSection = {
  containerId: string;
  mediaId: string;
  reactions: ReactionItem[];
}[];

export type ActivitySection = AlbumSection | CommentSection | ReactionSection;

export type TemplateData = {
  welcome: {
    firstName: string;
    lastName: string;
    appUrl: string;
  };
  memberAlbumShared: {
    inviterName: string;
    resourceName: string;
    inviteUrl: string;
    itemCount: number;
  };
  guestAlbumShared: {
    inviterName: string;
    inviterEmail: string;
    resourceName: string;
    inviteUrl: string;
    signupUrl: string;
    itemCount: number;
  };
  memberItemsShared: {
    inviterName: string;
    inviteUrl: string;
  };
  activityDigest: ActivityDigestData;
  passwordChanged: {
    firstName: string;
    changedAt: string;
  };
  verificationCode: {
    code: string;
  };
};

export type TemplateName = keyof TemplateData;

export type NotificationChannel = 'email' | 'sms';

export type NotificationPayload<T extends TemplateName> = {
  to: string | { email?: string; phone?: string };
  template: T;
  data: TemplateData[T];
  channels?: NotificationChannel[];
};

export type NotifySuccess = { success: true; id: string };

export type NotifyFailure = { success: false; error: string };

export type NotifyResult = NotifySuccess | NotifyFailure;

export type EmailConfig = {
  fromEmail: string;
  fromName: string;
  awsRegion: string;
  awsEndpoint?: string; // Will be undefined in production, LocalStack URL in development
};
