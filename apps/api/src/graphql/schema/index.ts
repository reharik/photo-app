import { loadFiles } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { enumRegistry } from '@packages/contracts';
import { patchSchemaEnumSerializers } from '@reharik/smart-enum/graphql';
import { resolvers } from '../resolvers';

const typeDefs = mergeTypeDefs(
  await loadFiles(new URL('./**/*.graphql', import.meta.url).pathname, {
    ignoreIndex: true,
  }),
);

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

void patchSchemaEnumSerializers(schema, enumRegistry);
