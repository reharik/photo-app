import { enumeration, type Enumeration } from '@reharik/smart-enum';
import { ContractError } from './ContractError';
import { SubjectType } from './subjectType';

const input = {
  editDetails: {
    deniedError: ContractError.MemberNotAllowedToEditAlbum,
    subjectType: SubjectType.mediaItem,
  },
  addItems: {
    deniedError: ContractError.MemberNotAllowedToAddItems,
    subjectType: SubjectType.album,
  },
  removeItems: {
    deniedError: ContractError.MemberNotAllowedToRemoveItems,
    subjectType: SubjectType.albumItem,
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
} as const;

export type Operation = Enumeration<typeof Operation>;
export const Operation = enumeration<typeof input>('Operation', {
  input,
});
