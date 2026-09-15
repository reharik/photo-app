import { EntityId } from '@packages/contracts';

export type LogContext = {
  requestId: string;
  accessMode?: 'authRead' | 'authWrite' | 'public';
  operationName?: string;
  operationType?: 'query' | 'mutation' | 'subscription' | undefined;
  service: 'api' | 'worker';
  viewerId?: EntityId;
  publicLinkId?: string;
};
