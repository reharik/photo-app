import { setupGraphqlIntegrationTests } from './graphqlIntegrationTestSetup.js';
import { resetIntegrationTestDb } from './resetDb.js';

const createAlbumMutation = `
  mutation CreateAlbumForTest($title: String!) {
    createAlbum(input: { title: $title }) {
      data { albumId }
      errors { code message }
    }
  }
`;

describe('UowLifetimeVerification', () => {
  describe('When two createAlbum mutations run sequentially', () => {
    it('should use one uow id per mutation and persist album rows', async () => {
      const uowLogs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: unknown[]) => {
        const line = args.map(String).join(' ');
        if (line.includes('UOW-ID')) uowLogs.push(line);
        originalLog(...args);
      };

      try {
        const setup = await setupGraphqlIntegrationTests();
        const database = setup.container.resolve('database');
        await resetIntegrationTestDb(database, undefined, () =>
          setup.integrationTestMediaStorage.clear(),
        );

        const context = { isLoggedIn: true as const };
        const titles = ['UowVerify Album 1', 'UowVerify Album 2'];
        const mutationUowIds: string[][] = [];

        for (const title of titles) {
          uowLogs.length = 0;
          originalLog(`\n=== createAlbum mutation: ${title} ===`);
          const { json } = await setup.executeGraphQL({
            query: createAlbumMutation,
            variables: { title },
            context,
          });
          mutationUowIds.push([...uowLogs]);
          originalLog('UOW-ID lines this mutation:', uowLogs.length ? uowLogs : ['(none)']);

          expect(json.errors).toBeUndefined();
          expect(json.data?.createAlbum?.errors).toEqual([]);
          const albumId = json.data?.createAlbum?.data?.albumId as string;
          expect(albumId).toBeTruthy();
          const album = await database('album').where({ id: albumId }).first();
          expect(album).toBeTruthy();
        }

        originalLog('\n=== ID sequence summary ===');
        mutationUowIds.forEach((lines, i) => {
          originalLog(`mutation ${i + 1}:`, lines);
        });

        expect(mutationUowIds[0].length).toBeGreaterThan(0);
        expect(mutationUowIds[1].length).toBeGreaterThan(0);
        const id1 = mutationUowIds[0][0]?.replace('UOW-ID persist: ', '');
        const id2 = mutationUowIds[1][0]?.replace('UOW-ID persist: ', '');
        expect(id1).not.toEqual(id2);
        expect(new Set(mutationUowIds[0]).size).toBe(1);
        expect(new Set(mutationUowIds[1]).size).toBe(1);
      } finally {
        console.log = originalLog;
      }
    });
  });
});
