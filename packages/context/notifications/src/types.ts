export type TemplateData = {
  welcome: {
    firstName: string;
    lastName: string;
    appUrl: string;
  };
  'share-invite': {
    inviterName: string;
    resourceName: string;
    inviteUrl: string;
  };
  digest: {
    firstName: string;
    lastName: string;
    periodLabel: string;
    summaryLine: string;
    highlights: { title: string; detail: string }[];
    digestUrl: string;
  };
  passwordReset: {
    firstName: string;
  };
  forgotPassword: {
    code: string;
    appName?: string;
  };
  publicShare: {
    inviterName: string;
    resourceName: string;
    publicUrl: string;
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
