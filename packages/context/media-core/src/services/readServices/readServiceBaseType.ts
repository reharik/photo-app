import { RequestScopeLifeCycle } from '@packages/infrastructure';

export interface ReadServiceBase extends RequestScopeLifeCycle {
  readonly __readServiceBrand?: true;
}

export interface PublicReadServiceBase extends RequestScopeLifeCycle {
  readonly __publicReadServiceBrand?: true;
}

export interface AgnosticReadServiceBase extends RequestScopeLifeCycle {
  readonly __agnosticReadServiceBrand?: true;
}
