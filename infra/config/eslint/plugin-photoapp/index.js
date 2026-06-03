import { noSmartEnumReferenceEquality } from './rules/no-smart-enum-reference-equality.js';

/** Local ESLint plugin for photoapp monorepo policies. */
export const photoappPlugin = {
  meta: {
    name: '@photoapp/eslint-plugin',
    version: '1.0.0',
  },
  rules: {
    'no-smart-enum-reference-equality': noSmartEnumReferenceEquality,
  },
};
