import { enumeration, type Enumeration } from '@reharik/smart-enum';
import { ContractError } from './ContractError';
import { defineOperationInput } from './graphqlSmartEnums';
import { SubjectType } from './subjectType';

const input = defineOperationInput({
  editDetails: {
    deniedError: ContractError.MemberNotAllowedToEditAlbum,
    subjectType: SubjectType.album,
  },
  addItems: {
    deniedError: ContractError.MemberNotAllowedToAddItems,
    subjectType: SubjectType.album,
  },
  removeItems: {
    deniedError: ContractError.CanOnlyRemoveOwnedItemsOrItemsInAnAlbumYouManage,
    subjectType: SubjectType.albumItem,
  },
  addMembers: {
    deniedError: ContractError.MemberNotAllowedToAddNewMembers,
    subjectType: SubjectType.album,
  },
  removeMembers: {
    deniedError: ContractError.MemberNotAllowedToRemoveMembers,
    subjectType: SubjectType.album,
  },
  editCover: {
    deniedError: ContractError.AlbumEditCoverForbidden,
    subjectType: SubjectType.album,
  },
  deleteAlbum: {
    deniedError: ContractError.MemberNotAllowedToDeleteAlbum,
    subjectType: SubjectType.album,
  },
  grantAlbumAuthorization: {
    deniedError: ContractError.NotAllowedToGrantAuthorizationForAlbum,
    subjectType: SubjectType.album,
  },
  grantMediaItemAlbumAuthorization: {
    deniedError: ContractError.NotAllowedToGrantAuthorizationForMediaItem,
    subjectType: SubjectType.mediaItem,
  },
  download: {
    deniedError: ContractError.MemberNotAllowedToDownloadItems,
    subjectType: SubjectType.mediaItem,
  },
  comment: {
    deniedError: ContractError.MemberNotAllowedToComment,
    subjectType: SubjectType.mediaItem,
  },
  deleteMediaItem: {
    deniedError: ContractError.NotAllowedToDeleteMediaItem,
    subjectType: SubjectType.mediaItem,
  },
  editMediaItem: {
    deniedError: ContractError.NotAllowedToEditMediaItem,
    subjectType: SubjectType.mediaItem,
  },
});

export type Operation = Enumeration<typeof Operation>;
export const Operation = enumeration<typeof input>('Operation', {
  input,
});
