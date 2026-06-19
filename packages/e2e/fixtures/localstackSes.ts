import type { APIRequestContext } from '@playwright/test';

const LOCALSTACK_ENDPOINT = 'http://localhost:4566';

export const LOCALSTACK_SES_URL = `${LOCALSTACK_ENDPOINT}/_aws/ses`;

type SesMessageBody = {
  html_part?: string | null;
  text_part?: string | null;
};

type SesMessage = {
  Destination?: {
    ToAddresses?: string[];
  };
  Body?: SesMessageBody;
  RawData?: string;
};

type SesMessagesResponse = {
  messages?: SesMessage[];
};

const SHARE_INVITE_PATH_PATTERN = /\/shared\/[^\s"'<>\)]+/;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const rawDataRecipientMatches = (rawData: string, recipientEmail: string): boolean => {
  const toLine = rawData.split(/\r?\n/).find((line) => /^To:/i.test(line));
  return toLine?.includes(recipientEmail) ?? false;
};

const getSesMessageSearchableParts = (message: SesMessage): string[] =>
  [message.Body?.html_part, message.Body?.text_part, message.RawData].filter(
    (part): part is string => typeof part === 'string' && part.length > 0,
  );

export const retrieveLocalStackSesMessages = async (
  request: APIRequestContext,
): Promise<SesMessage[]> => {
  const response = await request.get(LOCALSTACK_SES_URL);
  if (!response.ok()) {
    throw new Error(
      `Failed to retrieve SES messages: ${response.status()} ${response.statusText()}`,
    );
  }
  const payload = (await response.json()) as SesMessagesResponse;
  return payload.messages ?? [];
};

export const clearLocalStackSesMessages = async (): Promise<void> => {
  const response = await fetch(LOCALSTACK_SES_URL, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`Failed to clear SES messages: ${response.status} ${response.statusText}`);
  }
};

export const findSesMessageForRecipient = (
  messages: SesMessage[],
  recipientEmail: string,
): SesMessage | undefined =>
  messages.find((message) => {
    if (message.Destination?.ToAddresses?.includes(recipientEmail)) {
      return true;
    }
    if (message.RawData) {
      return rawDataRecipientMatches(message.RawData, recipientEmail);
    }
    return false;
  });

export const extractShareInviteUrl = (
  message: SesMessage,
  webBaseUrl: string,
): string | undefined => {
  for (const bodyPart of getSesMessageSearchableParts(message)) {
    const fullUrlMatch = bodyPart.match(
      new RegExp(`${escapeRegExp(webBaseUrl)}${SHARE_INVITE_PATH_PATTERN.source}`),
    );
    if (fullUrlMatch) {
      return fullUrlMatch[0];
    }

    const pathMatch = bodyPart.match(SHARE_INVITE_PATH_PATTERN);
    if (pathMatch) {
      return `${webBaseUrl}${pathMatch[0]}`;
    }
  }

  return undefined;
};
