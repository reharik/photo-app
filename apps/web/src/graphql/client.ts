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

const httpLink = new HttpLink({
  uri: `${config.apiBaseUrl}/graphql`,
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
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return existing;
              }
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
