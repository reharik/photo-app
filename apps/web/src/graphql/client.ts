import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { withScalars } from 'apollo-link-scalars';
import { buildSchema } from 'graphql';
import { DateTime } from 'luxon';
import { config } from '../config';
import { smartEnumTypePolicies } from './generated/graphql-smart-enum-type-policies';
import sdl from './generated/schema.graphql?raw';

// Build a runtime GraphQLSchema instance from the SDL.
const schema = buildSchema(sdl);

const scalarLink = withScalars({
  schema,
  typesMap: {
    DateTime: {
      serialize: (parsed) => (DateTime.isDateTime(parsed) ? parsed.toISO() : null),
      parseValue: (raw) => (typeof raw === 'string' ? DateTime.fromISO(raw) : null),
    },
  },
});

const httpLink = new HttpLink({
  uri: `${config.apiBaseUrl}/graphql`,
  credentials: 'include',
});
console.log('sdl type:', typeof sdl);
console.log('sdl first 200 chars:', typeof sdl === 'string' ? sdl.slice(0, 200) : sdl);
export const apolloClient = new ApolloClient({
  link: ApolloLink.from([scalarLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      ...smartEnumTypePolicies,
      Query: {
        fields: {
          viewer: { merge: true },
        },
      },
      Viewer: {
        keyFields: ['id'],
        fields: {
          /**
           * List queries load MediaItem entities via `mediaItems` / album items, but the detail
           * query reads `mediaItem(id:)`. Without this, those are separate cache paths and Apollo
           * always misses on first open even when `MediaItem:id` is already normalized.
           */
          mediaItem: {
            read(existing, { args, toReference }) {
              const id =
                args != null &&
                typeof args === 'object' &&
                'id' in args &&
                typeof (args as { id: unknown }).id === 'string'
                  ? (args as { id: string }).id
                  : '';
              if (id.length === 0) {
                return existing;
              }
              return existing ?? toReference({ __typename: 'MediaItem', id });
            },
          },
        },
      },
      MediaItem: {
        ...smartEnumTypePolicies.MediaItem,
        keyFields: ['id'],
      },
    },
  }),
});
