import { Enumeration } from '@reharik/smart-enum';
export type AlbumAction = Enumeration<typeof AlbumAction>;
export declare const AlbumAction: {
    readonly view: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "view";
        readonly value: "VIEW";
        readonly display: "View";
    };
    readonly editDetails: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "editDetails";
        readonly value: "EDIT_DETAILS";
        readonly display: "Edit Details";
    };
    readonly addItem: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "addItem";
        readonly value: "ADD_ITEM";
        readonly display: "Add Item";
    };
    readonly removeItem: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "removeItem";
        readonly value: "REMOVE_ITEM";
        readonly display: "Remove Item";
    };
    readonly editCover: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "editCover";
        readonly value: "EDIT_COVER";
        readonly display: "Edit Cover";
    };
    readonly delete: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "delete";
        readonly value: "DELETE";
        readonly display: "Delete";
    };
} & {
    fromValue(value: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "view";
        readonly value: "VIEW";
        readonly display: "View";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "editDetails";
        readonly value: "EDIT_DETAILS";
        readonly display: "Edit Details";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "addItem";
        readonly value: "ADD_ITEM";
        readonly display: "Add Item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "removeItem";
        readonly value: "REMOVE_ITEM";
        readonly display: "Remove Item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "editCover";
        readonly value: "EDIT_COVER";
        readonly display: "Edit Cover";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "delete";
        readonly value: "DELETE";
        readonly display: "Delete";
    });
    tryFromValue(value?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "view";
        readonly value: "VIEW";
        readonly display: "View";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "editDetails";
        readonly value: "EDIT_DETAILS";
        readonly display: "Edit Details";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "addItem";
        readonly value: "ADD_ITEM";
        readonly display: "Add Item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "removeItem";
        readonly value: "REMOVE_ITEM";
        readonly display: "Remove Item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "editCover";
        readonly value: "EDIT_COVER";
        readonly display: "Edit Cover";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "delete";
        readonly value: "DELETE";
        readonly display: "Delete";
    })) | undefined;
    fromKey(key: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "view";
        readonly value: "VIEW";
        readonly display: "View";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "editDetails";
        readonly value: "EDIT_DETAILS";
        readonly display: "Edit Details";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "addItem";
        readonly value: "ADD_ITEM";
        readonly display: "Add Item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "removeItem";
        readonly value: "REMOVE_ITEM";
        readonly display: "Remove Item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "editCover";
        readonly value: "EDIT_COVER";
        readonly display: "Edit Cover";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "delete";
        readonly value: "DELETE";
        readonly display: "Delete";
    });
    tryFromKey(key?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "view";
        readonly value: "VIEW";
        readonly display: "View";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "editDetails";
        readonly value: "EDIT_DETAILS";
        readonly display: "Edit Details";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "addItem";
        readonly value: "ADD_ITEM";
        readonly display: "Add Item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "removeItem";
        readonly value: "REMOVE_ITEM";
        readonly display: "Remove Item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "editCover";
        readonly value: "EDIT_COVER";
        readonly display: "Edit Cover";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "delete";
        readonly value: "DELETE";
        readonly display: "Delete";
    })) | undefined;
    items(): readonly ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "view";
        readonly value: "VIEW";
        readonly display: "View";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "editDetails";
        readonly value: "EDIT_DETAILS";
        readonly display: "Edit Details";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "addItem";
        readonly value: "ADD_ITEM";
        readonly display: "Add Item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "removeItem";
        readonly value: "REMOVE_ITEM";
        readonly display: "Remove Item";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "editCover";
        readonly value: "EDIT_COVER";
        readonly display: "Edit Cover";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly deniedError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
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
    } & {
        readonly key: "delete";
        readonly value: "DELETE";
        readonly display: "Delete";
    }))[];
    values(): readonly ("DELETE" | "VIEW" | "EDIT_DETAILS" | "ADD_ITEM" | "REMOVE_ITEM" | "EDIT_COVER")[];
    keys(): readonly ("view" | "editDetails" | "addItem" | "removeItem" | "editCover" | "delete")[];
};
//# sourceMappingURL=albumAction.d.ts.map