import { mergeResolvers } from '@graphql-tools/merge';

/**
 * Jest (ESM / experimental VM modules): modules reached only via dynamic `import()` are not
 * “linked,” so bare specifiers in their dependency tree (e.g. `@packages/contracts` inside
 * shared helpers) may fail to resolve. Statically import shared resolver dependencies here so
 * they participate in the normal graph before we merge resolver modules.
 */
import './standardizeInput.js';

import albumMutationResolvers from './album/albumMutationResolver.js';
import albumResolvers from './album/albumResolver.js';
import mediaItemUploadResolvers from './media/mediaItemMutationsResolver.js';
import mediaItemResolvers from './media/mediaItemResolver.js';

import authorizationMutationResolvers from './authorization/authorizationMutationResolver.js';
import commentMutationResolvers from './comments/commentMutationResolver.js';
import publicAlbumResolver from './publicAlbum/publicAlbumResolver.js';
import publicLinkMutationResolvers from './publicLink/publicLinkMutationResolver.js';
import publicMediaItemResolver from './publicMediaItem/publicMediaItemResolver.js';
import reactionMutationResolvers from './reactions/reactionMutationResolver.js';
import { reactorResolvers } from './reactors/reactorResolver.js';
import publicAccessResolver from './root/publicAccessResolver.js';
import viewerMutationResolvers from './root/ViewerMutationResolver.js';
import viewerResolvers from './root/viewerResolver.js';
import sharedWithMeResolvers from './sharedWithMe/sharedWithMeResolver.js';

/**
 * Resolvers must be registered with static imports so the Vite production bundle includes them.
 * The previous fast-glob + dynamic import approach looked under `dist/` at runtime, where no
 * `*Resolver.js` files exist (everything is bundled into `index.js`), so the glob matched nothing
 * and Query fields fell through to default resolvers → nullable fields returned null.
 */
export const resolvers = mergeResolvers([
  albumMutationResolvers,
  albumResolvers,
  mediaItemUploadResolvers,
  mediaItemResolvers,
  authorizationMutationResolvers,
  commentMutationResolvers,
  reactionMutationResolvers,
  reactorResolvers,
  publicLinkMutationResolvers,
  publicAccessResolver,
  publicMediaItemResolver,
  publicAlbumResolver,
  viewerMutationResolvers,
  viewerResolvers,
  sharedWithMeResolvers,
]);
