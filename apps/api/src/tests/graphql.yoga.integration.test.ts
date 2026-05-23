import { jest } from '@jest/globals';
import type { AwilixContainer } from 'awilix';

import type { AppCradle } from '../di/generated/ioc-composed.js';
import { createExecuteGraphQL } from './executeGQL';
import { setupGraphqlIntegrationTests } from './graphqlIntegrationTestSetup';
import type { IntegrationTestMediaStorage } from './integrationTestMediaStorage';
import { resetIntegrationTestDb } from './resetDb';
import { TEST_VIEWER_1_ID } from './testViewerIds';

/** Masked generic errors vs explicit auth errors (resolver / gateway behavior may differ). */
const authRequiredMutationErrorMessages = ['Unexpected error.', 'Not authenticated'];

const expectGraphQLMutationRejectedForAuth = (
  json: { data?: unknown; errors?: Array<{ message?: string }> },
  fieldName: 'createMediaUpload' | 'finalizeMediaUpload',
): void => {
  expect(
    json.errors?.some((e) => authRequiredMutationErrorMessages.some((m) => m === e.message)),
  ).toBe(true);

  if (json.data === null || json.data === undefined) {
    return;
  }
  expect(json.data).toEqual(
    expect.objectContaining({
      [fieldName]: null,
    }),
  );
};

describe('GraphQL', () => {
  let executeGraphQL: ReturnType<typeof createExecuteGraphQL>;
  let container: AwilixContainer<AppCradle>;
  let integrationTestMediaStorage: IntegrationTestMediaStorage;

  beforeAll(async () => {
    const setup = await setupGraphqlIntegrationTests();
    container = setup.container;
    executeGraphQL = setup.executeGraphQL;
    integrationTestMediaStorage = setup.integrationTestMediaStorage;
  });

  afterEach(async () => {
    await resetIntegrationTestDb(container.resolve('database'), undefined, () =>
      integrationTestMediaStorage.clear(),
    );
  });

  describe('viewer', () => {
    describe('when executing the viewer query while logged out', () => {
      it('should return null for viewer', async () => {
        const { response, json } = await executeGraphQL({
          query: `
            query {
              viewer {
                id
                displayName
              }
            }
          `,
          context: {
            isLoggedIn: false,
          },
        });
        expect(response.status).toBe(200);
        expect(json.errors).toBeUndefined();
        expect(json.data).toEqual({
          viewer: null,
        });
      });
    });

    describe('when executing the viewer query while logged in', () => {
      it('should return the current user', async () => {
        const { response, json } = await executeGraphQL({
          query: `
            query {
              viewer {
                id
                displayName
              }
            }
          `,
          context: {
            isLoggedIn: true,
          },
        });

        expect(response.status).toBe(200);
        expect(json.errors).toBeUndefined();
        expect(json.data?.viewer).toBeTruthy();
        expect(json.data?.viewer?.id).toBe(TEST_VIEWER_1_ID);
        expect(json.data?.viewer?.displayName).toBe('Demo User');
      });
    });
  });

  describe('createMediaUpload mutation', () => {
    describe('when executing while logged out', () => {
      it('should return an authentication error', async () => {
        /** Yoga logs resolver throws to console.error; we expect auth failure — keep output readable. */
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        try {
          const { response, json } = await executeGraphQL({
            query: `
            mutation {
              createMediaUpload(
                input: { kind: PHOTO, mimeType: "image/jpeg" }
              ) {
                data {
                  mediaItemId
                  status
                  uploadInstructions {
                    method
                    url
                  }
                }
                errors {
                  code
                  message
                }
              }
            }
          `,
            context: {
              isLoggedIn: false,
            },
          });
          expect(response.status).toBe(200);
          expectGraphQLMutationRejectedForAuth(json, 'createMediaUpload');
        } finally {
          consoleErrorSpy.mockRestore();
        }
      });
    });
  });

  describe('finalizeMediaUpload mutation', () => {
    describe('when executing while logged out', () => {
      it('should return an authentication error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        try {
          const { response, json } = await executeGraphQL({
            query: `
            mutation {
              finalizeMediaUpload(input: { mediaItemId: "media-1" }) {
                data {
                  mediaItemId
                  status
                  kind
                  size
                }
                errors {
                  code
                  message
                }
              }
            }
          `,
            context: {
              isLoggedIn: false,
            },
          });

          expect(response.status).toBe(200);
          expectGraphQLMutationRejectedForAuth(json, 'finalizeMediaUpload');
        } finally {
          consoleErrorSpy.mockRestore();
        }
      });
    });
  });
});
