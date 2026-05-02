/**
 * SMS channel (stub).
 *
 * When implementing:
 * - Add a provider SDK (e.g. Twilio: `twilio` npm package).
 * - Store account SID, auth token or API key, and a verified `FROM` number or
 *   messaging service SID in environment variables.
 * - Map `NotificationPayload` + rendered plain text (or template-specific SMS
 *   copy) to the provider's send API.
 * - Respect opt-out / STOP handling and regional regulations.
 * - Consider async delivery webhooks for failures and update `notify()` result
 *   semantics if you need provider message SIDs vs. delivery confirmation.
 */
export class NotImplementedError extends Error {
  public readonly name = 'NotImplementedError';

  public constructor(message: string) {
    super(message);
  }
}

export type SmsSendInput = {
  toPhone: string;
  body: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/require-await
export const sendSms = async (_input: SmsSendInput): Promise<{ id: string }> => {
  throw new NotImplementedError(
    'SMS channel is not yet implemented. See channels/sms.ts for integration notes (e.g. Twilio).',
  );
};
