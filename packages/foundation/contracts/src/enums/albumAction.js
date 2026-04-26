import { enumeration } from '@reharik/smart-enum';
import { ContractError } from './ContractError';
export const AlbumAction = enumeration('AlbumAction', {
    input: {
        view: {
            deniedError: ContractError.AlbumViewForbidden,
        },
        editDetails: {
            deniedError: ContractError.MemberNotAllowedToEditAlbum,
        },
        addItem: {
            deniedError: ContractError.MemberNotAllowedToAddItem,
        },
        removeItem: {
            deniedError: ContractError.MemberNotAllowedToDeleteItem,
        },
        editCover: {
            deniedError: ContractError.AlbumEditCoverForbidden,
        },
        delete: {
            deniedError: ContractError.MemberNotAllowedToDeleteAlbum,
        },
    },
});
//# sourceMappingURL=albumAction.js.map