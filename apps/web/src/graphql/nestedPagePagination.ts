/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { FieldPolicy } from '@apollo/client';

export const nestedPagePagination = (keyArgs: FieldPolicy['keyArgs'] = false): FieldPolicy => ({
  keyArgs,
  merge(existing, incoming, { args }) {
    const offset = args?.input?.collectionInfo?.pageInfo?.offset ?? 0;
    const existingItems = existing?.nodes ?? [];
    const incomingItems = incoming?.nodes ?? [];

    const merged = offset === 0 ? incomingItems : [...existingItems, ...incomingItems];

    return { ...incoming, nodes: merged };
  },
});
