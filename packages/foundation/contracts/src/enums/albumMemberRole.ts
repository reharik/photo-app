import { enumeration, type Enumeration } from '@reharik/smart-enum';
import { ViewerOperation } from './viewerOperations';

const ownerOperations: ViewerOperation[] = [
  ViewerOperation.addItems,
  ViewerOperation.removeItems,
  ViewerOperation.deleteAlbum,
  ViewerOperation.share,
  ViewerOperation.download,
  ViewerOperation.editCover,
] as const;
const adminOperations: ViewerOperation[] = [
  ViewerOperation.addItems,
  ViewerOperation.removeItems,
  ViewerOperation.share,
  ViewerOperation.download,
  ViewerOperation.editCover,
] as const;
const contributorOperations: ViewerOperation[] = [
  ViewerOperation.addItems,
  ViewerOperation.download,
] as const;

const input = {
  owner: {
    operations: ownerOperations,
    can: (operation: ViewerOperation) => {
      return ownerOperations.includes(operation);
    },
  },
  admin: {
    operations: adminOperations,
    can: (operation: ViewerOperation) => {
      return adminOperations.includes(operation);
    },
  },
  contributor: {
    operations: contributorOperations,
    can: (operation: ViewerOperation) => {
      return contributorOperations.includes(operation);
    },
  },
} as const;

export type AlbumMemberRole = Enumeration<typeof AlbumMemberRole>;
export const AlbumMemberRole = enumeration<typeof input>('AlbumMemberRole', {
  input,
});
