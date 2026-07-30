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

const can = (role: Operation[]) => (operation: Operation) => {
  return role.includes(operation);
};
const input = {
  owner: {
    operations: ownerOperations,
    can: can(ownerOperations),
  },
  admin: {
    operations: adminOperations,
    can: can(adminOperations),
  },
  contributor: {
    operations: contributorOperations,
    can: can(contributorOperations),
  },
} as const;

export type AlbumMemberRole = Enumeration<typeof AlbumMemberRole>;
export const AlbumMemberRole = enumeration<typeof input>('AlbumMemberRole', {
  input,
});
