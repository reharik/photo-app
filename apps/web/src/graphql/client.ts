import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { enumRegistry } from '@packages/contracts';
import { patchSchemaEnumSerializers } from '@reharik/smart-enum/graphql';
import { withScalars } from 'apollo-link-scalars';
import { buildSchema } from 'graphql';
import { DateTime } from 'luxon';
import { config } from '../config';
import { smartEnumTypePolicies } from './generated/graphql-smart-enum-type-policies';
import sdl from './generated/schema.graphql?raw';
import { mergeTypePolicies } from './mergeTypePolicies';
import { nestedPagePagination } from './nestedPagePagination';

// Build a runtime GraphQLSchema instance from the SDL.
const schema = buildSchema(sdl);
patchSchemaEnumSerializers(schema, enumRegistry);

const scalarLink = withScalars({
  schema,
  typesMap: {
    DateTime: {
      serialize: (parsed) => (DateTime.isDateTime(parsed) ? parsed.toISO() : null),
      parseValue: (raw) => (typeof raw === 'string' ? DateTime.fromISO(raw) : null),
    },
  },
});

const apiBase = config.apiBaseUrl.endsWith('/')
  ? config.apiBaseUrl.slice(0, -1)
  : config.apiBaseUrl;

const httpLink = new HttpLink({
  uri: `${apiBase}/graphql`,
  credentials: 'include',
});

type AccessMode = 'public' | 'authenticated';
const accessModeLink = new SetContextLink((prevContext) => {
  const headers = (prevContext.headers as Record<string, string> | undefined) ?? {};
  const accessMode = prevContext.accessMode as AccessMode | undefined;

  return {
    headers: {
      ...headers,
      ...(accessMode === 'public' ? { 'X-Access-Mode': 'public' } : {}),
    },
  };
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([scalarLink, accessModeLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: mergeTypePolicies(
      // Generated read policies that rehydrate enum string values into smart-enum
      // instances. Applied at the root so any type with smart-enum fields is covered
      // regardless of whether it has its own hand-written policy below.
      smartEnumTypePolicies,
      {
        Query: {
          fields: {
            // viewer is the root of many subselections; merge so different queries
            // compose into a single cached Viewer rather than overwriting one another.
            viewer: { merge: true },
          },
        },

        Viewer: {
          // Normalize Viewer by id so cache lookups by user id work consistently.
          // If you want viewer-as-singleton semantics instead, switch to `false`.
          keyFields: ['id'],
          fields: {
            // TODO: pass keyArgs reflecting any sort/filter args once those are
            // exposed on these fields; without that, switching sort order will
            // append rather than replace.
            albums: nestedPagePagination(),
            mediaItems: nestedPagePagination(),
            sharedWithMeMediaItems: nestedPagePagination(),
            sharedWithMeAlbums: nestedPagePagination(),

            // Viewer-level unseen-activity array — every dot/bold on every screen
            // derives from this one field client-side. It's fetched (and refetched
            // after clears) wholesale, so the incoming list always replaces the
            // cached one rather than merging: `merge: false`.
            unseenActivity: { merge: false },

            // List queries normalize MediaItem entities into the cache, but the
            // detail field `mediaItem(id:)` has its own per-args result slot.
            // Without this read, opening a detail view always misses on first
            // open even when MediaItem:id is already normalized. The read returns
            // a reference to the normalized entity, which Apollo resolves
            // transparently. Note: only avoids a network fetch when the detail
            // query's selection set is a subset of what the list query loaded.
            mediaItem: {
              read(existing, { args, toReference }) {
                const id = (args as { id?: string } | null)?.id;
                // trust these codegen types
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                if (!id) return existing;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return existing ?? toReference({ __typename: 'MediaItem', id });
              },
            },
          },
        },
        Album: {
          keyFields: ['id'],
          fields: {
            items: nestedPagePagination(
              (args) =>
                `s:${args?.input?.collectionInfo?.sortBy}:${args?.input?.collectionInfo?.sortDir}`,
            ),
            // and comments if applicable
          },
        },
        PublicAlbum: {
          keyFields: ['id'],
          fields: {
            items: nestedPagePagination(
              (args) =>
                `s:${args?.input?.collectionInfo?.sortBy}:${args?.input?.collectionInfo?.sortDir}`,
            ),
            comments: nestedPagePagination(),
          },
        },

        MediaItem: {
          fields: {
            comments: nestedPagePagination(),
          },
        },
      },
    ),
  }),
});
