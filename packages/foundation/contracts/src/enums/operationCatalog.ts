import { enumeration, type Enumeration } from '@reharik/smart-enum';
import { Operation } from './operation';
import { SubjectType } from './subjectType';

const input = {
  [SubjectType.album.key]: {
    availableOperations: [
      Operation.addItems,
      Operation.editCover,
      Operation.deleteAlbum,
      Operation.grantAlbumAuthorization,
    ],
  },
  [SubjectType.albumItem.key]: { availableOperations: [Operation.removeItems] },
  [SubjectType.mediaItem.key]: {
    availableOperations: [
      Operation.download,
      Operation.comment,
      Operation.grantMediaItemAlbumAuthorization,
    ],
  },
} as const;

export type OperationCatalog = Enumeration<typeof OperationCatalog>;
export const OperationCatalog = enumeration<typeof input>('OperationCatalog', {
  input,
});
