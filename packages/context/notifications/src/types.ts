import { BatchedPayloadKind, EntityType } from '@packages/contracts';
import { EnumSubset } from '@reharik/smart-enum';

export type ActivityDigestData = {
  data: Map<BatchedPayloadKind, ActivitySection>; // ← keyed by BatchedPayloadKind not EntityType
  viewUrl: string;
};

export type ReactionTargetKind = EnumSubset<EntityType, 'comment' | 'mediaItem'>;

export type AlbumSection = { albumTitles: string[] };

export type CommentSectionComment = { commenterName: string; snippet: string };
export type CommentSectionItem = { mediaItemId: string; comments: CommentSectionComment[] };
export type CommentSection = CommentSectionItem[];

export type ReactionItem = { reactorName: string; reactionTargetType: ReactionTargetKind };
export type ReactionSection = {
  containerId: string;
  reactions: ReactionItem[];
}[];

export type ActivitySection = AlbumSection | CommentSection | ReactionSection;

export type TemplateData = {
  welcome: {
    firstName: string;
    lastName: string;
    appUrl: string;
  };
  albumShareInvite: {
    inviterName: string;
    resourceName: string;
    inviteUrl: string;
  };
  albumGuestInvite: {
    inviterName: string;
    resourceName: string;
    inviteUrl: string;
    signupUrl: string;
  };
  itemShareInvite: {
    inviterName: string;
    resourceName: string;
    inviteUrl: string;
  };
  activityDigest: ActivityDigestData;
  passwordReset: {
    firstName: string;
  };
  emailVerification: {
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
