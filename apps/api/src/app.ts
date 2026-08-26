import { RegisterDomainEventHandlers } from '@packages/media-core';
import { Server } from './server';

export interface App {
  (): Promise<void>;
}

type AppDeps = {
  server: Server;
  registerDomainEventHandlers: RegisterDomainEventHandlers;
};

export const build__App =
  ({ server, registerDomainEventHandlers }: AppDeps): App =>
  async () => {
    registerDomainEventHandlers();
    await server.start();
  };
