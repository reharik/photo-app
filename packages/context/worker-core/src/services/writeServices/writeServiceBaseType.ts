import { RequestScopeLifeCycle } from '../readServices/readServiceBaseType';

export interface WriteServiceBase extends RequestScopeLifeCycle {
  readonly __writeServiceBrand?: true;
}
