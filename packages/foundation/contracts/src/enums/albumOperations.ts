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
  share: {
    deniedError: ContractError.MemberNotAllowedToShareAlbum,
  },
  download: {
    deniedError: ContractError.MemberNotAllowedToDownloadItems,
  },
} as const;

export type AlbumOperation = Enumeration<typeof AlbumOperation>;
export const AlbumOperation = enumeration<typeof input>('AlbumOperation', {
  input,
});
