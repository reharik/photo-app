import { enumeration, type Enumeration } from '@reharik/smart-enum';
import { Operation } from './operation';

const ownerOperations: Operation[] = [
  Operation.addItems,
  Operation.removeItems,
  Operation.deleteAlbum,
  Operation.grantAlbumAuthorization,
  Operation.editCover,
] as const;
const adminOperations: Operation[] = [
  Operation.addItems,
  Operation.removeItems,
  Operation.grantAlbumAuthorization,
  Operation.editCover,
] as const;
const contributorOperations: Operation[] = [Operation.addItems] as const;

const input = {
  owner: {
    operations: ownerOperations,
    can: (operation: Operation) => {
      return ownerOperations.includes(operation);
    },
  },
  admin: {
    operations: adminOperations,
    can: (operation: Operation) => {
      return adminOperations.includes(operation);
    },
  },
  contributor: {
    operations: contributorOperations,
    can: (operation: Operation) => {
      return contributorOperations.includes(operation);
    },
  },
} as const;

export type AlbumMemberRole = Enumeration<typeof AlbumMemberRole>;
export const AlbumMemberRole = enumeration<typeof input>('AlbumMemberRole', {
  input,
});
