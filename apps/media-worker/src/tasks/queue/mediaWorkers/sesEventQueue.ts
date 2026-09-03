import {
  DeleteMessageBatchCommand,
  DeleteMessageBatchRequestEntry,
  Message,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { Logger } from '@packages/infrastructure';
import { Config } from '../../../config';

export type IncomingSESMessage = {
  originalMessage: Message;
  sqsMessageId: string;
  receiptHandle: string;
  body: string;
};

export interface SesEventQueue {
  receiveMessages: () => Promise<IncomingSESMessage[]>;
  deleteMessages: (handles: DeleteMessageBatchRequestEntry[]) => Promise<void>;
}

export type SesEventQueueDeps = {
  config: Config;
  logger: Logger;
};
export const build__SesEventQueue = ({ config }: SesEventQueueDeps): SesEventQueue => {
  const {
    awsRegion,
    sesEventQueueUrl,
    sesEventQueueMaxNumberOfMessages = 10,
    sesEventQueueWaitTimeSeconds = 0,
    sesEventQueueVisibilityTimeout = 60,
  } = config;
  const sqs = new SQSClient({ region: awsRegion });

  return {
    receiveMessages: async () => {
      const result = await sqs.send(
        new ReceiveMessageCommand({
          QueueUrl: sesEventQueueUrl,
          MaxNumberOfMessages: sesEventQueueMaxNumberOfMessages,
          WaitTimeSeconds: sesEventQueueWaitTimeSeconds,
          VisibilityTimeout: sesEventQueueVisibilityTimeout,
        }),
      );
      return (result.Messages ?? [])
        .filter((m) => m.ReceiptHandle && m.Body)
        .map((m) => ({
          sqsMessageId: m.MessageId!,
          receiptHandle: m.ReceiptHandle!,
          body: m.Body!,
          originalMessage: m,
        }));
    },
    deleteMessages: async (handles: DeleteMessageBatchRequestEntry[]) => {
      await sqs.send(
        new DeleteMessageBatchCommand({ Entries: handles, QueueUrl: sesEventQueueUrl }),
      );
    },
  };
};
