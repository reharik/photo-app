import type { Resolvers } from '../../generated/types.generated';

const sharedWithMeResolvers: Resolvers = {
  SharedWithMeMediaItemType: {
    id: (parent) => parent.id,
    sharedAt: (parent) => parent.sharedAt,
    sharedBy: (parent) => parent.sharedBy,
    mediaItem: (parent) => parent.mediaItem,
  },
  SharedWithMeMediaAlbumType: {
    id: (parent) => parent.id,
    sharedAt: (parent) => parent.sharedAt,
    sharedBy: (parent) => parent.sharedBy,
    album: (parent) => parent.album,
  },
};

export default sharedWithMeResolvers;
