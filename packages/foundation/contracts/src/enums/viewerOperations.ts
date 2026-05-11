import { enumeration, type Enumeration } from '@reharik/smart-enum';
import { ContractError } from './ContractError';

const input = {
  editDetails: {
    deniedError: ContractError.MemberNotAllowedToEditAlbum,
  },
  addItems: {
    deniedError: ContractError.MemberNotAllowedToAddItems,
  },
  removeItems: {
    deniedError: ContractError.MemberNotAllowedToRemoveItems,
  },
  editCover: {
    deniedError: ContractError.AlbumEditCoverForbidden,
  },
  deleteAlbum: {
    deniedError: ContractError.MemberNotAllowedToDeleteAlbum,
  },
  grantAuthorization: {
    deniedError: ContractError.MemberNotAllowedToGrantAuthorization,
  },
  download: {
    deniedError: ContractError.MemberNotAllowedToDownloadItems,
  },
  comment: {
    deniedError: ContractError.MemberNotAllowedToComment,
  },
} as const;

export type ViewerOperation = Enumeration<typeof ViewerOperation>;
export const ViewerOperation = enumeration<typeof input>('ViewerOperation', {
  input,
});
