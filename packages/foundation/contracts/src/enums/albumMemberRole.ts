import { enumeration, type Enumeration } from '@reharik/smart-enum';
import { defineAlbumMemberRoleInput } from './graphqlSmartEnums';
import { Operation } from './operation';

const ownerOperations: Operation[] = [
  Operation.addItems,
  Operation.removeItems,
  Operation.deleteAlbum,
  Operation.grantAlbumAuthorization,
  Operation.editCover,
  Operation.addMembers,
  Operation.removeMembers,
  Operation.comment,
] as const;
const adminOperations: Operation[] = [
  Operation.addItems,
  Operation.removeItems,
  Operation.grantAlbumAuthorization,
  Operation.editCover,
  Operation.addMembers,
  Operation.removeMembers,
  Operation.comment,
] as const;
const contributorOperations: Operation[] = [Operation.addItems, Operation.comment] as const;

const can = (role: Operation[]) => (operation: Operation) => {
  return role.includes(operation);
};
const input = defineAlbumMemberRoleInput({
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
});

export type AlbumMemberRole = Enumeration<typeof AlbumMemberRole>;
export const AlbumMemberRole = enumeration<typeof input>('AlbumMemberRole', {
  input,
});
