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

  // `config.sesEventQueueUrl` defaults to '' (SES_EVENT_QUEUE_URL unset) — that
  // means "no queue wired up", not "a queue that rejects every call". Polling an
  // empty QueueUrl throws QueueDoesNotExist on every pass, and because this task
  // is the LAST queue task (order 10000), it is reached exactly when the media
  // queues go idle — the same condition that lets the loop run its sweeps. The
  // throw propagates out of runWorkerTasksOnce and skips the sweep segment, so an
  // unconfigured queue silently starves every scheduled task. Answer idle instead.
  if (!sesEventQueueUrl) {
    return {
      receiveMessages: async () => [],
      deleteMessages: async () => {},
    };
  }

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
