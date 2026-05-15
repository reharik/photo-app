import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
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
const reactionEmoji = schema.getType('ReactionEmoji');
if (reactionEmoji) {
  console.log(
    '[debug] ReactionEmoji values:',
    (reactionEmoji as any).getValues().map((v: any) => ({ name: v.name, value: v.value })),
  );
  try {
    console.log('[debug] serialize HEART:', (reactionEmoji as any).serialize('HEART'));
  } catch (e) {
    console.log('[debug] serialize HEART threw:', e);
  }
  try {
    // Simulate what apollo-link-scalars might be passing
    const fake = { __smart_enum_type: 'ReactionEmoji', value: 'HEART', key: 'heart' };
    console.log('[debug] serialize smart-enum-like:', (reactionEmoji as any).serialize(fake));
  } catch (e) {
    console.log('[debug] serialize smart-enum-like threw:', e);
  }
}
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
