import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | undefined;
export type InputMaybe<T> = T | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
  [_ in K]?: never;
};
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  Date: { input: string; output: string };
  DateTime: { input: string; output: string };
};

export type AddMediaItemToAlbumInput = {
  albumId: Scalars['ID']['input'];
  mediaItemId: Scalars['ID']['input'];
};

export type AddMediaItemToAlbumPayload = {
  __typename?: 'AddMediaItemToAlbumPayload';
  albumId: Scalars['ID']['output'];
  albumItemId: Scalars['ID']['output'];
};

export type AddMediaItemToAlbumResponse = {
  __typename?: 'AddMediaItemToAlbumResponse';
  data?: Maybe<AddMediaItemToAlbumPayload>;
  errors?: Maybe<Array<ContractError>>;
};

export type AddMediaItemsToAlbumInput = {
  albumId?: InputMaybe<Scalars['ID']['input']>;
  mediaItemIds: Array<Scalars['ID']['input']>;
  newAlbum?: InputMaybe<NewAlbumInAddMediaItemsInput>;
};

export type AddMediaItemsToAlbumPayload = {
  __typename?: 'AddMediaItemsToAlbumPayload';
  albumId: Scalars['ID']['output'];
  albumItemIds: Array<Scalars['ID']['output']>;
};

export type AddMediaItemsToAlbumResponse = {
  __typename?: 'AddMediaItemsToAlbumResponse';
  data?: Maybe<AddMediaItemsToAlbumPayload>;
  errors?: Maybe<Array<ContractError>>;
};

