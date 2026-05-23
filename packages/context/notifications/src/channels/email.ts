import { getResendClient } from '../client.js';

export type EmailSendInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type EmailSendResult =
  | { ok: true; id: string }
  | { ok: false; error: string; providerDetail?: string };

const buildFrom = (): string | null => {
  const address = process.env.FROM_EMAIL?.trim();
  const name = process.env.FROM_NAME?.trim();
  if (!address) {
    return null;
  }
  if (name) {
    return `${name} <${address}>`;
  }
  return address;
};

export const sendEmail = async (input: EmailSendInput): Promise<EmailSendResult> => {
  const from = buildFrom();
  if (!from) {
    return { ok: false, error: 'FROM_EMAIL environment variable is not set' };
  }

  const client = getResendClient();
  if (!client) {
    return { ok: false, error: 'RESEND_API_KEY environment variable is not set' };
  }

  const { data, error } = await client.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    ...(input.text ? { text: input.text } : {}),
  });

  if (error) {
    return {
      ok: false,
      error: error.message ?? 'Resend returned an error',
      providerDetail: JSON.stringify(error),
    };
  }

  const id = data?.id;
  if (!id) {
    return { ok: false, error: 'Resend did not return a message id' };
  }

  return { ok: true, id };
};
