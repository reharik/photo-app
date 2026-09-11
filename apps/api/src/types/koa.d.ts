import type { User } from '@packages/contracts';
import type { Knex } from 'knex';
import 'koa';
import type { Context } from 'koa';
import { ApiRequestContext } from '../di/apiRequestContext';

declare module 'koa' {
  interface DefaultState {
    user?: User;
    isLoggedIn?: boolean;
    publicAccessId?: string;
    authorizedMediaPath?: string;
  }

  interface DefaultContext {
    db: Knex;
    user?: User;
    isLoggedIn: boolean;
    publicAccessId?: string;
    scope: ApiRequestContext;
  }
}

export type TypedContext<T extends Record<string, string>> = Omit<Context, 'params'> & {
  params: T;
};
