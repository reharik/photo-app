// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PublicMediaItemReadService {
  /* no-op*/
}
// import { MediaStorage } from '../../../application/media/MediaStorage';
// import { PublicMediaItemReadRepository } from '../../../repositories/readRepositories/PublicMediaItemReadRepository';
// import { EntityId } from '../../../types/types';
// import { ReadServiceFactoryBase } from '../readServiceBaseType';
// import {
//   PublicMediaItemCollectionInfo,
//   PublicMediaItemListProjection,
//   PublicMediaItemProjection,
//   PublicMediaItemRow,
// } from './publicMediaItemReadService.types';

// export interface MediaItemReadService {
//   listMediaItems: (
//     collectionInfo: PublicMediaItemCollectionInfo,
//   ) => Promise<PublicMediaItemListProjection>;
//   getPublicMediaItemForViewer: (args: {
//     PublicMediaItemId: EntityId;
//   }) => Promise<PublicMediaItemProjection | undefined>;
// }

// export interface PublicMediaItemReadServiceFactory extends ReadServiceFactoryBase {
//   (args: { viewerId: string }): PublicMediaItemReadService;
// }

// type PublicMediaItemReadServiceFactoryDeps = {
//   PublicMediaItemReadRepository: PublicMediaItemReadRepository;
//   mediaStorage: MediaStorage;
// };

// export const build__PublicMediaItemReadServiceFactory = ({
//   publicMediaItemReadRepository,
// }: PublicMediaItemReadServiceFactoryDeps): PublicMediaItemReadServiceFactory => {
//   return ({ viewerId }: { viewerId: string }) => {
//     const withTags = async (rows: PublicMediaItemRow[]): Promise<PublicMediaItemProjection[]> => {
//       const ids = rows.map((r) => r.id);
//       const tagMap = await publicMediaItemReadRepository.listTagsForPublicMediaItemIds({
//         viewerId,
//         PublicmediaItemIds: ids,
//       });
//       return rows.map((r) => ({ ...r, tags: tagMap.get(r.id) ?? [] }));
//     };

//     return {
//       listPublicMediaItems: async (
//         collectionInfo: PublicMediaItemCollectionInfo,
//       ): Promise<PublicMediaItemListProjection> => {
//         const publicmediaItems = await publicMediaItemReadRepository.listForViewer({
//           viewerId,
//           collectionInfo,
//         });
//         const nodes = await withTags(publicmediaItems);
//         return {
//           nodes,
//           pageInfo: collectionInfo.pageInfo,
//         };
//       },
//       getPublicMediaItemForViewer: async ({
//         publicmediaItemId,
//       }: {
//         publicmediaItemId: EntityId;
//       }): Promise<PublicMediaItemProjection | undefined> => {
//         const row = await publicMediaItemReadRepository.getForViewer({
//           publicmediaItemId,
//           viewerId,
//         });
//         if (!row) {
//           return undefined;
//         }
//         const [projection] = await withTags([row]);
//         return projection;
//       },
//     };
//   };
// };
