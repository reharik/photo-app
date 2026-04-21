import { enumeration, type Enumeration } from '@reharik/smart-enum';
import { ErrorCategory } from './graphqlSmartEnums';

const errorAreaInput = ['album', 'mediaItem', 'membership', 'viewer', 'auth'] as const;

export type ErrorArea = Enumeration<typeof ErrorArea>;
export const ErrorArea = enumeration<typeof errorAreaInput>('ErrorArea', {
  input: errorAreaInput,
});
// @blocksort asc
const contractErrorInput = {
  AddMediaToAlbumEmptyMediaList: {
    code: 'ALBUM_ADD_MEDIA_EMPTY_MEDIA_LIST',
    display: 'At least one media item is required',
    category: ErrorCategory.domain,
    area: ErrorArea.album,
    retryable: false,
  },
  AddMediaToAlbumInvalidTarget: {
    code: 'ALBUM_ADD_MEDIA_INVALID_TARGET',
    display: 'Provide either an existing album or a new album, not both and not neither',
    category: ErrorCategory.domain,
    area: ErrorArea.album,
    retryable: false,
  },
  AlbumNotFound: {
    code: 'ALBUM_NOT_FOUND',
    display: 'Album not found',
    category: ErrorCategory.domain,
    area: ErrorArea.album,
    retryable: false,
  },
  InvalidAlbumItemOrder: {
    code: 'ALBUM_INVALID_ITEM_ORDER',
    display: 'Album item order is invalid',
    category: ErrorCategory.domain,
    area: ErrorArea.album,
    retryable: false,
  },
  AlbumEditCoverForbidden: {
    code: 'ALBUM_EDIT_COVER_FORBIDDEN',
    display: 'Album edit cover forbidden',
    category: ErrorCategory.auth,
    area: ErrorArea.album,
    retryable: false,
  },
  AlbumViewForbidden: {
    code: 'ALBUM_VIEW_FORBIDDEN',
    display: 'Album view forbidden',
    category: ErrorCategory.auth,
    area: ErrorArea.album,
    retryable: false,
  },
  AssetKindAlreadyExists: {
    code: 'ASSET_KIND_ALREADY_EXISTS',
    display: 'Asset kind already exists',
    category: ErrorCategory.domain,
    area: ErrorArea.mediaItem,
    retryable: false,
  },
  AssetNotFound: {
    code: 'ASSET_NOT_FOUND',
    display: 'Asset not found',
    category: ErrorCategory.domain,
    area: ErrorArea.mediaItem,
    retryable: false,
  },
  AssetNotPending: {
    code: 'ASSET_NOT_PENDING',
    display: 'Asset is not pending',
    category: ErrorCategory.domain,
    area: ErrorArea.mediaItem,
    retryable: false,
  },
  CoverMediaNotPartOfAlbum: {
    code: 'ALBUM_COVER_MEDIA_NOT_PART_OF_ALBUM',
    display: 'Cover media not part of album',
    category: ErrorCategory.domain,
    area: ErrorArea.album,
    retryable: false,
  },

  InvalidMediaDimensions: {
    code: 'MEDIA_ITEM_INVALID_DIMENSIONS',
    display: 'Media dimensions must be positive integers',
    category: ErrorCategory.domain,
    area: ErrorArea.mediaItem,
    retryable: false,
  },
  InvalidMediaTakenAt: {
    code: 'MEDIA_ITEM_INVALID_TAKEN_AT',
    display: 'Taken at is not a valid date/time',
    category: ErrorCategory.domain,
    area: ErrorArea.mediaItem,
    retryable: false,
  },
  InvalidMediaItemTags: {
    code: 'MEDIA_ITEM_INVALID_TAGS',
    display: 'Media item tags are invalid',
    category: ErrorCategory.domain,
    area: ErrorArea.mediaItem,
    retryable: false,
  },
  MediaAlreadyInAlbum: {
    code: 'ALBUM_MEDIA_ALREADY_IN_ALBUM',
    display: 'Media already in album',
    category: ErrorCategory.domain,
    area: ErrorArea.album,
    retryable: false,
  },
  MediaBytesNotFound: {
    code: 'MEDIA_BYTES_NOT_FOUND',
    display: 'Media bytes not found',
    category: ErrorCategory.domain,
    area: ErrorArea.mediaItem,
    retryable: false,
  },
  MediaDimensionsNotAvailable: {
    code: 'MEDIA_DIMENSIONS_NOT_AVAILABLE',
    display: 'Could not read media width and height from the uploaded file',
    category: ErrorCategory.domain,
    area: ErrorArea.mediaItem,
    retryable: true,
  },
  MediaItemNotFound: {
    code: 'MEDIA_ITEM_NOT_FOUND',
    display: 'Media item not found',
    category: ErrorCategory.domain,
    area: ErrorArea.mediaItem,
    retryable: false,
  },
  MediaItemsNotFound: {
    code: 'MEDIA_ITEMS_NOT_FOUND',
    display: 'Media items not found',
    category: ErrorCategory.domain,
    area: ErrorArea.mediaItem,
    retryable: false,
  },
  MediaItemNotInAlbum: {
    code: 'MEDIA_ITEM_NOT_IN_ALBUM',
    display: 'Media item not in album',
    category: ErrorCategory.domain,
    area: ErrorArea.album,
    retryable: false,
  },
  MediaItemNotOwnedByViewer: {
    code: 'MEDIA_ITEM_NOT_OWNED_BY_VIEWER',
    display: 'Media item not owned by viewer',
    category: ErrorCategory.auth,
    area: ErrorArea.mediaItem,
    retryable: false,
  },
  MediaItemUpdateNoFieldsProvided: {
    code: 'MEDIA_ITEM_UPDATE_NO_FIELDS_PROVIDED',
    display: 'No fields provided to update',
    category: ErrorCategory.domain,
    area: ErrorArea.mediaItem,
    retryable: false,
  },
  MediaItemNotReady: {
    code: 'MEDIA_ITEM_NOT_READY',
    display: 'Media item not ready',
    category: ErrorCategory.domain,
    area: ErrorArea.mediaItem,
    retryable: false,
  },
  MemberNotAllowedToAddItem: {
    code: 'MEMBER_NOT_ALLOWED_TO_ADD_ITEM',
    display: 'Member not allowed to add item',
    category: ErrorCategory.auth,
    area: ErrorArea.album,
    retryable: false,
  },
  MemberNotAllowedToDeleteAlbum: {
    code: 'MEMBER_NOT_ALLOWED_TO_DELETE_ALBUM',
    display: 'Member not allowed to delete album',
    category: ErrorCategory.auth,
    area: ErrorArea.album,
    retryable: false,
  },
  MemberNotAllowedToDeleteItem: {
    code: 'MEMBER_NOT_ALLOWED_TO_DELETE_ITEM',
    display: 'Member not allowed to delete item',
    category: ErrorCategory.auth,
    area: ErrorArea.album,
    retryable: false,
  },
  MemberNotAllowedToEditAlbum: {
    code: 'MEMBER_NOT_ALLOWED_TO_EDIT_ALBUM',
    display: 'Member not allowed to edit album',
    category: ErrorCategory.auth,
    area: ErrorArea.album,
    retryable: false,
  },
  StatusNotPending: {
    code: 'MEDIA_ITEM_STATUS_NOT_PENDING',
    display: 'Media item status is not pending',
    category: ErrorCategory.domain,
    area: ErrorArea.mediaItem,
    retryable: false,
  },
  StatusNotUploaded: {
    code: 'MEDIA_ITEM_STATUS_NOT_UPLOADED',
    display: 'Media item is not awaiting derivative processing',
    category: ErrorCategory.domain,
    area: ErrorArea.mediaItem,
    retryable: false,
  },
  UserAlreadyMember: {
    code: 'ALBUM_USER_ALREADY_MEMBER',
    display: 'User already member',
    category: ErrorCategory.domain,
    area: ErrorArea.album,
    retryable: false,
  },
  UserCanNotCreateAlbum: {
    code: 'USER_CAN_NOT_CREATE_ALBUM',
    display: 'User can not create album',
    category: ErrorCategory.auth,
    area: ErrorArea.album,
    retryable: false,
  },
  UserIsNotMember: {
    code: 'USER_IS_NOT_MEMBER',
    display: 'User is not member',
    category: ErrorCategory.auth,
    area: ErrorArea.album,
    retryable: false,
  },
} as const;
export type ContractError = Enumeration<typeof ContractError>;
export const ContractError = enumeration<typeof contractErrorInput>('ContractError', {
  input: contractErrorInput,
});
