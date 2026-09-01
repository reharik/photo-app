export interface ReadServiceBase extends RequestScopeLifeCycle {
  readonly __readServiceBrand?: true;
}

export interface PublicReadServiceBase extends RequestScopeLifeCycle {
  readonly __publicReadServiceBrand?: true;
}

export interface AgnosticReadServiceBase extends RequestScopeLifeCycle {
  readonly __agnosticReadServiceBrand?: true;
}

export interface RequestScopeLifeCycle {
  readonly __requestScopeLifeCycleBrand?: true;
}
