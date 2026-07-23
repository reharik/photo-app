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

const SHARE_INVITE_PATH_PATTERN = /\/shared\/[^\s"'<>)]+/;

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
  // LocalStack lazily initializes the SES message-store route, so a fresh
  // container can 404 this endpoint until SES has been exercised. Treat that as
  // "no messages yet" so an `expect.poll` retries instead of aborting.
  if (response.status() === 404) {
    return [];
  }
  if (!response.ok()) {
    throw new Error(
      `Failed to retrieve SES messages: ${response.status()} ${response.statusText()}`,
    );
  }
  const payload = (await response.json()) as SesMessagesResponse;
  return payload.messages ?? [];
};

/**
 * Snapshot of how many SES messages are currently stored. Take this right before an
 * action that sends mail, then slice `retrieveLocalStackSesMessages(...)` from it, to
 * consider only newly-sent messages — a non-destructive alternative to clearing the
 * store (LocalStack's DELETE wipes ALL mail, so it can't isolate one test without
 * destroying every other test's — and every manually-inspectable — email).
 */
export const countLocalStackSesMessages = async (
  request: APIRequestContext,
): Promise<number> => (await retrieveLocalStackSesMessages(request)).length;

export const clearLocalStackSesMessages = async (): Promise<void> => {
  const response = await fetch(LOCALSTACK_SES_URL, { method: 'DELETE' });
  // A cold SES route may 404 before it's initialized — nothing to clear yet.
  if (response.status === 404) {
    return;
  }
  if (!response.ok) {
    throw new Error(`Failed to clear SES messages: ${response.status} ${response.statusText}`);
  }
};

export const findSesMessageForRecipient = (
  messages: SesMessage[],
  recipientEmail: string,
  text?: string,
): SesMessage | undefined => {
  const email = recipientEmail.toLocaleLowerCase();
  return messages.find((message) => {
    // SendRawEmail messages carry no Destination in LocalStack — the only recipient
    // signal is the raw `To:` header — so check both paths.
    const recipientMatches =
      (message.Destination?.ToAddresses?.includes(email) ?? false) ||
      (message.RawData ? rawDataRecipientMatches(message.RawData, email) : false);
    if (!recipientMatches) {
      return false;
    }
    // The text filter must apply regardless of how the recipient matched, or a
    // different email to the same recipient (e.g. the share invite) wins the find.
    return !text || getSesMessageSearchableParts(message).some((part) => part.includes(text));
  });
};

export const sesMessageBodyIncludes = (message: SesMessage, text: string): boolean =>
  getSesMessageSearchableParts(message).some((part) => part.includes(text));

/**
 * Pulls the 6-digit code out of an email-verification message. The template renders
 * it in the preview text ("Your <App> verification code is 123456.") and again in the
 * code block, so match that phrase first and fall back to a lone 6-digit run.
 */
export const extractVerificationCode = (message: SesMessage): string | undefined => {
  for (const part of getSesMessageSearchableParts(message)) {
    const labelled = part.match(/verification code is\s*(\d{6})/i);
    if (labelled) {
      return labelled[1];
    }
  }
  for (const part of getSesMessageSearchableParts(message)) {
    const bare = part.match(/\b(\d{6})\b/);
    if (bare) {
      return bare[1];
    }
  }
  return undefined;
};

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
