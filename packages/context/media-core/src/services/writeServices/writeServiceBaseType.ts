import { RequestScopeLifeCycle } from '@packages/infrastructure';

export interface WriteServiceBase extends RequestScopeLifeCycle {
  readonly __writeServiceBrand?: true;
}
