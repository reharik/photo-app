import type { Config } from '../config';
import type { YogaApp } from '../graphql/server/createGraphQLServer';
import { createMockGraphQLContext } from './createMockGraphQLContext';

const graphqlHttpUrl = (config: Config): string =>
  new URL(config.graphqlHttpPath, config.serverUrl).href;

interface GraphQLError {
  message: string;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
}

// Using any for test helper flexibility - tests will add their own type assertions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: GraphQLError[];
}

interface ExecuteGraphQLDeps {
  yogaApp: YogaApp;
  config: Config;
}

// Using any for test helper flexibility - tests will add their own type assertions
export const createExecuteGraphQL = ({ yogaApp, config }: ExecuteGraphQLDeps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async <T = any>({
    query,
    variables,
    context,
    headers,
  }: {
    query: string;
    variables?: Record<string, unknown>;
    context?: Record<string, unknown>;
    /**
     * Extra request headers. Public-link tests need `X-Access-Mode: public` — the
     * context factory keys off it to enter public mode (see createGraphQLContext).
     */
    headers?: Record<string, string>;
  }): Promise<{ response: Response; json: GraphQLResponse<T> }> => {
    const response = await yogaApp.fetch(
      graphqlHttpUrl(config),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      },
      createMockGraphQLContext(context),
    );

    const json = (await response.json()) as GraphQLResponse<T>;

    return { response, json };
  };
};