export type Album = Node & {
  __typename?: 'Album';
  coverMedia?: Maybe<MediaItem>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  items: AlbumItemCollectionPayload;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type AlbumItemsArgs = {
  input: ViewerAlbumItemsInput;
};

export type AlbumCollectionInput = {
  pageInfo: PageInfoInput;
  sortBy: AlbumSortBy;
  sortDir: SortDir;
};

export type AlbumCollectionPayload = {
  __typename?: 'AlbumCollectionPayload';
  nodes: Array<Album>;
  pageInfo: PageInfo;
};

export type AlbumItem = Node & {
  __typename?: 'AlbumItem';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  mediaItem: MediaItem;
  orderIndex: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type AlbumItemCollectionInput = {
  pageInfo: PageInfoInput;
  sortBy: AlbumItemSortBy;
  sortDir: SortDir;
};

export type AlbumItemCollectionPayload = {
  __typename?: 'AlbumItemCollectionPayload';
  nodes: Array<AlbumItem>;
  pageInfo: PageInfo;
};

export type AlbumItemSortBy = 'CREATED_AT' | 'ORDER_INDEX';

export type AlbumSortBy = 'CREATED_AT' | 'TITLE';

export type ContractError = {
  __typename?: 'ContractError';
  category: ErrorCategory;
  code: Scalars['String']['output'];
  field?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  retryable: Scalars['Boolean']['output'];
};

export type CreateAlbumInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type CreateAlbumPayload = {
  __typename?: 'CreateAlbumPayload';
  albumId: Scalars['ID']['output'];
};

export type CreateAlbumResponse = {
  __typename?: 'CreateAlbumResponse';
  data?: Maybe<CreateAlbumPayload>;
  errors?: Maybe<Array<ContractError>>;
};

export type CreateMediaUploadInput = {
  kind: MediaKind;
  mimeType: Scalars['String']['input'];
  originalFileName?: InputMaybe<Scalars['String']['input']>;
};

export type CreateMediaUploadPayload = {
  __typename?: 'CreateMediaUploadPayload';
  mediaItemId: Scalars['ID']['output'];
  status: MediaItemStatus;
  uploadInstructions: UploadInstructions;
};

export type CreateMediaUploadResponse = {
  __typename?: 'CreateMediaUploadResponse';
  data?: Maybe<CreateMediaUploadPayload>;
  errors?: Maybe<Array<ContractError>>;
};

export type DeleteAlbumInput = {
  albumId: Scalars['ID']['input'];
};

export type DeleteAlbumItemsFromAlbumInput = {
  albumId: Scalars['ID']['input'];
  albumItemIds: Array<Scalars['ID']['input']>;
};

export type DeleteAlbumItemsFromAlbumPayload = {
  __typename?: 'DeleteAlbumItemsFromAlbumPayload';
  albumId: Scalars['ID']['output'];
  albumItemIds: Array<Scalars['ID']['output']>;
};

export type DeleteAlbumItemsFromAlbumResponse = {
  __typename?: 'DeleteAlbumItemsFromAlbumResponse';
  data?: Maybe<DeleteAlbumItemsFromAlbumPayload>;
  errors?: Maybe<Array<ContractError>>;
};

export type DeleteAlbumPayload = {
  __typename?: 'DeleteAlbumPayload';
  albumId: Scalars['ID']['output'];
};

export type DeleteAlbumResponse = {
  __typename?: 'DeleteAlbumResponse';
  data?: Maybe<DeleteAlbumPayload>;
  errors?: Maybe<Array<ContractError>>;
};

export type DeleteMediaItemInput = {
  mediaItemId: Scalars['ID']['input'];
};

export type DeleteMediaItemPayload = {
  __typename?: 'DeleteMediaItemPayload';
  mediaItemId: Scalars['ID']['output'];
};

export type DeleteMediaItemResponse = {
  __typename?: 'DeleteMediaItemResponse';
  data?: Maybe<DeleteMediaItemPayload>;
  errors?: Maybe<Array<ContractError>>;
};

export type DeleteMediaItemsInput = {
  mediaItemIds: Array<Scalars['ID']['input']>;
};

export type DeleteMediaItemsPayload = {
  __typename?: 'DeleteMediaItemsPayload';
  deletedMediaItemIds: Array<Scalars['ID']['output']>;
};

export type DeleteMediaItemsResponse = {
  __typename?: 'DeleteMediaItemsResponse';
  data?: Maybe<DeleteMediaItemsPayload>;
  errors?: Maybe<Array<ContractError>>;
};

/** Optional metadata on enum values for SmartEnum / codegen (e.g. DB column names). */
export type EnumMetaPropInput = {
  name: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type ErrorCategory = 'AUTH' | 'CONFLICT' | 'DOMAIN' | 'NETWORK' | 'SYSTEM' | 'VALIDATION';

export type FinalizeMediaUploadInput = {
  mediaItemId: Scalars['ID']['input'];
};

export type FinalizeMediaUploadPayload = {
  __typename?: 'FinalizeMediaUploadPayload';
  kind: MediaKind;
  mediaItemId: Scalars['ID']['output'];
  mimeType?: Maybe<Scalars['String']['output']>;
  size: Scalars['Int']['output'];
  status: MediaItemStatus;
};

export type FinalizeMediaUploadResponse = {
  __typename?: 'FinalizeMediaUploadResponse';
  data?: Maybe<FinalizeMediaUploadPayload>;
  errors?: Maybe<Array<ContractError>>;
};

export type MediaAsset = Node & {
  __typename?: 'MediaAsset';
  createdAt: Scalars['DateTime']['output'];
  fileSizeBytes?: Maybe<Scalars['Int']['output']>;
  height?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  kind: MediaAssetKind;
  mimeType: Scalars['String']['output'];
  status: MediaAssetStatus;
  updatedAt: Scalars['DateTime']['output'];
  url: Scalars['String']['output'];
  width?: Maybe<Scalars['Int']['output']>;
};

export type MediaAssetKind = 'DISPLAY' | 'ORIGINAL' | 'THUMBNAIL';

export type MediaAssetStatus = 'FAILED' | 'PENDING' | 'PROCESSING' | 'READY';

export type MediaItem = Node & {
  __typename?: 'MediaItem';
  createdAt: Scalars['DateTime']['output'];
  /** Thumbnail and display object URLs derived from storage keys (no media_asset reads). */
  derivedUrls: MediaItemDerivedUrls;
  description?: Maybe<Scalars['String']['output']>;
  durationSeconds?: Maybe<Scalars['Int']['output']>;
  height?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  kind: MediaKind;
  mimeType: Scalars['String']['output'];
  originalFileName: Scalars['String']['output'];
  sizeBytes: Scalars['Int']['output'];
  status: MediaItemStatus;
  tags: Array<Scalars['String']['output']>;
  takenAt?: Maybe<Scalars['DateTime']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  width?: Maybe<Scalars['Int']['output']>;
};

export type MediaItemCollectionInput = {
  pageInfo: PageInfoInput;
  sortBy: MediaItemSortBy;
  sortDir: SortDir;
};

export type MediaItemCollectionPayload = {
  __typename?: 'MediaItemCollectionPayload';
  nodes: Array<MediaItem>;
  pageInfo: PageInfo;
};

export type MediaItemDerivedUrls = {
  __typename?: 'MediaItemDerivedUrls';
  display: Scalars['String']['output'];
  thumbnail: Scalars['String']['output'];
};

export type MediaItemSortBy = 'CREATED_AT';

export type MediaItemStatus =
  | 'DELETE_FAILED'
  | 'DELETE_PENDING'
  | 'FAILED'
  | 'PENDING'
  | 'PROCESSING'
  | 'READY'
  | 'UPLOADED';

export type MediaKind = 'PHOTO' | 'VIDEO';

export type Mutation = {
  __typename?: 'Mutation';
  AddMediaItemToAlbum: AddMediaItemToAlbumResponse;
  AddMediaItemsToAlbum: AddMediaItemsToAlbumResponse;
  DeleteAlbumItemsFromAlbum: DeleteAlbumItemsFromAlbumResponse;
  ReorderAlbumItems: ReorderAlbumItemsResponse;
  SetCoverMedia: SetCoverMediaResponse;
  UnsetCoverMedia: UnsetCoverMediaResponse;
  createAlbum: CreateAlbumResponse;
  createMediaUpload: CreateMediaUploadResponse;
  deleteAlbum: DeleteAlbumResponse;
  deleteMediaItem: DeleteMediaItemResponse;
  deleteMediaItems: DeleteMediaItemsResponse;
  finalizeMediaUpload: FinalizeMediaUploadResponse;
  updateMediaItemDetails: UpdateMediaItemDetailsResponse;
  updateMediaItemTags: UpdateMediaItemTagsResponse;
};

export type MutationAddMediaItemToAlbumArgs = {
  input: AddMediaItemToAlbumInput;
};

export type MutationAddMediaItemsToAlbumArgs = {
  input: AddMediaItemsToAlbumInput;
};

export type MutationDeleteAlbumItemsFromAlbumArgs = {
  input: DeleteAlbumItemsFromAlbumInput;
};

export type MutationReorderAlbumItemsArgs = {
  input: ReorderAlbumItemsInput;
};

export type MutationSetCoverMediaArgs = {
  input: SetCoverMediaInput;
};

export type MutationUnsetCoverMediaArgs = {
  input: UnsetCoverMediaInput;
};

export type MutationCreateAlbumArgs = {
  input: CreateAlbumInput;
};

export type MutationCreateMediaUploadArgs = {
  input: CreateMediaUploadInput;
};

export type MutationDeleteAlbumArgs = {
  input: DeleteAlbumInput;
};

export type MutationDeleteMediaItemArgs = {
  input: DeleteMediaItemInput;
};

export type MutationDeleteMediaItemsArgs = {
  input: DeleteMediaItemsInput;
};

export type MutationFinalizeMediaUploadArgs = {
  input: FinalizeMediaUploadInput;
};

export type MutationUpdateMediaItemDetailsArgs = {
  input: UpdateMediaItemDetailsInput;
};

export type MutationUpdateMediaItemTagsArgs = {
  input: UpdateMediaItemTagsInput;
};

export type NewAlbumInAddMediaItemsInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

/** Implemented by all entities that have an id. */
export type Node = {
  id: Scalars['ID']['output'];
};

/** Cursor-free paging window (offset-based). Used on output types. */
export type PageInfo = {
  __typename?: 'PageInfo';
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
};

/** Same shape as PageInfo; GraphQL requires a distinct input type for fields on input objects. */
export type PageInfoInput = {
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
};

export type Query = {
  __typename?: 'Query';
  shareLink?: Maybe<ShareLinkAccess>;
  viewer?: Maybe<Viewer>;
};

export type QueryShareLinkArgs = {
  token: Scalars['String']['input'];
};

export type ReorderAlbumItemsInput = {
  albumId: Scalars['ID']['input'];
  albumItemIds: Array<Scalars['ID']['input']>;
};

export type ReorderAlbumItemsPayload = {
  __typename?: 'ReorderAlbumItemsPayload';
  albumId: Scalars['ID']['output'];
};

export type ReorderAlbumItemsResponse = {
  __typename?: 'ReorderAlbumItemsResponse';
  data?: Maybe<ReorderAlbumItemsPayload>;
  errors?: Maybe<Array<ContractError>>;
};

export type SetCoverMediaInput = {
  albumId: Scalars['ID']['input'];
  mediaItemId: Scalars['ID']['input'];
};

export type SetCoverMediaPayload = {
  __typename?: 'SetCoverMediaPayload';
  albumId: Scalars['ID']['output'];
  mediaCoverId: Scalars['ID']['output'];
};

export type SetCoverMediaResponse = {
  __typename?: 'SetCoverMediaResponse';
  data?: Maybe<SetCoverMediaPayload>;
  errors?: Maybe<Array<ContractError>>;
};

export type ShareLinkAccess = {
  __typename?: 'ShareLinkAccess';
  target: ShareLinkTarget;
  token: Scalars['ID']['output'];
  viewerRelationship: ShareViewerRelationship;
};

export type ShareLinkTarget = SharedAlbum | SharedMediaItem;

export type ShareViewerRelationship = 'ANONYMOUS' | 'AUTHENTICATED' | 'MEMBER' | 'OWNER';

export type SharedAlbum = Node & {
  __typename?: 'SharedAlbum';
  id: Scalars['ID']['output'];
  items: SharedAlbumItemConnection;
  title: Scalars['String']['output'];
};

export type SharedAlbumItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};

export type SharedAlbumItem = Node & {
  __typename?: 'SharedAlbumItem';
  id: Scalars['ID']['output'];
  media: SharedMediaItem;
};

export type SharedAlbumItemConnection = {
  __typename?: 'SharedAlbumItemConnection';
  nodes: Array<SharedAlbumItem>;
  pageInfo: PageInfo;
};

export type SharedMediaItem = Node & {
  __typename?: 'SharedMediaItem';
  displayUrl: Scalars['String']['output'];
  height?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  width?: Maybe<Scalars['Int']['output']>;
};

export type SortDir = 'ASC' | 'DESC';

export type UnsetCoverMediaInput = {
  albumId: Scalars['ID']['input'];
};

export type UnsetCoverMediaPayload = {
  __typename?: 'UnsetCoverMediaPayload';
  albumId: Scalars['ID']['output'];
};

export type UnsetCoverMediaResponse = {
  __typename?: 'UnsetCoverMediaResponse';
  data?: Maybe<UnsetCoverMediaPayload>;
  errors?: Maybe<Array<ContractError>>;
};

export type UpdateMediaItemDetailsInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  mediaItemId: Scalars['ID']['input'];
  takenAt?: InputMaybe<Scalars['DateTime']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateMediaItemDetailsPayload = {
  __typename?: 'UpdateMediaItemDetailsPayload';
  description?: Maybe<Scalars['String']['output']>;
  mediaItemId: Scalars['ID']['output'];
  takenAt?: Maybe<Scalars['DateTime']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type UpdateMediaItemDetailsResponse = {
  __typename?: 'UpdateMediaItemDetailsResponse';
  data?: Maybe<UpdateMediaItemDetailsPayload>;
  errors?: Maybe<Array<ContractError>>;
};

export type UpdateMediaItemTagsInput = {
  mediaItemId: Scalars['ID']['input'];
  tags: Array<Scalars['String']['input']>;
};

export type UpdateMediaItemTagsPayload = {
  __typename?: 'UpdateMediaItemTagsPayload';
  mediaItemId: Scalars['ID']['output'];
  tags: Array<Scalars['String']['output']>;
};

export type UpdateMediaItemTagsResponse = {
  __typename?: 'UpdateMediaItemTagsResponse';
  data?: Maybe<UpdateMediaItemTagsPayload>;
  errors?: Maybe<Array<ContractError>>;
};

export type UploadHeader = {
  __typename?: 'UploadHeader';
  key: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type UploadInstructions = {
  __typename?: 'UploadInstructions';
  headers: Array<UploadHeader>;
  method: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type Viewer = {
  __typename?: 'Viewer';
  album?: Maybe<Album>;
  albums: AlbumCollectionPayload;
  deleteAlbum: DeleteAlbumResponse;
  displayName: Scalars['String']['output'];
  firstName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lastName?: Maybe<Scalars['String']['output']>;
  mediaItem?: Maybe<MediaItem>;
  mediaItems: MediaItemCollectionPayload;
};

export type ViewerAlbumArgs = {
  id: Scalars['ID']['input'];
};

export type ViewerAlbumsArgs = {
  input: ViewerAlbumsInput;
};

export type ViewerDeleteAlbumArgs = {
  input: DeleteAlbumInput;
};

export type ViewerMediaItemArgs = {
  id: Scalars['ID']['input'];
};

export type ViewerMediaItemsArgs = {
  input: ViewerMediaItemsInput;
};

export type ViewerAlbumItemsInput = {
  collectionInfo: AlbumItemCollectionInput;
};

export type ViewerAlbumsInput = {
  collectionInfo: AlbumCollectionInput;
};

export type ViewerMediaItemsInput = {
  collectionInfo: MediaItemCollectionInput;
};

export type CreateAlbumMutationVariables = Exact<{
  input: CreateAlbumInput;
}>;

export type CreateAlbumMutation = {
  __typename?: 'Mutation';
  createAlbum: {
    __typename?: 'CreateAlbumResponse';
    data?: { __typename?: 'CreateAlbumPayload'; albumId: string } | undefined;
    errors?:
      | Array<{
          __typename?: 'ContractError';
          code: string;
          message: string;
          field?: string | undefined;
          category: ErrorCategory;
          retryable: boolean;
        }>
      | undefined;
  };
};

export type AddMediaItemToAlbumMutationVariables = Exact<{
  input: AddMediaItemToAlbumInput;
}>;

export type AddMediaItemToAlbumMutation = {
  __typename?: 'Mutation';
  AddMediaItemToAlbum: {
    __typename?: 'AddMediaItemToAlbumResponse';
    data?:
      | { __typename?: 'AddMediaItemToAlbumPayload'; albumId: string; albumItemId: string }
      | undefined;
    errors?:
      | Array<{
          __typename?: 'ContractError';
          code: string;
          message: string;
          field?: string | undefined;
          category: ErrorCategory;
          retryable: boolean;
        }>
      | undefined;
  };
};

export type AddMediaItemsToAlbumMutationVariables = Exact<{
  input: AddMediaItemsToAlbumInput;
}>;

export type AddMediaItemsToAlbumMutation = {
  __typename?: 'Mutation';
  AddMediaItemsToAlbum: {
    __typename?: 'AddMediaItemsToAlbumResponse';
    data?:
      | { __typename?: 'AddMediaItemsToAlbumPayload'; albumId: string; albumItemIds: Array<string> }
      | undefined;
    errors?:
      | Array<{
          __typename?: 'ContractError';
          code: string;
          message: string;
          field?: string | undefined;
          category: ErrorCategory;
          retryable: boolean;
        }>
      | undefined;
  };
};

export type DeleteAlbumItemsFromAlbumMutationVariables = Exact<{
  input: DeleteAlbumItemsFromAlbumInput;
}>;

export type DeleteAlbumItemsFromAlbumMutation = {
  __typename?: 'Mutation';
  DeleteAlbumItemsFromAlbum: {
    __typename?: 'DeleteAlbumItemsFromAlbumResponse';
    data?:
      | {
          __typename?: 'DeleteAlbumItemsFromAlbumPayload';
          albumId: string;
          albumItemIds: Array<string>;
        }
      | undefined;
    errors?:
      | Array<{
          __typename?: 'ContractError';
          code: string;
          message: string;
          field?: string | undefined;
          category: ErrorCategory;
          retryable: boolean;
        }>
      | undefined;
  };
};

export type DeleteMediaItemsMutationVariables = Exact<{
  input: DeleteMediaItemsInput;
}>;

export type DeleteMediaItemsMutation = {
  __typename?: 'Mutation';
  deleteMediaItems: {
    __typename?: 'DeleteMediaItemsResponse';
    data?:
      | { __typename?: 'DeleteMediaItemsPayload'; deletedMediaItemIds: Array<string> }
      | undefined;
    errors?:
      | Array<{
          __typename?: 'ContractError';
          code: string;
          message: string;
          field?: string | undefined;
          category: ErrorCategory;
          retryable: boolean;
        }>
      | undefined;
  };
};

export type CreateMediaUploadMutationVariables = Exact<{
  input: CreateMediaUploadInput;
}>;

export type CreateMediaUploadMutation = {
  __typename?: 'Mutation';
  createMediaUpload: {
    __typename?: 'CreateMediaUploadResponse';
    data?:
      | {
          __typename?: 'CreateMediaUploadPayload';
          mediaItemId: string;
          status: MediaItemStatus;
          uploadInstructions: {
            __typename?: 'UploadInstructions';
            method: string;
            url: string;
            headers: Array<{ __typename?: 'UploadHeader'; key: string; value: string }>;
          };
        }
      | undefined;
    errors?:
      | Array<{
          __typename?: 'ContractError';
          code: string;
          message: string;
          field?: string | undefined;
          category: ErrorCategory;
          retryable: boolean;
        }>
      | undefined;
  };
};

export type FinalizeMediaUploadMutationVariables = Exact<{
  input: FinalizeMediaUploadInput;
}>;

export type FinalizeMediaUploadMutation = {
  __typename?: 'Mutation';
  finalizeMediaUpload: {
    __typename?: 'FinalizeMediaUploadResponse';
    data?:
      | {
          __typename?: 'FinalizeMediaUploadPayload';
          mediaItemId: string;
          status: MediaItemStatus;
          size: number;
          kind: MediaKind;
        }
      | undefined;
    errors?:
      | Array<{
          __typename?: 'ContractError';
          code: string;
          message: string;
          field?: string | undefined;
          category: ErrorCategory;
          retryable: boolean;
        }>
      | undefined;
  };
};

export type UpdateMediaItemDetailsMutationVariables = Exact<{
  input: UpdateMediaItemDetailsInput;
}>;

export type UpdateMediaItemDetailsMutation = {
  __typename?: 'Mutation';
  updateMediaItemDetails: {
    __typename?: 'UpdateMediaItemDetailsResponse';
    data?:
      | {
          __typename?: 'UpdateMediaItemDetailsPayload';
          mediaItemId: string;
          title?: string | undefined;
          description?: string | undefined;
          takenAt?: string | undefined;
        }
      | undefined;
    errors?:
      | Array<{
          __typename?: 'ContractError';
          code: string;
          message: string;
          field?: string | undefined;
          category: ErrorCategory;
          retryable: boolean;
        }>
      | undefined;
  };
};

export type AlbumItemSummaryFragment = {
  __typename?: 'AlbumItem';
  id: string;
  orderIndex: string;
  createdAt: string;
  updatedAt: string;
  mediaItem: {
    __typename?: 'MediaItem';
    id: string;
    kind: MediaKind;
    title?: string | undefined;
    originalFileName: string;
    createdAt: string;
    derivedUrls: { __typename?: 'MediaItemDerivedUrls'; thumbnail: string };
  };
};

export type AlbumSummaryFragment = {
  __typename?: 'Album';
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  coverMedia?:
    | {
        __typename?: 'MediaItem';
        id: string;
        kind: MediaKind;
        title?: string | undefined;
        originalFileName: string;
        createdAt: string;
        derivedUrls: { __typename?: 'MediaItemDerivedUrls'; thumbnail: string };
      }
    | undefined;
  items: {
    __typename?: 'AlbumItemCollectionPayload';
    nodes: Array<{
      __typename?: 'AlbumItem';
      id: string;
      orderIndex: string;
      createdAt: string;
      updatedAt: string;
      mediaItem: {
        __typename?: 'MediaItem';
        id: string;
        kind: MediaKind;
        title?: string | undefined;
        originalFileName: string;
        createdAt: string;
        derivedUrls: { __typename?: 'MediaItemDerivedUrls'; thumbnail: string };
      };
    }>;
    pageInfo: { __typename?: 'PageInfo'; limit: number; offset: number };
  };
};

export type MediaItemDetailFragment = {
  __typename?: 'MediaItem';
  id: string;
  kind: MediaKind;
  mimeType: string;
  title?: string | undefined;
  description?: string | undefined;
  originalFileName: string;
  createdAt: string;
  takenAt?: string | undefined;
  derivedUrls: { __typename?: 'MediaItemDerivedUrls'; display: string };
};

export type MediaItemSummaryFragment = {
  __typename?: 'MediaItem';
  id: string;
  kind: MediaKind;
  title?: string | undefined;
  originalFileName: string;
  createdAt: string;
  derivedUrls: { __typename?: 'MediaItemDerivedUrls'; thumbnail: string };
};

export type ViewerQueryVariables = Exact<{ [key: string]: never }>;

export type ViewerQuery = {
  __typename?: 'Query';
  viewer?:
    | {
        __typename?: 'Viewer';
        id: string;
        firstName?: string | undefined;
        lastName?: string | undefined;
        displayName: string;
      }
    | undefined;
};

export type ViewerAlbumDetailQueryVariables = Exact<{
  albumId: Scalars['ID']['input'];
}>;

export type ViewerAlbumDetailQuery = {
  __typename?: 'Query';
  viewer?:
    | {
        __typename?: 'Viewer';
        id: string;
        album?:
          | {
              __typename?: 'Album';
              id: string;
              title: string;
              createdAt: string;
              updatedAt: string;
              coverMedia?:
                | {
                    __typename?: 'MediaItem';
                    id: string;
                    kind: MediaKind;
                    title?: string | undefined;
                    originalFileName: string;
                    createdAt: string;
                    derivedUrls: { __typename?: 'MediaItemDerivedUrls'; thumbnail: string };
                  }
                | undefined;
              items: {
                __typename?: 'AlbumItemCollectionPayload';
                nodes: Array<{
                  __typename?: 'AlbumItem';
                  id: string;
                  orderIndex: string;
                  createdAt: string;
                  updatedAt: string;
                  mediaItem: {
                    __typename?: 'MediaItem';
                    id: string;
                    kind: MediaKind;
                    title?: string | undefined;
                    originalFileName: string;
                    createdAt: string;
                    derivedUrls: { __typename?: 'MediaItemDerivedUrls'; thumbnail: string };
                  };
                }>;
                pageInfo: { __typename?: 'PageInfo'; limit: number; offset: number };
              };
            }
          | undefined;
      }
    | undefined;
};

export type ViewerAlbumsQueryVariables = Exact<{ [key: string]: never }>;

export type ViewerAlbumsQuery = {
  __typename?: 'Query';
  viewer?:
    | {
        __typename?: 'Viewer';
        id: string;
        albums: {
          __typename?: 'AlbumCollectionPayload';
          nodes: Array<{
            __typename?: 'Album';
            id: string;
            title: string;
            createdAt: string;
            updatedAt: string;
            coverMedia?:
              | {
                  __typename?: 'MediaItem';
                  id: string;
                  kind: MediaKind;
                  title?: string | undefined;
                  originalFileName: string;
                  createdAt: string;
                  derivedUrls: { __typename?: 'MediaItemDerivedUrls'; thumbnail: string };
                }
              | undefined;
          }>;
          pageInfo: { __typename?: 'PageInfo'; limit: number; offset: number };
        };
      }
    | undefined;
};

export type ViewerMediaItemDetailQueryVariables = Exact<{
  mediaItemId: Scalars['ID']['input'];
}>;

export type ViewerMediaItemDetailQuery = {
  __typename?: 'Query';
  viewer?:
    | {
        __typename?: 'Viewer';
        id: string;
        mediaItem?:
          | {
              __typename?: 'MediaItem';
              id: string;
              kind: MediaKind;
              mimeType: string;
              title?: string | undefined;
              description?: string | undefined;
              originalFileName: string;
              createdAt: string;
              takenAt?: string | undefined;
              derivedUrls: { __typename?: 'MediaItemDerivedUrls'; display: string };
            }
          | undefined;
      }
    | undefined;
};

export type ViewerMediaPickerQueryVariables = Exact<{ [key: string]: never }>;

export type ViewerMediaPickerQuery = {
  __typename?: 'Query';
  viewer?:
    | {
        __typename?: 'Viewer';
        id: string;
        mediaItems: {
          __typename?: 'MediaItemCollectionPayload';
          nodes: Array<{
            __typename?: 'MediaItem';
            id: string;
            kind: MediaKind;
            status: MediaItemStatus;
            title?: string | undefined;
          }>;
        };
      }
    | undefined;
};

export type ViewerRecentMediaQueryVariables = Exact<{ [key: string]: never }>;

export type ViewerRecentMediaQuery = {
  __typename?: 'Query';
  viewer?:
    | {
        __typename?: 'Viewer';
        id: string;
        mediaItems: {
          __typename?: 'MediaItemCollectionPayload';
          nodes: Array<{
            __typename?: 'MediaItem';
            id: string;
            kind: MediaKind;
            title?: string | undefined;
            originalFileName: string;
            createdAt: string;
            derivedUrls: { __typename?: 'MediaItemDerivedUrls'; thumbnail: string };
          }>;
          pageInfo: { __typename?: 'PageInfo'; limit: number; offset: number };
        };
      }
    | undefined;
};

export const MediaItemSummaryFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MediaItemSummary' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'MediaItem' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originalFileName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'derivedUrls' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'thumbnail' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<MediaItemSummaryFragment, unknown>;
export const AlbumItemSummaryFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'AlbumItemSummary' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'AlbumItem' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'orderIndex' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'mediaItem' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'MediaItemSummary' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MediaItemSummary' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'MediaItem' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originalFileName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'derivedUrls' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'thumbnail' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AlbumItemSummaryFragment, unknown>;
export const AlbumSummaryFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'AlbumSummary' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Album' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'coverMedia' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'MediaItemSummary' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'items' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: {
                  kind: 'ObjectValue',
                  fields: [
                    {
                      kind: 'ObjectField',
                      name: { kind: 'Name', value: 'collectionInfo' },
                      value: {
                        kind: 'ObjectValue',
                        fields: [
                          {
                            kind: 'ObjectField',
                            name: { kind: 'Name', value: 'pageInfo' },
                            value: {
                              kind: 'ObjectValue',
                              fields: [
                                {
                                  kind: 'ObjectField',
                                  name: { kind: 'Name', value: 'limit' },
                                  value: { kind: 'IntValue', value: '100' },
                                },
                                {
                                  kind: 'ObjectField',
                                  name: { kind: 'Name', value: 'offset' },
                                  value: { kind: 'IntValue', value: '0' },
                                },
                              ],
                            },
                          },
                          {
                            kind: 'ObjectField',
                            name: { kind: 'Name', value: 'sortBy' },
                            value: { kind: 'EnumValue', value: 'CREATED_AT' },
                          },
                          {
                            kind: 'ObjectField',
                            name: { kind: 'Name', value: 'sortDir' },
                            value: { kind: 'EnumValue', value: 'DESC' },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'nodes' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'AlbumItemSummary' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pageInfo' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'limit' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'offset' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MediaItemSummary' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'MediaItem' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originalFileName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'derivedUrls' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'thumbnail' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'AlbumItemSummary' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'AlbumItem' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'orderIndex' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'mediaItem' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'MediaItemSummary' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AlbumSummaryFragment, unknown>;
export const MediaItemDetailFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MediaItemDetail' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'MediaItem' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
          { kind: 'Field', name: { kind: 'Name', value: 'mimeType' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'description' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originalFileName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'takenAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'derivedUrls' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'display' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<MediaItemDetailFragment, unknown>;
export const CreateAlbumDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateAlbum' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'CreateAlbumInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createAlbum' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'data' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'Field', name: { kind: 'Name', value: 'albumId' } }],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'errors' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'field' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'category' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'retryable' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateAlbumMutation, CreateAlbumMutationVariables>;
export const AddMediaItemToAlbumDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'AddMediaItemToAlbum' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'AddMediaItemToAlbumInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'AddMediaItemToAlbum' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'data' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'albumId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'albumItemId' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'errors' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'field' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'category' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'retryable' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AddMediaItemToAlbumMutation, AddMediaItemToAlbumMutationVariables>;
export const AddMediaItemsToAlbumDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'AddMediaItemsToAlbum' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'AddMediaItemsToAlbumInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'AddMediaItemsToAlbum' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'data' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'albumId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'albumItemIds' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'errors' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'field' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'category' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'retryable' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AddMediaItemsToAlbumMutation, AddMediaItemsToAlbumMutationVariables>;
export const DeleteAlbumItemsFromAlbumDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteAlbumItemsFromAlbum' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'DeleteAlbumItemsFromAlbumInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'DeleteAlbumItemsFromAlbum' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'data' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'albumId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'albumItemIds' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'errors' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'field' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'category' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'retryable' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  DeleteAlbumItemsFromAlbumMutation,
  DeleteAlbumItemsFromAlbumMutationVariables
>;
export const DeleteMediaItemsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteMediaItems' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'DeleteMediaItemsInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'deleteMediaItems' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'data' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'deletedMediaItemIds' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'errors' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'field' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'category' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'retryable' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteMediaItemsMutation, DeleteMediaItemsMutationVariables>;
export const CreateMediaUploadDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateMediaUpload' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'CreateMediaUploadInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createMediaUpload' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'data' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'mediaItemId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'uploadInstructions' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'method' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'headers' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'key' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'value' } },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'errors' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'field' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'category' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'retryable' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateMediaUploadMutation, CreateMediaUploadMutationVariables>;
export const FinalizeMediaUploadDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'FinalizeMediaUpload' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'FinalizeMediaUploadInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'finalizeMediaUpload' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'data' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'mediaItemId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'size' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'errors' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'field' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'category' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'retryable' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<FinalizeMediaUploadMutation, FinalizeMediaUploadMutationVariables>;
export const UpdateMediaItemDetailsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateMediaItemDetails' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'UpdateMediaItemDetailsInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateMediaItemDetails' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'data' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'mediaItemId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'takenAt' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'errors' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'field' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'category' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'retryable' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  UpdateMediaItemDetailsMutation,
  UpdateMediaItemDetailsMutationVariables
>;
export const ViewerDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Viewer' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'viewer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'firstName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lastName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ViewerQuery, ViewerQueryVariables>;
export const ViewerAlbumDetailDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ViewerAlbumDetail' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'albumId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'viewer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'album' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'id' },
                      value: { kind: 'Variable', name: { kind: 'Name', value: 'albumId' } },
                    },
                  ],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'AlbumSummary' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MediaItemSummary' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'MediaItem' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originalFileName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'derivedUrls' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'thumbnail' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'AlbumItemSummary' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'AlbumItem' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'orderIndex' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'mediaItem' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'MediaItemSummary' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'AlbumSummary' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Album' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'coverMedia' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'MediaItemSummary' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'items' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: {
                  kind: 'ObjectValue',
                  fields: [
                    {
                      kind: 'ObjectField',
                      name: { kind: 'Name', value: 'collectionInfo' },
                      value: {
                        kind: 'ObjectValue',
                        fields: [
                          {
                            kind: 'ObjectField',
                            name: { kind: 'Name', value: 'pageInfo' },
                            value: {
                              kind: 'ObjectValue',
                              fields: [
                                {
                                  kind: 'ObjectField',
                                  name: { kind: 'Name', value: 'limit' },
                                  value: { kind: 'IntValue', value: '100' },
                                },
                                {
                                  kind: 'ObjectField',
                                  name: { kind: 'Name', value: 'offset' },
                                  value: { kind: 'IntValue', value: '0' },
                                },
                              ],
                            },
                          },
                          {
                            kind: 'ObjectField',
                            name: { kind: 'Name', value: 'sortBy' },
                            value: { kind: 'EnumValue', value: 'CREATED_AT' },
                          },
                          {
                            kind: 'ObjectField',
                            name: { kind: 'Name', value: 'sortDir' },
                            value: { kind: 'EnumValue', value: 'DESC' },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'nodes' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'AlbumItemSummary' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pageInfo' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'limit' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'offset' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ViewerAlbumDetailQuery, ViewerAlbumDetailQueryVariables>;
export const ViewerAlbumsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ViewerAlbums' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'viewer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'albums' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'input' },
                      value: {
                        kind: 'ObjectValue',
                        fields: [
                          {
                            kind: 'ObjectField',
                            name: { kind: 'Name', value: 'collectionInfo' },
                            value: {
                              kind: 'ObjectValue',
                              fields: [
                                {
                                  kind: 'ObjectField',
                                  name: { kind: 'Name', value: 'pageInfo' },
                                  value: {
                                    kind: 'ObjectValue',
                                    fields: [
                                      {
                                        kind: 'ObjectField',
                                        name: { kind: 'Name', value: 'limit' },
                                        value: { kind: 'IntValue', value: '50' },
                                      },
                                      {
                                        kind: 'ObjectField',
                                        name: { kind: 'Name', value: 'offset' },
                                        value: { kind: 'IntValue', value: '0' },
                                      },
                                    ],
                                  },
                                },
                                {
                                  kind: 'ObjectField',
                                  name: { kind: 'Name', value: 'sortBy' },
                                  value: { kind: 'EnumValue', value: 'CREATED_AT' },
                                },
                                {
                                  kind: 'ObjectField',
                                  name: { kind: 'Name', value: 'sortDir' },
                                  value: { kind: 'EnumValue', value: 'DESC' },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'nodes' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'coverMedia' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'FragmentSpread',
                                    name: { kind: 'Name', value: 'MediaItemSummary' },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'pageInfo' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'limit' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'offset' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MediaItemSummary' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'MediaItem' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originalFileName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'derivedUrls' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'thumbnail' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ViewerAlbumsQuery, ViewerAlbumsQueryVariables>;
export const ViewerMediaItemDetailDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ViewerMediaItemDetail' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'mediaItemId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'viewer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'mediaItem' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'id' },
                      value: { kind: 'Variable', name: { kind: 'Name', value: 'mediaItemId' } },
                    },
                  ],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'MediaItemDetail' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MediaItemDetail' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'MediaItem' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
          { kind: 'Field', name: { kind: 'Name', value: 'mimeType' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'description' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originalFileName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'takenAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'derivedUrls' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'display' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ViewerMediaItemDetailQuery, ViewerMediaItemDetailQueryVariables>;
export const ViewerMediaPickerDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ViewerMediaPicker' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'viewer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'mediaItems' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'input' },
                      value: {
                        kind: 'ObjectValue',
                        fields: [
                          {
                            kind: 'ObjectField',
                            name: { kind: 'Name', value: 'collectionInfo' },
                            value: {
                              kind: 'ObjectValue',
                              fields: [
                                {
                                  kind: 'ObjectField',
                                  name: { kind: 'Name', value: 'pageInfo' },
                                  value: {
                                    kind: 'ObjectValue',
                                    fields: [
                                      {
                                        kind: 'ObjectField',
                                        name: { kind: 'Name', value: 'limit' },
                                        value: { kind: 'IntValue', value: '40' },
                                      },
                                      {
                                        kind: 'ObjectField',
                                        name: { kind: 'Name', value: 'offset' },
                                        value: { kind: 'IntValue', value: '0' },
                                      },
                                    ],
                                  },
                                },
                                {
                                  kind: 'ObjectField',
                                  name: { kind: 'Name', value: 'sortBy' },
                                  value: { kind: 'EnumValue', value: 'CREATED_AT' },
                                },
                                {
                                  kind: 'ObjectField',
                                  name: { kind: 'Name', value: 'sortDir' },
                                  value: { kind: 'EnumValue', value: 'DESC' },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'nodes' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ViewerMediaPickerQuery, ViewerMediaPickerQueryVariables>;
export const ViewerRecentMediaDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ViewerRecentMedia' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'viewer' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'mediaItems' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'input' },
                      value: {
                        kind: 'ObjectValue',
                        fields: [
                          {
                            kind: 'ObjectField',
                            name: { kind: 'Name', value: 'collectionInfo' },
                            value: {
                              kind: 'ObjectValue',
                              fields: [
                                {
                                  kind: 'ObjectField',
                                  name: { kind: 'Name', value: 'pageInfo' },
                                  value: {
                                    kind: 'ObjectValue',
                                    fields: [
                                      {
                                        kind: 'ObjectField',
                                        name: { kind: 'Name', value: 'limit' },
                                        value: { kind: 'IntValue', value: '10' },
                                      },
                                      {
                                        kind: 'ObjectField',
                                        name: { kind: 'Name', value: 'offset' },
                                        value: { kind: 'IntValue', value: '0' },
                                      },
                                    ],
                                  },
                                },
                                {
                                  kind: 'ObjectField',
                                  name: { kind: 'Name', value: 'sortBy' },
                                  value: { kind: 'EnumValue', value: 'CREATED_AT' },
                                },
                                {
                                  kind: 'ObjectField',
                                  name: { kind: 'Name', value: 'sortDir' },
                                  value: { kind: 'EnumValue', value: 'DESC' },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'nodes' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'FragmentSpread',
                              name: { kind: 'Name', value: 'MediaItemSummary' },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'pageInfo' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'limit' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'offset' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MediaItemSummary' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'MediaItem' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
          { kind: 'Field', name: { kind: 'Name', value: 'title' } },
          { kind: 'Field', name: { kind: 'Name', value: 'originalFileName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'derivedUrls' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'thumbnail' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ViewerRecentMediaQuery, ViewerRecentMediaQueryVariables>;
