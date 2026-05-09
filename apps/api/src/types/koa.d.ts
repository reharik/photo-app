import type { User } from '@packages/contracts';
import type { Knex } from 'knex';
import 'koa';
import type { Context } from 'koa';

declare module 'koa' {
  interface DefaultState {
    user?: User;
    isLoggedIn?: boolean;
    publicAccessId?: string;
  }

  interface DefaultContext {
    db: Knex;
    user?: User;
    isLoggedIn: boolean;
    publicAccessId?: string;
  }
}

export type TypedContext<T extends Record<string, string>> = Omit<Context, 'params'> & {
  params: T;
};
