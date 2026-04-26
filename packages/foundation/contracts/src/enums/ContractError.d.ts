import { type Enumeration } from '@reharik/smart-enum';
export type ErrorArea = Enumeration<typeof ErrorArea>;
export declare const ErrorArea: {
    auth: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "auth";
        readonly value: "AUTH";
        readonly display: "Auth";
    };
    album: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "album";
        readonly value: "ALBUM";
        readonly display: "Album";
    };
    mediaItem: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "mediaItem";
        readonly value: "MEDIA_ITEM";
        readonly display: "Media Item";
    };
    membership: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "membership";
        readonly value: "MEMBERSHIP";
        readonly display: "Membership";
    };
    viewer: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "viewer";
        readonly value: "VIEWER";
        readonly display: "Viewer";
    };
    share: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "share";
        readonly value: "SHARE";
        readonly display: "Share";
    };
    user: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "user";
        readonly value: "USER";
        readonly display: "User";
    };
} & {
    fromValue(value: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "auth";
        readonly value: "AUTH";
        readonly display: "Auth";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "album";
        readonly value: "ALBUM";
        readonly display: "Album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "mediaItem";
        readonly value: "MEDIA_ITEM";
        readonly display: "Media Item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "membership";
        readonly value: "MEMBERSHIP";
        readonly display: "Membership";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "viewer";
        readonly value: "VIEWER";
        readonly display: "Viewer";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "share";
        readonly value: "SHARE";
        readonly display: "Share";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "user";
        readonly value: "USER";
        readonly display: "User";
    });
    tryFromValue(value?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "auth";
        readonly value: "AUTH";
        readonly display: "Auth";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "album";
        readonly value: "ALBUM";
        readonly display: "Album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "mediaItem";
        readonly value: "MEDIA_ITEM";
        readonly display: "Media Item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "membership";
        readonly value: "MEMBERSHIP";
        readonly display: "Membership";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "viewer";
        readonly value: "VIEWER";
        readonly display: "Viewer";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "share";
        readonly value: "SHARE";
        readonly display: "Share";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "user";
        readonly value: "USER";
        readonly display: "User";
    })) | undefined;
    fromKey(key: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "auth";
        readonly value: "AUTH";
        readonly display: "Auth";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "album";
        readonly value: "ALBUM";
        readonly display: "Album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "mediaItem";
        readonly value: "MEDIA_ITEM";
        readonly display: "Media Item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "membership";
        readonly value: "MEMBERSHIP";
        readonly display: "Membership";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "viewer";
        readonly value: "VIEWER";
        readonly display: "Viewer";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "share";
        readonly value: "SHARE";
        readonly display: "Share";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "user";
        readonly value: "USER";
        readonly display: "User";
    });
    tryFromKey(key?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "auth";
        readonly value: "AUTH";
        readonly display: "Auth";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "album";
        readonly value: "ALBUM";
        readonly display: "Album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "mediaItem";
        readonly value: "MEDIA_ITEM";
        readonly display: "Media Item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "membership";
        readonly value: "MEMBERSHIP";
        readonly display: "Membership";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "viewer";
        readonly value: "VIEWER";
        readonly display: "Viewer";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "share";
        readonly value: "SHARE";
        readonly display: "Share";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "user";
        readonly value: "USER";
        readonly display: "User";
    })) | undefined;
    items(): readonly ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "auth";
        readonly value: "AUTH";
        readonly display: "Auth";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "album";
        readonly value: "ALBUM";
        readonly display: "Album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "mediaItem";
        readonly value: "MEDIA_ITEM";
        readonly display: "Media Item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "membership";
        readonly value: "MEMBERSHIP";
        readonly display: "Membership";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "viewer";
        readonly value: "VIEWER";
        readonly display: "Viewer";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "share";
        readonly value: "SHARE";
        readonly display: "Share";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "user";
        readonly value: "USER";
        readonly display: "User";
    }))[];
    values(): readonly ("ALBUM" | "MEDIA_ITEM" | "USER" | "SHARE" | "VIEWER" | "AUTH" | "MEMBERSHIP")[];
    keys(): readonly ("auth" | "album" | "mediaItem" | "membership" | "viewer" | "share" | "user")[];
};
export type ContractError = Enumeration<typeof ContractError>;
export declare const ContractError: {
    readonly AddMediaToAlbumEmptyMediaList: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_ADD_MEDIA_EMPTY_MEDIA_LIST";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AddMediaToAlbumEmptyMediaList";
        readonly value: "ADD_MEDIA_TO_ALBUM_EMPTY_MEDIA_LIST";
        readonly display: "At least one media item is required";
    };
    readonly AddMediaToAlbumInvalidTarget: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_ADD_MEDIA_INVALID_TARGET";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AddMediaToAlbumInvalidTarget";
        readonly value: "ADD_MEDIA_TO_ALBUM_INVALID_TARGET";
        readonly display: "Provide either an existing album or a new album, not both and not neither";
    };
    readonly AlbumNotFound: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AlbumNotFound";
        readonly value: "ALBUM_NOT_FOUND";
        readonly display: "Album not found";
    };
    readonly InvalidAlbumItemOrder: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_INVALID_ITEM_ORDER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidAlbumItemOrder";
        readonly value: "INVALID_ALBUM_ITEM_ORDER";
        readonly display: "Album item order is invalid";
    };
    readonly AlbumEditCoverForbidden: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_EDIT_COVER_FORBIDDEN";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AlbumEditCoverForbidden";
        readonly value: "ALBUM_EDIT_COVER_FORBIDDEN";
        readonly display: "Album edit cover forbidden";
    };
    readonly AlbumViewForbidden: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_VIEW_FORBIDDEN";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AlbumViewForbidden";
        readonly value: "ALBUM_VIEW_FORBIDDEN";
        readonly display: "Album view forbidden";
    };
    readonly AssetKindAlreadyExists: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ASSET_KIND_ALREADY_EXISTS";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "AssetKindAlreadyExists";
        readonly value: "ASSET_KIND_ALREADY_EXISTS";
        readonly display: "Asset kind already exists";
    };
    readonly AssetNotFound: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ASSET_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "AssetNotFound";
        readonly value: "ASSET_NOT_FOUND";
        readonly display: "Asset not found";
    };
    readonly AssetNotPending: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ASSET_NOT_PENDING";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "AssetNotPending";
        readonly value: "ASSET_NOT_PENDING";
        readonly display: "Asset is not pending";
    };
    readonly CoverMediaNotPartOfAlbum: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_COVER_MEDIA_NOT_PART_OF_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "CoverMediaNotPartOfAlbum";
        readonly value: "COVER_MEDIA_NOT_PART_OF_ALBUM";
        readonly display: "Cover media not part of album";
    };
    readonly DeleteAlbumItemsNoItemIds: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_DELETE_ITEMS_NO_IDS";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "DeleteAlbumItemsNoItemIds";
        readonly value: "DELETE_ALBUM_ITEMS_NO_ITEM_IDS";
        readonly display: "At least one album item is required to remove";
    };
    readonly DeleteMediaItemsEmptyList: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_DELETE_ITEMS_EMPTY_LIST";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "DeleteMediaItemsEmptyList";
        readonly value: "DELETE_MEDIA_ITEMS_EMPTY_LIST";
        readonly display: "At least one media item is required to delete";
    };
    readonly InvalidMediaDimensions: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_INVALID_DIMENSIONS";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidMediaDimensions";
        readonly value: "INVALID_MEDIA_DIMENSIONS";
        readonly display: "Media dimensions must be positive integers";
    };
    readonly InvalidMediaTakenAt: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_INVALID_TAKEN_AT";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidMediaTakenAt";
        readonly value: "INVALID_MEDIA_TAKEN_AT";
        readonly display: "Taken at is not a valid date/time";
    };
    readonly InvalidMediaItemTags: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_INVALID_TAGS";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidMediaItemTags";
        readonly value: "INVALID_MEDIA_ITEM_TAGS";
        readonly display: "Media item tags are invalid";
    };
    readonly MediaAlreadyInAlbum: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_MEDIA_ALREADY_IN_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaAlreadyInAlbum";
        readonly value: "MEDIA_ALREADY_IN_ALBUM";
        readonly display: "Media already in album";
    };
    readonly MediaBytesNotFound: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_BYTES_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaBytesNotFound";
        readonly value: "MEDIA_BYTES_NOT_FOUND";
        readonly display: "Media bytes not found";
    };
    readonly MediaDimensionsNotAvailable: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_DIMENSIONS_NOT_AVAILABLE";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: true;
    } & {
        readonly key: "MediaDimensionsNotAvailable";
        readonly value: "MEDIA_DIMENSIONS_NOT_AVAILABLE";
        readonly display: "Could not read media width and height from the uploaded file";
    };
    readonly MediaItemNotFound: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotFound";
        readonly value: "MEDIA_ITEM_NOT_FOUND";
        readonly display: "Media item not found";
    };
    readonly MediaItemsNotFound: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEMS_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemsNotFound";
        readonly value: "MEDIA_ITEMS_NOT_FOUND";
        readonly display: "Media items not found";
    };
    readonly MediaItemNotInAlbum: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_IN_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotInAlbum";
        readonly value: "MEDIA_ITEM_NOT_IN_ALBUM";
        readonly display: "Media item not in album";
    };
    readonly MediaItemNotOwnedByViewer: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_OWNED_BY_VIEWER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotOwnedByViewer";
        readonly value: "MEDIA_ITEM_NOT_OWNED_BY_VIEWER";
        readonly display: "Media item not owned by viewer";
    };
    readonly MediaItemUpdateNoFieldsProvided: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_UPDATE_NO_FIELDS_PROVIDED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemUpdateNoFieldsProvided";
        readonly value: "MEDIA_ITEM_UPDATE_NO_FIELDS_PROVIDED";
        readonly display: "No fields provided to update";
    };
    readonly MediaItemNotReady: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_READY";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotReady";
        readonly value: "MEDIA_ITEM_NOT_READY";
        readonly display: "Media item not ready";
    };
    readonly MemberNotAllowedToAddItem: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEMBER_NOT_ALLOWED_TO_ADD_ITEM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MemberNotAllowedToAddItem";
        readonly value: "MEMBER_NOT_ALLOWED_TO_ADD_ITEM";
        readonly display: "Member not allowed to add item";
    };
    readonly MemberNotAllowedToDeleteAlbum: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEMBER_NOT_ALLOWED_TO_DELETE_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MemberNotAllowedToDeleteAlbum";
        readonly value: "MEMBER_NOT_ALLOWED_TO_DELETE_ALBUM";
        readonly display: "Member not allowed to delete album";
    };
    readonly MemberNotAllowedToDeleteItem: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEMBER_NOT_ALLOWED_TO_DELETE_ITEM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MemberNotAllowedToDeleteItem";
        readonly value: "MEMBER_NOT_ALLOWED_TO_DELETE_ITEM";
        readonly display: "Member not allowed to delete item";
    };
    readonly MemberNotAllowedToEditAlbum: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEMBER_NOT_ALLOWED_TO_EDIT_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MemberNotAllowedToEditAlbum";
        readonly value: "MEMBER_NOT_ALLOWED_TO_EDIT_ALBUM";
        readonly display: "Member not allowed to edit album";
    };
    readonly StatusNotPending: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_STATUS_NOT_PENDING";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "StatusNotPending";
        readonly value: "STATUS_NOT_PENDING";
        readonly display: "Media item status is not pending";
    };
    readonly StatusNotUploaded: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_STATUS_NOT_UPLOADED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "StatusNotUploaded";
        readonly value: "STATUS_NOT_UPLOADED";
        readonly display: "Media item is not awaiting derivative processing";
    };
    readonly UserAlreadyMember: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_USER_ALREADY_MEMBER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "UserAlreadyMember";
        readonly value: "USER_ALREADY_MEMBER";
        readonly display: "User already member";
    };
    readonly UserCanNotCreateAlbum: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "USER_CAN_NOT_CREATE_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "UserCanNotCreateAlbum";
        readonly value: "USER_CAN_NOT_CREATE_ALBUM";
        readonly display: "User can not create album";
    };
    readonly UserIsNotMember: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "USER_IS_NOT_MEMBER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "UserIsNotMember";
        readonly value: "USER_IS_NOT_MEMBER";
        readonly display: "User is not member";
    };
    readonly MediaItemNotAuthorized: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_AUTHORIZED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotAuthorized";
        readonly value: "MEDIA_ITEM_NOT_AUTHORIZED";
        readonly display: "Media item not authorized";
    };
    readonly InvalidMediaAssetKind: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "INVALID_MEDIA_ASSET_KIND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidMediaAssetKind";
        readonly value: "INVALID_MEDIA_ASSET_KIND";
        readonly display: "Invalid media variant";
    };
    readonly CanNotGrantShareToOwner: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "CAN_NOT_GRANT_SHARE_TO_OWNER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "CanNotGrantShareToOwner";
        readonly value: "CAN_NOT_GRANT_SHARE_TO_OWNER";
        readonly display: "Cannot grant share to owner";
    };
    readonly ExpireDateCannotBeInPast: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "EXPIRE_DATE_CANNOT_BE_IN_PAST";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "ExpireDateCannotBeInPast";
        readonly value: "EXPIRE_DATE_CANNOT_BE_IN_PAST";
        readonly display: "Expire date cannot be in past, revoke instead";
    };
    readonly CannotUpdateExpiredDateIfRevoked: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "CANNOT_UPDATE_EXPIRED_DATE_IF_REVOKED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "CannotUpdateExpiredDateIfRevoked";
        readonly value: "CANNOT_UPDATE_EXPIRED_DATE_IF_REVOKED";
        readonly display: "Cannot update expire date if revoked";
    };
    readonly CannotRevokeShareIfAlreadyExpired: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "CANNOT_REVOKE_SHARE_IF_ALREADY_EXPIRED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "CannotRevokeShareIfAlreadyExpired";
        readonly value: "CANNOT_REVOKE_SHARE_IF_ALREADY_EXPIRED";
        readonly display: "Cannot revoke share if already expired";
    };
    readonly ShareNotFound: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "SHARE_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "ShareNotFound";
        readonly value: "SHARE_NOT_FOUND";
        readonly display: "Share not found";
    };
    readonly ShareMustHaveEitherGrantedToUserIdOrToken: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "SHARE_MUST_HAVE_EITHER_GRANTED_TO_USER_ID_OR_TOKEN";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "ShareMustHaveEitherGrantedToUserIdOrToken";
        readonly value: "SHARE_MUST_HAVE_EITHER_GRANTED_TO_USER_ID_OR_TOKEN";
        readonly display: "Share must have either granted to user id or token";
    };
    readonly ShareMustNotHaveGrantedToUserIdAndToken: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "SHARE_MUST_NOT_HAVE_GRANTED_TO_USER_ID_AND_TOKEN";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "ShareMustNotHaveGrantedToUserIdAndToken";
        readonly value: "SHARE_MUST_NOT_HAVE_GRANTED_TO_USER_ID_AND_TOKEN";
        readonly display: "Share must not have granted to user id and token";
    };
    readonly UserNotFound: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "USER_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "user";
            readonly value: "USER";
            readonly display: "User";
        };
        readonly retryable: false;
    } & {
        readonly key: "UserNotFound";
        readonly value: "USER_NOT_FOUND";
        readonly display: "User not found";
    };
} & {
    fromValue(value: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_ADD_MEDIA_EMPTY_MEDIA_LIST";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AddMediaToAlbumEmptyMediaList";
        readonly value: "ADD_MEDIA_TO_ALBUM_EMPTY_MEDIA_LIST";
        readonly display: "At least one media item is required";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_ADD_MEDIA_INVALID_TARGET";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AddMediaToAlbumInvalidTarget";
        readonly value: "ADD_MEDIA_TO_ALBUM_INVALID_TARGET";
        readonly display: "Provide either an existing album or a new album, not both and not neither";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AlbumNotFound";
        readonly value: "ALBUM_NOT_FOUND";
        readonly display: "Album not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_INVALID_ITEM_ORDER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidAlbumItemOrder";
        readonly value: "INVALID_ALBUM_ITEM_ORDER";
        readonly display: "Album item order is invalid";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_EDIT_COVER_FORBIDDEN";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AlbumEditCoverForbidden";
        readonly value: "ALBUM_EDIT_COVER_FORBIDDEN";
        readonly display: "Album edit cover forbidden";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_VIEW_FORBIDDEN";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AlbumViewForbidden";
        readonly value: "ALBUM_VIEW_FORBIDDEN";
        readonly display: "Album view forbidden";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ASSET_KIND_ALREADY_EXISTS";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "AssetKindAlreadyExists";
        readonly value: "ASSET_KIND_ALREADY_EXISTS";
        readonly display: "Asset kind already exists";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ASSET_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "AssetNotFound";
        readonly value: "ASSET_NOT_FOUND";
        readonly display: "Asset not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ASSET_NOT_PENDING";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "AssetNotPending";
        readonly value: "ASSET_NOT_PENDING";
        readonly display: "Asset is not pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_COVER_MEDIA_NOT_PART_OF_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "CoverMediaNotPartOfAlbum";
        readonly value: "COVER_MEDIA_NOT_PART_OF_ALBUM";
        readonly display: "Cover media not part of album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_DELETE_ITEMS_NO_IDS";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "DeleteAlbumItemsNoItemIds";
        readonly value: "DELETE_ALBUM_ITEMS_NO_ITEM_IDS";
        readonly display: "At least one album item is required to remove";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_DELETE_ITEMS_EMPTY_LIST";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "DeleteMediaItemsEmptyList";
        readonly value: "DELETE_MEDIA_ITEMS_EMPTY_LIST";
        readonly display: "At least one media item is required to delete";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_INVALID_DIMENSIONS";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidMediaDimensions";
        readonly value: "INVALID_MEDIA_DIMENSIONS";
        readonly display: "Media dimensions must be positive integers";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_INVALID_TAKEN_AT";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidMediaTakenAt";
        readonly value: "INVALID_MEDIA_TAKEN_AT";
        readonly display: "Taken at is not a valid date/time";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_INVALID_TAGS";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidMediaItemTags";
        readonly value: "INVALID_MEDIA_ITEM_TAGS";
        readonly display: "Media item tags are invalid";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_MEDIA_ALREADY_IN_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaAlreadyInAlbum";
        readonly value: "MEDIA_ALREADY_IN_ALBUM";
        readonly display: "Media already in album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_BYTES_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaBytesNotFound";
        readonly value: "MEDIA_BYTES_NOT_FOUND";
        readonly display: "Media bytes not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_DIMENSIONS_NOT_AVAILABLE";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: true;
    } & {
        readonly key: "MediaDimensionsNotAvailable";
        readonly value: "MEDIA_DIMENSIONS_NOT_AVAILABLE";
        readonly display: "Could not read media width and height from the uploaded file";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotFound";
        readonly value: "MEDIA_ITEM_NOT_FOUND";
        readonly display: "Media item not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEMS_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemsNotFound";
        readonly value: "MEDIA_ITEMS_NOT_FOUND";
        readonly display: "Media items not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_IN_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotInAlbum";
        readonly value: "MEDIA_ITEM_NOT_IN_ALBUM";
        readonly display: "Media item not in album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_OWNED_BY_VIEWER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotOwnedByViewer";
        readonly value: "MEDIA_ITEM_NOT_OWNED_BY_VIEWER";
        readonly display: "Media item not owned by viewer";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_UPDATE_NO_FIELDS_PROVIDED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemUpdateNoFieldsProvided";
        readonly value: "MEDIA_ITEM_UPDATE_NO_FIELDS_PROVIDED";
        readonly display: "No fields provided to update";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_READY";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotReady";
        readonly value: "MEDIA_ITEM_NOT_READY";
        readonly display: "Media item not ready";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEMBER_NOT_ALLOWED_TO_ADD_ITEM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MemberNotAllowedToAddItem";
        readonly value: "MEMBER_NOT_ALLOWED_TO_ADD_ITEM";
        readonly display: "Member not allowed to add item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEMBER_NOT_ALLOWED_TO_DELETE_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MemberNotAllowedToDeleteAlbum";
        readonly value: "MEMBER_NOT_ALLOWED_TO_DELETE_ALBUM";
        readonly display: "Member not allowed to delete album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEMBER_NOT_ALLOWED_TO_DELETE_ITEM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MemberNotAllowedToDeleteItem";
        readonly value: "MEMBER_NOT_ALLOWED_TO_DELETE_ITEM";
        readonly display: "Member not allowed to delete item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEMBER_NOT_ALLOWED_TO_EDIT_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MemberNotAllowedToEditAlbum";
        readonly value: "MEMBER_NOT_ALLOWED_TO_EDIT_ALBUM";
        readonly display: "Member not allowed to edit album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_STATUS_NOT_PENDING";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "StatusNotPending";
        readonly value: "STATUS_NOT_PENDING";
        readonly display: "Media item status is not pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_STATUS_NOT_UPLOADED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "StatusNotUploaded";
        readonly value: "STATUS_NOT_UPLOADED";
        readonly display: "Media item is not awaiting derivative processing";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_USER_ALREADY_MEMBER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "UserAlreadyMember";
        readonly value: "USER_ALREADY_MEMBER";
        readonly display: "User already member";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "USER_CAN_NOT_CREATE_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "UserCanNotCreateAlbum";
        readonly value: "USER_CAN_NOT_CREATE_ALBUM";
        readonly display: "User can not create album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "USER_IS_NOT_MEMBER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "UserIsNotMember";
        readonly value: "USER_IS_NOT_MEMBER";
        readonly display: "User is not member";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_AUTHORIZED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotAuthorized";
        readonly value: "MEDIA_ITEM_NOT_AUTHORIZED";
        readonly display: "Media item not authorized";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "INVALID_MEDIA_ASSET_KIND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidMediaAssetKind";
        readonly value: "INVALID_MEDIA_ASSET_KIND";
        readonly display: "Invalid media variant";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "CAN_NOT_GRANT_SHARE_TO_OWNER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "CanNotGrantShareToOwner";
        readonly value: "CAN_NOT_GRANT_SHARE_TO_OWNER";
        readonly display: "Cannot grant share to owner";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "EXPIRE_DATE_CANNOT_BE_IN_PAST";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "ExpireDateCannotBeInPast";
        readonly value: "EXPIRE_DATE_CANNOT_BE_IN_PAST";
        readonly display: "Expire date cannot be in past, revoke instead";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "CANNOT_UPDATE_EXPIRED_DATE_IF_REVOKED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "CannotUpdateExpiredDateIfRevoked";
        readonly value: "CANNOT_UPDATE_EXPIRED_DATE_IF_REVOKED";
        readonly display: "Cannot update expire date if revoked";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "CANNOT_REVOKE_SHARE_IF_ALREADY_EXPIRED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "CannotRevokeShareIfAlreadyExpired";
        readonly value: "CANNOT_REVOKE_SHARE_IF_ALREADY_EXPIRED";
        readonly display: "Cannot revoke share if already expired";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "SHARE_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "ShareNotFound";
        readonly value: "SHARE_NOT_FOUND";
        readonly display: "Share not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "SHARE_MUST_HAVE_EITHER_GRANTED_TO_USER_ID_OR_TOKEN";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "ShareMustHaveEitherGrantedToUserIdOrToken";
        readonly value: "SHARE_MUST_HAVE_EITHER_GRANTED_TO_USER_ID_OR_TOKEN";
        readonly display: "Share must have either granted to user id or token";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "SHARE_MUST_NOT_HAVE_GRANTED_TO_USER_ID_AND_TOKEN";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "ShareMustNotHaveGrantedToUserIdAndToken";
        readonly value: "SHARE_MUST_NOT_HAVE_GRANTED_TO_USER_ID_AND_TOKEN";
        readonly display: "Share must not have granted to user id and token";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "USER_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "user";
            readonly value: "USER";
            readonly display: "User";
        };
        readonly retryable: false;
    } & {
        readonly key: "UserNotFound";
        readonly value: "USER_NOT_FOUND";
        readonly display: "User not found";
    });
    tryFromValue(value?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_ADD_MEDIA_EMPTY_MEDIA_LIST";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AddMediaToAlbumEmptyMediaList";
        readonly value: "ADD_MEDIA_TO_ALBUM_EMPTY_MEDIA_LIST";
        readonly display: "At least one media item is required";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_ADD_MEDIA_INVALID_TARGET";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AddMediaToAlbumInvalidTarget";
        readonly value: "ADD_MEDIA_TO_ALBUM_INVALID_TARGET";
        readonly display: "Provide either an existing album or a new album, not both and not neither";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AlbumNotFound";
        readonly value: "ALBUM_NOT_FOUND";
        readonly display: "Album not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_INVALID_ITEM_ORDER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidAlbumItemOrder";
        readonly value: "INVALID_ALBUM_ITEM_ORDER";
        readonly display: "Album item order is invalid";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_EDIT_COVER_FORBIDDEN";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AlbumEditCoverForbidden";
        readonly value: "ALBUM_EDIT_COVER_FORBIDDEN";
        readonly display: "Album edit cover forbidden";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_VIEW_FORBIDDEN";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AlbumViewForbidden";
        readonly value: "ALBUM_VIEW_FORBIDDEN";
        readonly display: "Album view forbidden";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ASSET_KIND_ALREADY_EXISTS";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "AssetKindAlreadyExists";
        readonly value: "ASSET_KIND_ALREADY_EXISTS";
        readonly display: "Asset kind already exists";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ASSET_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "AssetNotFound";
        readonly value: "ASSET_NOT_FOUND";
        readonly display: "Asset not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ASSET_NOT_PENDING";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "AssetNotPending";
        readonly value: "ASSET_NOT_PENDING";
        readonly display: "Asset is not pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_COVER_MEDIA_NOT_PART_OF_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "CoverMediaNotPartOfAlbum";
        readonly value: "COVER_MEDIA_NOT_PART_OF_ALBUM";
        readonly display: "Cover media not part of album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_DELETE_ITEMS_NO_IDS";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "DeleteAlbumItemsNoItemIds";
        readonly value: "DELETE_ALBUM_ITEMS_NO_ITEM_IDS";
        readonly display: "At least one album item is required to remove";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_DELETE_ITEMS_EMPTY_LIST";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "DeleteMediaItemsEmptyList";
        readonly value: "DELETE_MEDIA_ITEMS_EMPTY_LIST";
        readonly display: "At least one media item is required to delete";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_INVALID_DIMENSIONS";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidMediaDimensions";
        readonly value: "INVALID_MEDIA_DIMENSIONS";
        readonly display: "Media dimensions must be positive integers";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_INVALID_TAKEN_AT";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidMediaTakenAt";
        readonly value: "INVALID_MEDIA_TAKEN_AT";
        readonly display: "Taken at is not a valid date/time";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_INVALID_TAGS";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidMediaItemTags";
        readonly value: "INVALID_MEDIA_ITEM_TAGS";
        readonly display: "Media item tags are invalid";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_MEDIA_ALREADY_IN_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaAlreadyInAlbum";
        readonly value: "MEDIA_ALREADY_IN_ALBUM";
        readonly display: "Media already in album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_BYTES_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaBytesNotFound";
        readonly value: "MEDIA_BYTES_NOT_FOUND";
        readonly display: "Media bytes not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_DIMENSIONS_NOT_AVAILABLE";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: true;
    } & {
        readonly key: "MediaDimensionsNotAvailable";
        readonly value: "MEDIA_DIMENSIONS_NOT_AVAILABLE";
        readonly display: "Could not read media width and height from the uploaded file";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotFound";
        readonly value: "MEDIA_ITEM_NOT_FOUND";
        readonly display: "Media item not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEMS_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemsNotFound";
        readonly value: "MEDIA_ITEMS_NOT_FOUND";
        readonly display: "Media items not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_IN_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotInAlbum";
        readonly value: "MEDIA_ITEM_NOT_IN_ALBUM";
        readonly display: "Media item not in album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_OWNED_BY_VIEWER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotOwnedByViewer";
        readonly value: "MEDIA_ITEM_NOT_OWNED_BY_VIEWER";
        readonly display: "Media item not owned by viewer";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_UPDATE_NO_FIELDS_PROVIDED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemUpdateNoFieldsProvided";
        readonly value: "MEDIA_ITEM_UPDATE_NO_FIELDS_PROVIDED";
        readonly display: "No fields provided to update";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_READY";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotReady";
        readonly value: "MEDIA_ITEM_NOT_READY";
        readonly display: "Media item not ready";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEMBER_NOT_ALLOWED_TO_ADD_ITEM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MemberNotAllowedToAddItem";
        readonly value: "MEMBER_NOT_ALLOWED_TO_ADD_ITEM";
        readonly display: "Member not allowed to add item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEMBER_NOT_ALLOWED_TO_DELETE_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MemberNotAllowedToDeleteAlbum";
        readonly value: "MEMBER_NOT_ALLOWED_TO_DELETE_ALBUM";
        readonly display: "Member not allowed to delete album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEMBER_NOT_ALLOWED_TO_DELETE_ITEM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MemberNotAllowedToDeleteItem";
        readonly value: "MEMBER_NOT_ALLOWED_TO_DELETE_ITEM";
        readonly display: "Member not allowed to delete item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEMBER_NOT_ALLOWED_TO_EDIT_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MemberNotAllowedToEditAlbum";
        readonly value: "MEMBER_NOT_ALLOWED_TO_EDIT_ALBUM";
        readonly display: "Member not allowed to edit album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_STATUS_NOT_PENDING";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "StatusNotPending";
        readonly value: "STATUS_NOT_PENDING";
        readonly display: "Media item status is not pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_STATUS_NOT_UPLOADED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "StatusNotUploaded";
        readonly value: "STATUS_NOT_UPLOADED";
        readonly display: "Media item is not awaiting derivative processing";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_USER_ALREADY_MEMBER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "UserAlreadyMember";
        readonly value: "USER_ALREADY_MEMBER";
        readonly display: "User already member";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "USER_CAN_NOT_CREATE_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "UserCanNotCreateAlbum";
        readonly value: "USER_CAN_NOT_CREATE_ALBUM";
        readonly display: "User can not create album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "USER_IS_NOT_MEMBER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "UserIsNotMember";
        readonly value: "USER_IS_NOT_MEMBER";
        readonly display: "User is not member";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_AUTHORIZED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotAuthorized";
        readonly value: "MEDIA_ITEM_NOT_AUTHORIZED";
        readonly display: "Media item not authorized";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "INVALID_MEDIA_ASSET_KIND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidMediaAssetKind";
        readonly value: "INVALID_MEDIA_ASSET_KIND";
        readonly display: "Invalid media variant";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "CAN_NOT_GRANT_SHARE_TO_OWNER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "CanNotGrantShareToOwner";
        readonly value: "CAN_NOT_GRANT_SHARE_TO_OWNER";
        readonly display: "Cannot grant share to owner";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "EXPIRE_DATE_CANNOT_BE_IN_PAST";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "ExpireDateCannotBeInPast";
        readonly value: "EXPIRE_DATE_CANNOT_BE_IN_PAST";
        readonly display: "Expire date cannot be in past, revoke instead";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "CANNOT_UPDATE_EXPIRED_DATE_IF_REVOKED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "CannotUpdateExpiredDateIfRevoked";
        readonly value: "CANNOT_UPDATE_EXPIRED_DATE_IF_REVOKED";
        readonly display: "Cannot update expire date if revoked";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "CANNOT_REVOKE_SHARE_IF_ALREADY_EXPIRED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "CannotRevokeShareIfAlreadyExpired";
        readonly value: "CANNOT_REVOKE_SHARE_IF_ALREADY_EXPIRED";
        readonly display: "Cannot revoke share if already expired";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "SHARE_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "ShareNotFound";
        readonly value: "SHARE_NOT_FOUND";
        readonly display: "Share not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "SHARE_MUST_HAVE_EITHER_GRANTED_TO_USER_ID_OR_TOKEN";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "ShareMustHaveEitherGrantedToUserIdOrToken";
        readonly value: "SHARE_MUST_HAVE_EITHER_GRANTED_TO_USER_ID_OR_TOKEN";
        readonly display: "Share must have either granted to user id or token";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "SHARE_MUST_NOT_HAVE_GRANTED_TO_USER_ID_AND_TOKEN";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "ShareMustNotHaveGrantedToUserIdAndToken";
        readonly value: "SHARE_MUST_NOT_HAVE_GRANTED_TO_USER_ID_AND_TOKEN";
        readonly display: "Share must not have granted to user id and token";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "USER_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "user";
            readonly value: "USER";
            readonly display: "User";
        };
        readonly retryable: false;
    } & {
        readonly key: "UserNotFound";
        readonly value: "USER_NOT_FOUND";
        readonly display: "User not found";
    })) | undefined;
    fromKey(key: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_ADD_MEDIA_EMPTY_MEDIA_LIST";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AddMediaToAlbumEmptyMediaList";
        readonly value: "ADD_MEDIA_TO_ALBUM_EMPTY_MEDIA_LIST";
        readonly display: "At least one media item is required";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_ADD_MEDIA_INVALID_TARGET";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AddMediaToAlbumInvalidTarget";
        readonly value: "ADD_MEDIA_TO_ALBUM_INVALID_TARGET";
        readonly display: "Provide either an existing album or a new album, not both and not neither";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AlbumNotFound";
        readonly value: "ALBUM_NOT_FOUND";
        readonly display: "Album not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_INVALID_ITEM_ORDER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidAlbumItemOrder";
        readonly value: "INVALID_ALBUM_ITEM_ORDER";
        readonly display: "Album item order is invalid";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_EDIT_COVER_FORBIDDEN";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AlbumEditCoverForbidden";
        readonly value: "ALBUM_EDIT_COVER_FORBIDDEN";
        readonly display: "Album edit cover forbidden";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_VIEW_FORBIDDEN";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AlbumViewForbidden";
        readonly value: "ALBUM_VIEW_FORBIDDEN";
        readonly display: "Album view forbidden";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ASSET_KIND_ALREADY_EXISTS";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "AssetKindAlreadyExists";
        readonly value: "ASSET_KIND_ALREADY_EXISTS";
        readonly display: "Asset kind already exists";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ASSET_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "AssetNotFound";
        readonly value: "ASSET_NOT_FOUND";
        readonly display: "Asset not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ASSET_NOT_PENDING";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "AssetNotPending";
        readonly value: "ASSET_NOT_PENDING";
        readonly display: "Asset is not pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_COVER_MEDIA_NOT_PART_OF_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "CoverMediaNotPartOfAlbum";
        readonly value: "COVER_MEDIA_NOT_PART_OF_ALBUM";
        readonly display: "Cover media not part of album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_DELETE_ITEMS_NO_IDS";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "DeleteAlbumItemsNoItemIds";
        readonly value: "DELETE_ALBUM_ITEMS_NO_ITEM_IDS";
        readonly display: "At least one album item is required to remove";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_DELETE_ITEMS_EMPTY_LIST";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "DeleteMediaItemsEmptyList";
        readonly value: "DELETE_MEDIA_ITEMS_EMPTY_LIST";
        readonly display: "At least one media item is required to delete";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_INVALID_DIMENSIONS";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidMediaDimensions";
        readonly value: "INVALID_MEDIA_DIMENSIONS";
        readonly display: "Media dimensions must be positive integers";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_INVALID_TAKEN_AT";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidMediaTakenAt";
        readonly value: "INVALID_MEDIA_TAKEN_AT";
        readonly display: "Taken at is not a valid date/time";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_INVALID_TAGS";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidMediaItemTags";
        readonly value: "INVALID_MEDIA_ITEM_TAGS";
        readonly display: "Media item tags are invalid";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_MEDIA_ALREADY_IN_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaAlreadyInAlbum";
        readonly value: "MEDIA_ALREADY_IN_ALBUM";
        readonly display: "Media already in album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_BYTES_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaBytesNotFound";
        readonly value: "MEDIA_BYTES_NOT_FOUND";
        readonly display: "Media bytes not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_DIMENSIONS_NOT_AVAILABLE";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: true;
    } & {
        readonly key: "MediaDimensionsNotAvailable";
        readonly value: "MEDIA_DIMENSIONS_NOT_AVAILABLE";
        readonly display: "Could not read media width and height from the uploaded file";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotFound";
        readonly value: "MEDIA_ITEM_NOT_FOUND";
        readonly display: "Media item not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEMS_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemsNotFound";
        readonly value: "MEDIA_ITEMS_NOT_FOUND";
        readonly display: "Media items not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_IN_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotInAlbum";
        readonly value: "MEDIA_ITEM_NOT_IN_ALBUM";
        readonly display: "Media item not in album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_OWNED_BY_VIEWER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotOwnedByViewer";
        readonly value: "MEDIA_ITEM_NOT_OWNED_BY_VIEWER";
        readonly display: "Media item not owned by viewer";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_UPDATE_NO_FIELDS_PROVIDED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemUpdateNoFieldsProvided";
        readonly value: "MEDIA_ITEM_UPDATE_NO_FIELDS_PROVIDED";
        readonly display: "No fields provided to update";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_READY";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotReady";
        readonly value: "MEDIA_ITEM_NOT_READY";
        readonly display: "Media item not ready";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEMBER_NOT_ALLOWED_TO_ADD_ITEM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MemberNotAllowedToAddItem";
        readonly value: "MEMBER_NOT_ALLOWED_TO_ADD_ITEM";
        readonly display: "Member not allowed to add item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEMBER_NOT_ALLOWED_TO_DELETE_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MemberNotAllowedToDeleteAlbum";
        readonly value: "MEMBER_NOT_ALLOWED_TO_DELETE_ALBUM";
        readonly display: "Member not allowed to delete album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEMBER_NOT_ALLOWED_TO_DELETE_ITEM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MemberNotAllowedToDeleteItem";
        readonly value: "MEMBER_NOT_ALLOWED_TO_DELETE_ITEM";
        readonly display: "Member not allowed to delete item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEMBER_NOT_ALLOWED_TO_EDIT_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MemberNotAllowedToEditAlbum";
        readonly value: "MEMBER_NOT_ALLOWED_TO_EDIT_ALBUM";
        readonly display: "Member not allowed to edit album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_STATUS_NOT_PENDING";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "StatusNotPending";
        readonly value: "STATUS_NOT_PENDING";
        readonly display: "Media item status is not pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_STATUS_NOT_UPLOADED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "StatusNotUploaded";
        readonly value: "STATUS_NOT_UPLOADED";
        readonly display: "Media item is not awaiting derivative processing";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_USER_ALREADY_MEMBER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "UserAlreadyMember";
        readonly value: "USER_ALREADY_MEMBER";
        readonly display: "User already member";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "USER_CAN_NOT_CREATE_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "UserCanNotCreateAlbum";
        readonly value: "USER_CAN_NOT_CREATE_ALBUM";
        readonly display: "User can not create album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "USER_IS_NOT_MEMBER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "UserIsNotMember";
        readonly value: "USER_IS_NOT_MEMBER";
        readonly display: "User is not member";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_AUTHORIZED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotAuthorized";
        readonly value: "MEDIA_ITEM_NOT_AUTHORIZED";
        readonly display: "Media item not authorized";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "INVALID_MEDIA_ASSET_KIND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidMediaAssetKind";
        readonly value: "INVALID_MEDIA_ASSET_KIND";
        readonly display: "Invalid media variant";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "CAN_NOT_GRANT_SHARE_TO_OWNER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "CanNotGrantShareToOwner";
        readonly value: "CAN_NOT_GRANT_SHARE_TO_OWNER";
        readonly display: "Cannot grant share to owner";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "EXPIRE_DATE_CANNOT_BE_IN_PAST";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "ExpireDateCannotBeInPast";
        readonly value: "EXPIRE_DATE_CANNOT_BE_IN_PAST";
        readonly display: "Expire date cannot be in past, revoke instead";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "CANNOT_UPDATE_EXPIRED_DATE_IF_REVOKED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "CannotUpdateExpiredDateIfRevoked";
        readonly value: "CANNOT_UPDATE_EXPIRED_DATE_IF_REVOKED";
        readonly display: "Cannot update expire date if revoked";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "CANNOT_REVOKE_SHARE_IF_ALREADY_EXPIRED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "CannotRevokeShareIfAlreadyExpired";
        readonly value: "CANNOT_REVOKE_SHARE_IF_ALREADY_EXPIRED";
        readonly display: "Cannot revoke share if already expired";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "SHARE_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "ShareNotFound";
        readonly value: "SHARE_NOT_FOUND";
        readonly display: "Share not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "SHARE_MUST_HAVE_EITHER_GRANTED_TO_USER_ID_OR_TOKEN";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "ShareMustHaveEitherGrantedToUserIdOrToken";
        readonly value: "SHARE_MUST_HAVE_EITHER_GRANTED_TO_USER_ID_OR_TOKEN";
        readonly display: "Share must have either granted to user id or token";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "SHARE_MUST_NOT_HAVE_GRANTED_TO_USER_ID_AND_TOKEN";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "ShareMustNotHaveGrantedToUserIdAndToken";
        readonly value: "SHARE_MUST_NOT_HAVE_GRANTED_TO_USER_ID_AND_TOKEN";
        readonly display: "Share must not have granted to user id and token";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "USER_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "user";
            readonly value: "USER";
            readonly display: "User";
        };
        readonly retryable: false;
    } & {
        readonly key: "UserNotFound";
        readonly value: "USER_NOT_FOUND";
        readonly display: "User not found";
    });
    tryFromKey(key?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_ADD_MEDIA_EMPTY_MEDIA_LIST";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AddMediaToAlbumEmptyMediaList";
        readonly value: "ADD_MEDIA_TO_ALBUM_EMPTY_MEDIA_LIST";
        readonly display: "At least one media item is required";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_ADD_MEDIA_INVALID_TARGET";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AddMediaToAlbumInvalidTarget";
        readonly value: "ADD_MEDIA_TO_ALBUM_INVALID_TARGET";
        readonly display: "Provide either an existing album or a new album, not both and not neither";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AlbumNotFound";
        readonly value: "ALBUM_NOT_FOUND";
        readonly display: "Album not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_INVALID_ITEM_ORDER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidAlbumItemOrder";
        readonly value: "INVALID_ALBUM_ITEM_ORDER";
        readonly display: "Album item order is invalid";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_EDIT_COVER_FORBIDDEN";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AlbumEditCoverForbidden";
        readonly value: "ALBUM_EDIT_COVER_FORBIDDEN";
        readonly display: "Album edit cover forbidden";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_VIEW_FORBIDDEN";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AlbumViewForbidden";
        readonly value: "ALBUM_VIEW_FORBIDDEN";
        readonly display: "Album view forbidden";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ASSET_KIND_ALREADY_EXISTS";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "AssetKindAlreadyExists";
        readonly value: "ASSET_KIND_ALREADY_EXISTS";
        readonly display: "Asset kind already exists";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ASSET_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "AssetNotFound";
        readonly value: "ASSET_NOT_FOUND";
        readonly display: "Asset not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ASSET_NOT_PENDING";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "AssetNotPending";
        readonly value: "ASSET_NOT_PENDING";
        readonly display: "Asset is not pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_COVER_MEDIA_NOT_PART_OF_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "CoverMediaNotPartOfAlbum";
        readonly value: "COVER_MEDIA_NOT_PART_OF_ALBUM";
        readonly display: "Cover media not part of album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_DELETE_ITEMS_NO_IDS";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "DeleteAlbumItemsNoItemIds";
        readonly value: "DELETE_ALBUM_ITEMS_NO_ITEM_IDS";
        readonly display: "At least one album item is required to remove";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_DELETE_ITEMS_EMPTY_LIST";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "DeleteMediaItemsEmptyList";
        readonly value: "DELETE_MEDIA_ITEMS_EMPTY_LIST";
        readonly display: "At least one media item is required to delete";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_INVALID_DIMENSIONS";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidMediaDimensions";
        readonly value: "INVALID_MEDIA_DIMENSIONS";
        readonly display: "Media dimensions must be positive integers";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_INVALID_TAKEN_AT";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidMediaTakenAt";
        readonly value: "INVALID_MEDIA_TAKEN_AT";
        readonly display: "Taken at is not a valid date/time";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_INVALID_TAGS";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidMediaItemTags";
        readonly value: "INVALID_MEDIA_ITEM_TAGS";
        readonly display: "Media item tags are invalid";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_MEDIA_ALREADY_IN_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaAlreadyInAlbum";
        readonly value: "MEDIA_ALREADY_IN_ALBUM";
        readonly display: "Media already in album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_BYTES_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaBytesNotFound";
        readonly value: "MEDIA_BYTES_NOT_FOUND";
        readonly display: "Media bytes not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_DIMENSIONS_NOT_AVAILABLE";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: true;
    } & {
        readonly key: "MediaDimensionsNotAvailable";
        readonly value: "MEDIA_DIMENSIONS_NOT_AVAILABLE";
        readonly display: "Could not read media width and height from the uploaded file";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotFound";
        readonly value: "MEDIA_ITEM_NOT_FOUND";
        readonly display: "Media item not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEMS_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemsNotFound";
        readonly value: "MEDIA_ITEMS_NOT_FOUND";
        readonly display: "Media items not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_IN_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotInAlbum";
        readonly value: "MEDIA_ITEM_NOT_IN_ALBUM";
        readonly display: "Media item not in album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_OWNED_BY_VIEWER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotOwnedByViewer";
        readonly value: "MEDIA_ITEM_NOT_OWNED_BY_VIEWER";
        readonly display: "Media item not owned by viewer";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_UPDATE_NO_FIELDS_PROVIDED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemUpdateNoFieldsProvided";
        readonly value: "MEDIA_ITEM_UPDATE_NO_FIELDS_PROVIDED";
        readonly display: "No fields provided to update";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_READY";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotReady";
        readonly value: "MEDIA_ITEM_NOT_READY";
        readonly display: "Media item not ready";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEMBER_NOT_ALLOWED_TO_ADD_ITEM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MemberNotAllowedToAddItem";
        readonly value: "MEMBER_NOT_ALLOWED_TO_ADD_ITEM";
        readonly display: "Member not allowed to add item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEMBER_NOT_ALLOWED_TO_DELETE_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MemberNotAllowedToDeleteAlbum";
        readonly value: "MEMBER_NOT_ALLOWED_TO_DELETE_ALBUM";
        readonly display: "Member not allowed to delete album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEMBER_NOT_ALLOWED_TO_DELETE_ITEM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MemberNotAllowedToDeleteItem";
        readonly value: "MEMBER_NOT_ALLOWED_TO_DELETE_ITEM";
        readonly display: "Member not allowed to delete item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEMBER_NOT_ALLOWED_TO_EDIT_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MemberNotAllowedToEditAlbum";
        readonly value: "MEMBER_NOT_ALLOWED_TO_EDIT_ALBUM";
        readonly display: "Member not allowed to edit album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_STATUS_NOT_PENDING";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "StatusNotPending";
        readonly value: "STATUS_NOT_PENDING";
        readonly display: "Media item status is not pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_STATUS_NOT_UPLOADED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "StatusNotUploaded";
        readonly value: "STATUS_NOT_UPLOADED";
        readonly display: "Media item is not awaiting derivative processing";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_USER_ALREADY_MEMBER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "UserAlreadyMember";
        readonly value: "USER_ALREADY_MEMBER";
        readonly display: "User already member";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "USER_CAN_NOT_CREATE_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "UserCanNotCreateAlbum";
        readonly value: "USER_CAN_NOT_CREATE_ALBUM";
        readonly display: "User can not create album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "USER_IS_NOT_MEMBER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "UserIsNotMember";
        readonly value: "USER_IS_NOT_MEMBER";
        readonly display: "User is not member";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_AUTHORIZED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotAuthorized";
        readonly value: "MEDIA_ITEM_NOT_AUTHORIZED";
        readonly display: "Media item not authorized";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "INVALID_MEDIA_ASSET_KIND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidMediaAssetKind";
        readonly value: "INVALID_MEDIA_ASSET_KIND";
        readonly display: "Invalid media variant";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "CAN_NOT_GRANT_SHARE_TO_OWNER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "CanNotGrantShareToOwner";
        readonly value: "CAN_NOT_GRANT_SHARE_TO_OWNER";
        readonly display: "Cannot grant share to owner";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "EXPIRE_DATE_CANNOT_BE_IN_PAST";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "ExpireDateCannotBeInPast";
        readonly value: "EXPIRE_DATE_CANNOT_BE_IN_PAST";
        readonly display: "Expire date cannot be in past, revoke instead";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "CANNOT_UPDATE_EXPIRED_DATE_IF_REVOKED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "CannotUpdateExpiredDateIfRevoked";
        readonly value: "CANNOT_UPDATE_EXPIRED_DATE_IF_REVOKED";
        readonly display: "Cannot update expire date if revoked";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "CANNOT_REVOKE_SHARE_IF_ALREADY_EXPIRED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "CannotRevokeShareIfAlreadyExpired";
        readonly value: "CANNOT_REVOKE_SHARE_IF_ALREADY_EXPIRED";
        readonly display: "Cannot revoke share if already expired";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "SHARE_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "ShareNotFound";
        readonly value: "SHARE_NOT_FOUND";
        readonly display: "Share not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "SHARE_MUST_HAVE_EITHER_GRANTED_TO_USER_ID_OR_TOKEN";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "ShareMustHaveEitherGrantedToUserIdOrToken";
        readonly value: "SHARE_MUST_HAVE_EITHER_GRANTED_TO_USER_ID_OR_TOKEN";
        readonly display: "Share must have either granted to user id or token";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "SHARE_MUST_NOT_HAVE_GRANTED_TO_USER_ID_AND_TOKEN";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "ShareMustNotHaveGrantedToUserIdAndToken";
        readonly value: "SHARE_MUST_NOT_HAVE_GRANTED_TO_USER_ID_AND_TOKEN";
        readonly display: "Share must not have granted to user id and token";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "USER_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "user";
            readonly value: "USER";
            readonly display: "User";
        };
        readonly retryable: false;
    } & {
        readonly key: "UserNotFound";
        readonly value: "USER_NOT_FOUND";
        readonly display: "User not found";
    })) | undefined;
    items(): readonly ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_ADD_MEDIA_EMPTY_MEDIA_LIST";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AddMediaToAlbumEmptyMediaList";
        readonly value: "ADD_MEDIA_TO_ALBUM_EMPTY_MEDIA_LIST";
        readonly display: "At least one media item is required";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_ADD_MEDIA_INVALID_TARGET";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AddMediaToAlbumInvalidTarget";
        readonly value: "ADD_MEDIA_TO_ALBUM_INVALID_TARGET";
        readonly display: "Provide either an existing album or a new album, not both and not neither";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AlbumNotFound";
        readonly value: "ALBUM_NOT_FOUND";
        readonly display: "Album not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_INVALID_ITEM_ORDER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidAlbumItemOrder";
        readonly value: "INVALID_ALBUM_ITEM_ORDER";
        readonly display: "Album item order is invalid";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_EDIT_COVER_FORBIDDEN";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AlbumEditCoverForbidden";
        readonly value: "ALBUM_EDIT_COVER_FORBIDDEN";
        readonly display: "Album edit cover forbidden";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_VIEW_FORBIDDEN";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "AlbumViewForbidden";
        readonly value: "ALBUM_VIEW_FORBIDDEN";
        readonly display: "Album view forbidden";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ASSET_KIND_ALREADY_EXISTS";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "AssetKindAlreadyExists";
        readonly value: "ASSET_KIND_ALREADY_EXISTS";
        readonly display: "Asset kind already exists";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ASSET_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "AssetNotFound";
        readonly value: "ASSET_NOT_FOUND";
        readonly display: "Asset not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ASSET_NOT_PENDING";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "AssetNotPending";
        readonly value: "ASSET_NOT_PENDING";
        readonly display: "Asset is not pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_COVER_MEDIA_NOT_PART_OF_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "CoverMediaNotPartOfAlbum";
        readonly value: "COVER_MEDIA_NOT_PART_OF_ALBUM";
        readonly display: "Cover media not part of album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_DELETE_ITEMS_NO_IDS";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "DeleteAlbumItemsNoItemIds";
        readonly value: "DELETE_ALBUM_ITEMS_NO_ITEM_IDS";
        readonly display: "At least one album item is required to remove";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_DELETE_ITEMS_EMPTY_LIST";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "DeleteMediaItemsEmptyList";
        readonly value: "DELETE_MEDIA_ITEMS_EMPTY_LIST";
        readonly display: "At least one media item is required to delete";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_INVALID_DIMENSIONS";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidMediaDimensions";
        readonly value: "INVALID_MEDIA_DIMENSIONS";
        readonly display: "Media dimensions must be positive integers";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_INVALID_TAKEN_AT";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidMediaTakenAt";
        readonly value: "INVALID_MEDIA_TAKEN_AT";
        readonly display: "Taken at is not a valid date/time";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_INVALID_TAGS";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidMediaItemTags";
        readonly value: "INVALID_MEDIA_ITEM_TAGS";
        readonly display: "Media item tags are invalid";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_MEDIA_ALREADY_IN_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaAlreadyInAlbum";
        readonly value: "MEDIA_ALREADY_IN_ALBUM";
        readonly display: "Media already in album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_BYTES_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaBytesNotFound";
        readonly value: "MEDIA_BYTES_NOT_FOUND";
        readonly display: "Media bytes not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_DIMENSIONS_NOT_AVAILABLE";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: true;
    } & {
        readonly key: "MediaDimensionsNotAvailable";
        readonly value: "MEDIA_DIMENSIONS_NOT_AVAILABLE";
        readonly display: "Could not read media width and height from the uploaded file";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotFound";
        readonly value: "MEDIA_ITEM_NOT_FOUND";
        readonly display: "Media item not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEMS_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemsNotFound";
        readonly value: "MEDIA_ITEMS_NOT_FOUND";
        readonly display: "Media items not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_IN_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotInAlbum";
        readonly value: "MEDIA_ITEM_NOT_IN_ALBUM";
        readonly display: "Media item not in album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_OWNED_BY_VIEWER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotOwnedByViewer";
        readonly value: "MEDIA_ITEM_NOT_OWNED_BY_VIEWER";
        readonly display: "Media item not owned by viewer";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_UPDATE_NO_FIELDS_PROVIDED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemUpdateNoFieldsProvided";
        readonly value: "MEDIA_ITEM_UPDATE_NO_FIELDS_PROVIDED";
        readonly display: "No fields provided to update";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_READY";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotReady";
        readonly value: "MEDIA_ITEM_NOT_READY";
        readonly display: "Media item not ready";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEMBER_NOT_ALLOWED_TO_ADD_ITEM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MemberNotAllowedToAddItem";
        readonly value: "MEMBER_NOT_ALLOWED_TO_ADD_ITEM";
        readonly display: "Member not allowed to add item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEMBER_NOT_ALLOWED_TO_DELETE_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MemberNotAllowedToDeleteAlbum";
        readonly value: "MEMBER_NOT_ALLOWED_TO_DELETE_ALBUM";
        readonly display: "Member not allowed to delete album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEMBER_NOT_ALLOWED_TO_DELETE_ITEM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MemberNotAllowedToDeleteItem";
        readonly value: "MEMBER_NOT_ALLOWED_TO_DELETE_ITEM";
        readonly display: "Member not allowed to delete item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEMBER_NOT_ALLOWED_TO_EDIT_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "MemberNotAllowedToEditAlbum";
        readonly value: "MEMBER_NOT_ALLOWED_TO_EDIT_ALBUM";
        readonly display: "Member not allowed to edit album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_STATUS_NOT_PENDING";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "StatusNotPending";
        readonly value: "STATUS_NOT_PENDING";
        readonly display: "Media item status is not pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_STATUS_NOT_UPLOADED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "StatusNotUploaded";
        readonly value: "STATUS_NOT_UPLOADED";
        readonly display: "Media item is not awaiting derivative processing";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "ALBUM_USER_ALREADY_MEMBER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "UserAlreadyMember";
        readonly value: "USER_ALREADY_MEMBER";
        readonly display: "User already member";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "USER_CAN_NOT_CREATE_ALBUM";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "UserCanNotCreateAlbum";
        readonly value: "USER_CAN_NOT_CREATE_ALBUM";
        readonly display: "User can not create album";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "USER_IS_NOT_MEMBER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "album";
            readonly value: "ALBUM";
            readonly display: "Album";
        };
        readonly retryable: false;
    } & {
        readonly key: "UserIsNotMember";
        readonly value: "USER_IS_NOT_MEMBER";
        readonly display: "User is not member";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "MEDIA_ITEM_NOT_AUTHORIZED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "MediaItemNotAuthorized";
        readonly value: "MEDIA_ITEM_NOT_AUTHORIZED";
        readonly display: "Media item not authorized";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "INVALID_MEDIA_ASSET_KIND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "mediaItem";
            readonly value: "MEDIA_ITEM";
            readonly display: "Media Item";
        };
        readonly retryable: false;
    } & {
        readonly key: "InvalidMediaAssetKind";
        readonly value: "INVALID_MEDIA_ASSET_KIND";
        readonly display: "Invalid media variant";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "CAN_NOT_GRANT_SHARE_TO_OWNER";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "auth";
            readonly value: "AUTH";
            readonly display: "Auth";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "CanNotGrantShareToOwner";
        readonly value: "CAN_NOT_GRANT_SHARE_TO_OWNER";
        readonly display: "Cannot grant share to owner";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "EXPIRE_DATE_CANNOT_BE_IN_PAST";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "ExpireDateCannotBeInPast";
        readonly value: "EXPIRE_DATE_CANNOT_BE_IN_PAST";
        readonly display: "Expire date cannot be in past, revoke instead";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "CANNOT_UPDATE_EXPIRED_DATE_IF_REVOKED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "CannotUpdateExpiredDateIfRevoked";
        readonly value: "CANNOT_UPDATE_EXPIRED_DATE_IF_REVOKED";
        readonly display: "Cannot update expire date if revoked";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "CANNOT_REVOKE_SHARE_IF_ALREADY_EXPIRED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "CannotRevokeShareIfAlreadyExpired";
        readonly value: "CANNOT_REVOKE_SHARE_IF_ALREADY_EXPIRED";
        readonly display: "Cannot revoke share if already expired";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "SHARE_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "ShareNotFound";
        readonly value: "SHARE_NOT_FOUND";
        readonly display: "Share not found";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "SHARE_MUST_HAVE_EITHER_GRANTED_TO_USER_ID_OR_TOKEN";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "ShareMustHaveEitherGrantedToUserIdOrToken";
        readonly value: "SHARE_MUST_HAVE_EITHER_GRANTED_TO_USER_ID_OR_TOKEN";
        readonly display: "Share must have either granted to user id or token";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "SHARE_MUST_NOT_HAVE_GRANTED_TO_USER_ID_AND_TOKEN";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "share";
            readonly value: "SHARE";
            readonly display: "Share";
        };
        readonly retryable: false;
    } & {
        readonly key: "ShareMustNotHaveGrantedToUserIdAndToken";
        readonly value: "SHARE_MUST_NOT_HAVE_GRANTED_TO_USER_ID_AND_TOKEN";
        readonly display: "Share must not have granted to user id and token";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "USER_NOT_FOUND";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "domain";
            readonly value: "DOMAIN";
            readonly display: "Domain";
        };
        readonly area: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "user";
            readonly value: "USER";
            readonly display: "User";
        };
        readonly retryable: false;
    } & {
        readonly key: "UserNotFound";
        readonly value: "USER_NOT_FOUND";
        readonly display: "User not found";
    }))[];
    values(): readonly ("ALBUM_NOT_FOUND" | "ALBUM_EDIT_COVER_FORBIDDEN" | "ALBUM_VIEW_FORBIDDEN" | "ASSET_KIND_ALREADY_EXISTS" | "ASSET_NOT_FOUND" | "ASSET_NOT_PENDING" | "MEDIA_BYTES_NOT_FOUND" | "MEDIA_DIMENSIONS_NOT_AVAILABLE" | "MEDIA_ITEM_NOT_FOUND" | "MEDIA_ITEMS_NOT_FOUND" | "MEDIA_ITEM_NOT_IN_ALBUM" | "MEDIA_ITEM_NOT_OWNED_BY_VIEWER" | "MEDIA_ITEM_UPDATE_NO_FIELDS_PROVIDED" | "MEDIA_ITEM_NOT_READY" | "MEMBER_NOT_ALLOWED_TO_ADD_ITEM" | "MEMBER_NOT_ALLOWED_TO_DELETE_ALBUM" | "MEMBER_NOT_ALLOWED_TO_DELETE_ITEM" | "MEMBER_NOT_ALLOWED_TO_EDIT_ALBUM" | "USER_CAN_NOT_CREATE_ALBUM" | "USER_IS_NOT_MEMBER" | "MEDIA_ITEM_NOT_AUTHORIZED" | "INVALID_MEDIA_ASSET_KIND" | "CAN_NOT_GRANT_SHARE_TO_OWNER" | "EXPIRE_DATE_CANNOT_BE_IN_PAST" | "CANNOT_UPDATE_EXPIRED_DATE_IF_REVOKED" | "CANNOT_REVOKE_SHARE_IF_ALREADY_EXPIRED" | "SHARE_NOT_FOUND" | "SHARE_MUST_HAVE_EITHER_GRANTED_TO_USER_ID_OR_TOKEN" | "SHARE_MUST_NOT_HAVE_GRANTED_TO_USER_ID_AND_TOKEN" | "USER_NOT_FOUND" | "ADD_MEDIA_TO_ALBUM_EMPTY_MEDIA_LIST" | "ADD_MEDIA_TO_ALBUM_INVALID_TARGET" | "INVALID_ALBUM_ITEM_ORDER" | "COVER_MEDIA_NOT_PART_OF_ALBUM" | "DELETE_ALBUM_ITEMS_NO_ITEM_IDS" | "DELETE_MEDIA_ITEMS_EMPTY_LIST" | "INVALID_MEDIA_DIMENSIONS" | "INVALID_MEDIA_TAKEN_AT" | "INVALID_MEDIA_ITEM_TAGS" | "MEDIA_ALREADY_IN_ALBUM" | "STATUS_NOT_PENDING" | "STATUS_NOT_UPLOADED" | "USER_ALREADY_MEMBER")[];
    keys(): readonly ("AddMediaToAlbumEmptyMediaList" | "AddMediaToAlbumInvalidTarget" | "AlbumNotFound" | "InvalidAlbumItemOrder" | "AlbumEditCoverForbidden" | "AlbumViewForbidden" | "AssetKindAlreadyExists" | "AssetNotFound" | "AssetNotPending" | "CoverMediaNotPartOfAlbum" | "DeleteAlbumItemsNoItemIds" | "DeleteMediaItemsEmptyList" | "InvalidMediaDimensions" | "InvalidMediaTakenAt" | "InvalidMediaItemTags" | "MediaAlreadyInAlbum" | "MediaBytesNotFound" | "MediaDimensionsNotAvailable" | "MediaItemNotFound" | "MediaItemsNotFound" | "MediaItemNotInAlbum" | "MediaItemNotOwnedByViewer" | "MediaItemUpdateNoFieldsProvided" | "MediaItemNotReady" | "MemberNotAllowedToAddItem" | "MemberNotAllowedToDeleteAlbum" | "MemberNotAllowedToDeleteItem" | "MemberNotAllowedToEditAlbum" | "StatusNotPending" | "StatusNotUploaded" | "UserAlreadyMember" | "UserCanNotCreateAlbum" | "UserIsNotMember" | "MediaItemNotAuthorized" | "InvalidMediaAssetKind" | "CanNotGrantShareToOwner" | "ExpireDateCannotBeInPast" | "CannotUpdateExpiredDateIfRevoked" | "CannotRevokeShareIfAlreadyExpired" | "ShareNotFound" | "ShareMustHaveEitherGrantedToUserIdOrToken" | "ShareMustNotHaveGrantedToUserIdAndToken" | "UserNotFound")[];
};
//# sourceMappingURL=ContractError.d.ts.map