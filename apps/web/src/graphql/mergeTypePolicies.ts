import type { TypePolicies } from '@apollo/client';

export const mergeTypePolicies = (...sources: TypePolicies[]): TypePolicies => {
  const result: TypePolicies = {};

  for (const source of sources) {
    for (const [typeName, policy] of Object.entries(source)) {
      const existing = result[typeName];
      result[typeName] = existing
        ? {
            ...existing,
            ...policy,
            fields: { ...(existing.fields ?? {}), ...(policy.fields ?? {}) },
          }
        : policy;
    }
  }

  return result;
};
