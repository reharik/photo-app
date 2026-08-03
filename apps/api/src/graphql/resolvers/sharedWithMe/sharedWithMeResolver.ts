import type { Resolvers } from '../../generated/types.generated';

const sharedWithMeResolvers: Resolvers = {
  SharedWithMeMediaAlbumType: {
    id: (parent) => parent.id,
    sharedAt: (parent) => parent.sharedAt,
    sharedBy: (parent) => parent.sharedBy,
    album: (parent) => parent.album,
  },
};

export default sharedWithMeResolvers;
