import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { config } from '../config';

const httpLink = new HttpLink({
  uri: `${config.apiBaseUrl}/graphql`,
  credentials: 'include',
});

// using cookies now so don't need authLink
// const authLink = new SetContextLink((prevContext) => {
//   const token = localStorage.getItem('authToken');

//   return {
//     headers: {
//       ...prevContext.headers,
//       authorization: token ? `Bearer ${token}` : '',
//     },
//   };
// });

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
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
        keyFields: ['id'],
      },
    },
  }),
});
