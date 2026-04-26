import { enumeration, type Enumeration } from '@reharik/smart-enum';
import { AlbumOperation } from './albumOperations';

const ownerOperations: AlbumOperation[] = [
  AlbumOperation.addItems,
  AlbumOperation.removeItems,
  AlbumOperation.deleteAlbum,
  AlbumOperation.share,
  AlbumOperation.download,
] as const;
const adminOperations: AlbumOperation[] = [
  AlbumOperation.addItems,
  AlbumOperation.removeItems,
  AlbumOperation.share,
  AlbumOperation.download,
] as const;
const contributorOperations: AlbumOperation[] = [
  AlbumOperation.addItems,
  AlbumOperation.download,
] as const;

const input = {
  owner: {
    operations: ownerOperations,
    can: (operation: AlbumOperation) => {
      return ownerOperations.includes(operation);
    },
  },
  admin: {
    operations: adminOperations,
    can: (operation: AlbumOperation) => {
      return adminOperations.includes(operation);
    },
  },
  contributor: {
    operations: contributorOperations,
    can: (operation: AlbumOperation) => {
      return contributorOperations.includes(operation);
    },
  },
} as const;

export type AlbumMemberRole = Enumeration<typeof AlbumMemberRole>;
export const AlbumMemberRole = enumeration<typeof input>('AlbumMemberRole', {
  input,
});
