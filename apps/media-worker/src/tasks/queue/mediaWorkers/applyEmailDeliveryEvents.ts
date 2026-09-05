import { EmailStatus, SYSTEM_ACTOR_ID } from '@packages/contracts';
import { indexBy, Logger } from '@packages/infrastructure';
import { EmailDeliveryRepository, UnitOfWork } from '@packages/media-core';
import { camelCase } from 'case-anything';
import { WorkerTaskOutcome } from '../../../types';
import { IncomingSESMessage, SesEventQueue } from './sesEventQueue';
import { WorkerJobProcessorBase } from './workerJobProcessorBaseType';

type SESEventBody = { status: EmailStatus; sesMessageId: string };

type ProcessingSESEventMessage = {
  body?: SESEventBody;
  rawBody: string;
  parsed?: unknown;
  sqsMessageId: string;
  receiptHandle: string;
};

export type IncomingSesEventBody = {
  eventType: 'Send' | 'Delivery' | 'Bounce' | 'Complaint' | 'Reject';
  mail: { messageId: string };
  bounce?: { bounceType: 'Permanent' | 'Transient' | 'Undetermined' };
};

export interface ApplyEmailDeliveryEvents extends WorkerJobProcessorBase {
  (): Promise<WorkerTaskOutcome>;
}

type ApplyEmailDeliveryEventsDeps = {
  sesEventQueue: SesEventQueue;
  emailDeliveryRepository: EmailDeliveryRepository;
  uow: UnitOfWork;
  logger: Logger;
};

const parseSesEvent = (m: IncomingSESMessage): ProcessingSESEventMessage => {
  let parsed: unknown;
  const handled: ProcessingSESEventMessage = {
    sqsMessageId: m.sqsMessageId,
    receiptHandle: m.receiptHandle,
    rawBody: m.body,
  };
  try {
    parsed = JSON.parse(m.body);
  } catch {
    return handled; // SNS validation string, or garbage
  }
  const e = parsed as IncomingSesEventBody;
  if (typeof e?.mail?.messageId !== 'string') {
    return handled; // SNS validation string, or garbage
  }
  let status = EmailStatus.tryFromKey(camelCase(e.eventType));
  if (e.eventType === 'Bounce') {
    status =
      e.bounce?.bounceType === 'Transient'
        ? EmailStatus.bounceTransient
        : EmailStatus.bouncePermanent;
  }
  if (!status) {
    return handled;
  }
  return {
    ...handled,
    parsed,
    body: {
      status,
      sesMessageId: e.mail.messageId,
    },
  };
};

export const build__ApplyEmailDeliveryEvents = ({
  sesEventQueue,
  emailDeliveryRepository,
  uow,
  logger,
}: ApplyEmailDeliveryEventsDeps): ApplyEmailDeliveryEvents => {
  return async (): Promise<WorkerTaskOutcome> => {
    const messages = await sesEventQueue.receiveMessages();
    if (messages.length === 0) {
      return 'idle';
    }
    const allMessages = messages.map(parseSesEvent);
    allMessages
      .filter((x): x is ProcessingSESEventMessage & { body: undefined } => !x.body)
      .forEach((x) => logger.debug(x.rawBody.substring(0, 100)));

    const liveMessages = allMessages.filter(
      (x): x is ProcessingSESEventMessage & { body: SESEventBody } => !!x.body,
    );
    const messageMap = indexBy(liveMessages, (x) => x.body.sesMessageId);
    try {
      await uow.join();
      const emailDeliveries = await emailDeliveryRepository.getByMessageIds(
        liveMessages.map((x) => x.body.sesMessageId),
      );

      for (const ed of emailDeliveries) {
        const message = messageMap.get(ed.sesMessageId());
        if (!message) {
          continue;
        }
        ed.updateStatus(SYSTEM_ACTOR_ID, message.body.status);
        ed.setLastEvent(SYSTEM_ACTOR_ID, message.parsed);
        await emailDeliveryRepository.save(ed);
      }
      await uow.complete(true);
    } catch (e) {
      await uow.settle(false);
      throw e;
    }

    const deleteHandles = allMessages.map((x) => ({
      Id: x.sqsMessageId,
      ReceiptHandle: x.receiptHandle,
    }));
    await sesEventQueue.deleteMessages(deleteHandles);
    return 'processed';
  };
};
