/**
 * -----------------------------------------------------------------------------
 * THIS FILE IS AUTO-GENERATED. DO NOT EDIT MANUALLY.
 * Any manual changes will be overwritten by GraphQL Code Generator.
 * -----------------------------------------------------------------------------
 */
import { type Enumeration } from '@reharik/smart-enum';
export type AlbumItemSortBy = Enumeration<typeof AlbumItemSortBy>;
export type AlbumSortBy = Enumeration<typeof AlbumSortBy>;
export type ErrorCategory = Enumeration<typeof ErrorCategory>;
export type MediaAssetKind = Enumeration<typeof MediaAssetKind>;
export type MediaAssetStatus = Enumeration<typeof MediaAssetStatus>;
export type MediaItemSortBy = Enumeration<typeof MediaItemSortBy>;
export type MediaItemStatus = Enumeration<typeof MediaItemStatus>;
export type MediaKind = Enumeration<typeof MediaKind>;
export type SharePermission = Enumeration<typeof SharePermission>;
export type ShareViewerRelationship = Enumeration<typeof ShareViewerRelationship>;
export type SortDir = Enumeration<typeof SortDir>;
export declare const AlbumItemSortBy: {
    readonly createdAt: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "created_at";
    } & {
        readonly key: "createdAt";
        readonly value: "CREATED_AT";
        readonly display: "Created At";
    };
    readonly orderIndex: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "order_index";
    } & {
        readonly key: "orderIndex";
        readonly value: "ORDER_INDEX";
        readonly display: "Order Index";
    };
} & {
    fromValue(value: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "created_at";
    } & {
        readonly key: "createdAt";
        readonly value: "CREATED_AT";
        readonly display: "Created At";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "order_index";
    } & {
        readonly key: "orderIndex";
        readonly value: "ORDER_INDEX";
        readonly display: "Order Index";
    });
    tryFromValue(value?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "created_at";
    } & {
        readonly key: "createdAt";
        readonly value: "CREATED_AT";
        readonly display: "Created At";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "order_index";
    } & {
        readonly key: "orderIndex";
        readonly value: "ORDER_INDEX";
        readonly display: "Order Index";
    })) | undefined;
    fromKey(key: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "created_at";
    } & {
        readonly key: "createdAt";
        readonly value: "CREATED_AT";
        readonly display: "Created At";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "order_index";
    } & {
        readonly key: "orderIndex";
        readonly value: "ORDER_INDEX";
        readonly display: "Order Index";
    });
    tryFromKey(key?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "created_at";
    } & {
        readonly key: "createdAt";
        readonly value: "CREATED_AT";
        readonly display: "Created At";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "order_index";
    } & {
        readonly key: "orderIndex";
        readonly value: "ORDER_INDEX";
        readonly display: "Order Index";
    })) | undefined;
    items(): readonly ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "created_at";
    } & {
        readonly key: "createdAt";
        readonly value: "CREATED_AT";
        readonly display: "Created At";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "order_index";
    } & {
        readonly key: "orderIndex";
        readonly value: "ORDER_INDEX";
        readonly display: "Order Index";
    }))[];
    values(): readonly ("CREATED_AT" | "ORDER_INDEX")[];
    keys(): readonly ("createdAt" | "orderIndex")[];
};
export declare const AlbumSortBy: {
    readonly createdAt: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "created_at";
    } & {
        readonly key: "createdAt";
        readonly value: "CREATED_AT";
        readonly display: "Created At";
    };
    readonly title: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "title";
    } & {
        readonly key: "title";
        readonly value: "TITLE";
        readonly display: "Title";
    };
} & {
    fromValue(value: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "title";
    } & {
        readonly key: "title";
        readonly value: "TITLE";
        readonly display: "Title";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "created_at";
    } & {
        readonly key: "createdAt";
        readonly value: "CREATED_AT";
        readonly display: "Created At";
    });
    tryFromValue(value?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "title";
    } & {
        readonly key: "title";
        readonly value: "TITLE";
        readonly display: "Title";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "created_at";
    } & {
        readonly key: "createdAt";
        readonly value: "CREATED_AT";
        readonly display: "Created At";
    })) | undefined;
    fromKey(key: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "title";
    } & {
        readonly key: "title";
        readonly value: "TITLE";
        readonly display: "Title";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "created_at";
    } & {
        readonly key: "createdAt";
        readonly value: "CREATED_AT";
        readonly display: "Created At";
    });
    tryFromKey(key?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "title";
    } & {
        readonly key: "title";
        readonly value: "TITLE";
        readonly display: "Title";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "created_at";
    } & {
        readonly key: "createdAt";
        readonly value: "CREATED_AT";
        readonly display: "Created At";
    })) | undefined;
    items(): readonly ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "title";
    } & {
        readonly key: "title";
        readonly value: "TITLE";
        readonly display: "Title";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "created_at";
    } & {
        readonly key: "createdAt";
        readonly value: "CREATED_AT";
        readonly display: "Created At";
    }))[];
    values(): readonly ("CREATED_AT" | "TITLE")[];
    keys(): readonly ("title" | "createdAt")[];
};
export declare const ErrorCategory: {
    auth: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "auth";
        readonly value: "AUTH";
        readonly display: "Auth";
    };
    conflict: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "conflict";
        readonly value: "CONFLICT";
        readonly display: "Conflict";
    };
    domain: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "domain";
        readonly value: "DOMAIN";
        readonly display: "Domain";
    };
    network: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "network";
        readonly value: "NETWORK";
        readonly display: "Network";
    };
    system: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "system";
        readonly value: "SYSTEM";
        readonly display: "System";
    };
    validation: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "validation";
        readonly value: "VALIDATION";
        readonly display: "Validation";
    };
} & {
    fromValue(value: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "auth";
        readonly value: "AUTH";
        readonly display: "Auth";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "conflict";
        readonly value: "CONFLICT";
        readonly display: "Conflict";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "domain";
        readonly value: "DOMAIN";
        readonly display: "Domain";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "network";
        readonly value: "NETWORK";
        readonly display: "Network";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "system";
        readonly value: "SYSTEM";
        readonly display: "System";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "validation";
        readonly value: "VALIDATION";
        readonly display: "Validation";
    });
    tryFromValue(value?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "auth";
        readonly value: "AUTH";
        readonly display: "Auth";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "conflict";
        readonly value: "CONFLICT";
        readonly display: "Conflict";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "domain";
        readonly value: "DOMAIN";
        readonly display: "Domain";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "network";
        readonly value: "NETWORK";
        readonly display: "Network";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "system";
        readonly value: "SYSTEM";
        readonly display: "System";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "validation";
        readonly value: "VALIDATION";
        readonly display: "Validation";
    })) | undefined;
    fromKey(key: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "auth";
        readonly value: "AUTH";
        readonly display: "Auth";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "conflict";
        readonly value: "CONFLICT";
        readonly display: "Conflict";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "domain";
        readonly value: "DOMAIN";
        readonly display: "Domain";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "network";
        readonly value: "NETWORK";
        readonly display: "Network";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "system";
        readonly value: "SYSTEM";
        readonly display: "System";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "validation";
        readonly value: "VALIDATION";
        readonly display: "Validation";
    });
    tryFromKey(key?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "auth";
        readonly value: "AUTH";
        readonly display: "Auth";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "conflict";
        readonly value: "CONFLICT";
        readonly display: "Conflict";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "domain";
        readonly value: "DOMAIN";
        readonly display: "Domain";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "network";
        readonly value: "NETWORK";
        readonly display: "Network";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "system";
        readonly value: "SYSTEM";
        readonly display: "System";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "validation";
        readonly value: "VALIDATION";
        readonly display: "Validation";
    })) | undefined;
    items(): readonly ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "auth";
        readonly value: "AUTH";
        readonly display: "Auth";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "conflict";
        readonly value: "CONFLICT";
        readonly display: "Conflict";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "domain";
        readonly value: "DOMAIN";
        readonly display: "Domain";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "network";
        readonly value: "NETWORK";
        readonly display: "Network";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "system";
        readonly value: "SYSTEM";
        readonly display: "System";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "validation";
        readonly value: "VALIDATION";
        readonly display: "Validation";
    }))[];
    values(): readonly ("AUTH" | "CONFLICT" | "DOMAIN" | "NETWORK" | "SYSTEM" | "VALIDATION")[];
    keys(): readonly ("auth" | "conflict" | "domain" | "network" | "system" | "validation")[];
};
export declare const MediaAssetKind: {
    display: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "display";
        readonly value: "DISPLAY";
        readonly display: "Display";
    };
    original: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "original";
        readonly value: "ORIGINAL";
        readonly display: "Original";
    };
    thumbnail: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "thumbnail";
        readonly value: "THUMBNAIL";
        readonly display: "Thumbnail";
    };
} & {
    fromValue(value: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "display";
        readonly value: "DISPLAY";
        readonly display: "Display";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "original";
        readonly value: "ORIGINAL";
        readonly display: "Original";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "thumbnail";
        readonly value: "THUMBNAIL";
        readonly display: "Thumbnail";
    });
    tryFromValue(value?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "display";
        readonly value: "DISPLAY";
        readonly display: "Display";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "original";
        readonly value: "ORIGINAL";
        readonly display: "Original";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "thumbnail";
        readonly value: "THUMBNAIL";
        readonly display: "Thumbnail";
    })) | undefined;
    fromKey(key: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "display";
        readonly value: "DISPLAY";
        readonly display: "Display";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "original";
        readonly value: "ORIGINAL";
        readonly display: "Original";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "thumbnail";
        readonly value: "THUMBNAIL";
        readonly display: "Thumbnail";
    });
    tryFromKey(key?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "display";
        readonly value: "DISPLAY";
        readonly display: "Display";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "original";
        readonly value: "ORIGINAL";
        readonly display: "Original";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "thumbnail";
        readonly value: "THUMBNAIL";
        readonly display: "Thumbnail";
    })) | undefined;
    items(): readonly ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "display";
        readonly value: "DISPLAY";
        readonly display: "Display";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "original";
        readonly value: "ORIGINAL";
        readonly display: "Original";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "thumbnail";
        readonly value: "THUMBNAIL";
        readonly display: "Thumbnail";
    }))[];
    values(): readonly ("DISPLAY" | "ORIGINAL" | "THUMBNAIL")[];
    keys(): readonly ("display" | "original" | "thumbnail")[];
};
export declare const MediaAssetStatus: {
    failed: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "failed";
        readonly value: "FAILED";
        readonly display: "Failed";
    };
    pending: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "pending";
        readonly value: "PENDING";
        readonly display: "Pending";
    };
    processing: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "processing";
        readonly value: "PROCESSING";
        readonly display: "Processing";
    };
    ready: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "ready";
        readonly value: "READY";
        readonly display: "Ready";
    };
} & {
    fromValue(value: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "failed";
        readonly value: "FAILED";
        readonly display: "Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "pending";
        readonly value: "PENDING";
        readonly display: "Pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "processing";
        readonly value: "PROCESSING";
        readonly display: "Processing";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "ready";
        readonly value: "READY";
        readonly display: "Ready";
    });
    tryFromValue(value?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "failed";
        readonly value: "FAILED";
        readonly display: "Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "pending";
        readonly value: "PENDING";
        readonly display: "Pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "processing";
        readonly value: "PROCESSING";
        readonly display: "Processing";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "ready";
        readonly value: "READY";
        readonly display: "Ready";
    })) | undefined;
    fromKey(key: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "failed";
        readonly value: "FAILED";
        readonly display: "Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "pending";
        readonly value: "PENDING";
        readonly display: "Pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "processing";
        readonly value: "PROCESSING";
        readonly display: "Processing";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "ready";
        readonly value: "READY";
        readonly display: "Ready";
    });
    tryFromKey(key?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "failed";
        readonly value: "FAILED";
        readonly display: "Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "pending";
        readonly value: "PENDING";
        readonly display: "Pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "processing";
        readonly value: "PROCESSING";
        readonly display: "Processing";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "ready";
        readonly value: "READY";
        readonly display: "Ready";
    })) | undefined;
    items(): readonly ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "failed";
        readonly value: "FAILED";
        readonly display: "Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "pending";
        readonly value: "PENDING";
        readonly display: "Pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "processing";
        readonly value: "PROCESSING";
        readonly display: "Processing";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "ready";
        readonly value: "READY";
        readonly display: "Ready";
    }))[];
    values(): readonly ("FAILED" | "PENDING" | "PROCESSING" | "READY")[];
    keys(): readonly ("failed" | "pending" | "processing" | "ready")[];
};
export declare const MediaItemSortBy: {
    readonly createdAt: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "created_at";
    } & {
        readonly key: "createdAt";
        readonly value: "CREATED_AT";
        readonly display: "Created At";
    };
} & {
    fromValue(value: string): Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "created_at";
    } & {
        readonly key: "createdAt";
        readonly value: "CREATED_AT";
        readonly display: "Created At";
    };
    tryFromValue(value?: string | null): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "created_at";
    } & {
        readonly key: "createdAt";
        readonly value: "CREATED_AT";
        readonly display: "Created At";
    }) | undefined;
    fromKey(key: string): Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "created_at";
    } & {
        readonly key: "createdAt";
        readonly value: "CREATED_AT";
        readonly display: "Created At";
    };
    tryFromKey(key?: string | null): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "created_at";
    } & {
        readonly key: "createdAt";
        readonly value: "CREATED_AT";
        readonly display: "Created At";
    }) | undefined;
    items(): readonly (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly column: "created_at";
    } & {
        readonly key: "createdAt";
        readonly value: "CREATED_AT";
        readonly display: "Created At";
    })[];
    values(): readonly "CREATED_AT"[];
    keys(): readonly "createdAt"[];
};
export declare const MediaItemStatus: {
    failed: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "failed";
        readonly value: "FAILED";
        readonly display: "Failed";
    };
    pending: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "pending";
        readonly value: "PENDING";
        readonly display: "Pending";
    };
    processing: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "processing";
        readonly value: "PROCESSING";
        readonly display: "Processing";
    };
    ready: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "ready";
        readonly value: "READY";
        readonly display: "Ready";
    };
    deleteFailed: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "deleteFailed";
        readonly value: "DELETE_FAILED";
        readonly display: "Delete Failed";
    };
    deletePending: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "deletePending";
        readonly value: "DELETE_PENDING";
        readonly display: "Delete Pending";
    };
    uploaded: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "uploaded";
        readonly value: "UPLOADED";
        readonly display: "Uploaded";
    };
} & {
    fromValue(value: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "failed";
        readonly value: "FAILED";
        readonly display: "Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "pending";
        readonly value: "PENDING";
        readonly display: "Pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "processing";
        readonly value: "PROCESSING";
        readonly display: "Processing";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "ready";
        readonly value: "READY";
        readonly display: "Ready";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "deleteFailed";
        readonly value: "DELETE_FAILED";
        readonly display: "Delete Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "deletePending";
        readonly value: "DELETE_PENDING";
        readonly display: "Delete Pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "uploaded";
        readonly value: "UPLOADED";
        readonly display: "Uploaded";
    });
    tryFromValue(value?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "failed";
        readonly value: "FAILED";
        readonly display: "Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "pending";
        readonly value: "PENDING";
        readonly display: "Pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "processing";
        readonly value: "PROCESSING";
        readonly display: "Processing";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "ready";
        readonly value: "READY";
        readonly display: "Ready";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "deleteFailed";
        readonly value: "DELETE_FAILED";
        readonly display: "Delete Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "deletePending";
        readonly value: "DELETE_PENDING";
        readonly display: "Delete Pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "uploaded";
        readonly value: "UPLOADED";
        readonly display: "Uploaded";
    })) | undefined;
    fromKey(key: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "failed";
        readonly value: "FAILED";
        readonly display: "Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "pending";
        readonly value: "PENDING";
        readonly display: "Pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "processing";
        readonly value: "PROCESSING";
        readonly display: "Processing";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "ready";
        readonly value: "READY";
        readonly display: "Ready";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "deleteFailed";
        readonly value: "DELETE_FAILED";
        readonly display: "Delete Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "deletePending";
        readonly value: "DELETE_PENDING";
        readonly display: "Delete Pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "uploaded";
        readonly value: "UPLOADED";
        readonly display: "Uploaded";
    });
    tryFromKey(key?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "failed";
        readonly value: "FAILED";
        readonly display: "Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "pending";
        readonly value: "PENDING";
        readonly display: "Pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "processing";
        readonly value: "PROCESSING";
        readonly display: "Processing";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "ready";
        readonly value: "READY";
        readonly display: "Ready";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "deleteFailed";
        readonly value: "DELETE_FAILED";
        readonly display: "Delete Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "deletePending";
        readonly value: "DELETE_PENDING";
        readonly display: "Delete Pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "uploaded";
        readonly value: "UPLOADED";
        readonly display: "Uploaded";
    })) | undefined;
    items(): readonly ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "failed";
        readonly value: "FAILED";
        readonly display: "Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "pending";
        readonly value: "PENDING";
        readonly display: "Pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "processing";
        readonly value: "PROCESSING";
        readonly display: "Processing";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "ready";
        readonly value: "READY";
        readonly display: "Ready";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "deleteFailed";
        readonly value: "DELETE_FAILED";
        readonly display: "Delete Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "deletePending";
        readonly value: "DELETE_PENDING";
        readonly display: "Delete Pending";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "uploaded";
        readonly value: "UPLOADED";
        readonly display: "Uploaded";
    }))[];
    values(): readonly ("FAILED" | "PENDING" | "PROCESSING" | "READY" | "DELETE_FAILED" | "DELETE_PENDING" | "UPLOADED")[];
    keys(): readonly ("failed" | "pending" | "processing" | "ready" | "deleteFailed" | "deletePending" | "uploaded")[];
};
export declare const MediaKind: {
    photo: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "photo";
        readonly value: "PHOTO";
        readonly display: "Photo";
    };
    video: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "video";
        readonly value: "VIDEO";
        readonly display: "Video";
    };
} & {
    fromValue(value: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "photo";
        readonly value: "PHOTO";
        readonly display: "Photo";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "video";
        readonly value: "VIDEO";
        readonly display: "Video";
    });
    tryFromValue(value?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "photo";
        readonly value: "PHOTO";
        readonly display: "Photo";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "video";
        readonly value: "VIDEO";
        readonly display: "Video";
    })) | undefined;
    fromKey(key: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "photo";
        readonly value: "PHOTO";
        readonly display: "Photo";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "video";
        readonly value: "VIDEO";
        readonly display: "Video";
    });
    tryFromKey(key?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "photo";
        readonly value: "PHOTO";
        readonly display: "Photo";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "video";
        readonly value: "VIDEO";
        readonly display: "Video";
    })) | undefined;
    items(): readonly ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "photo";
        readonly value: "PHOTO";
        readonly display: "Photo";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "video";
        readonly value: "VIDEO";
        readonly display: "Video";
    }))[];
    values(): readonly ("PHOTO" | "VIDEO")[];
    keys(): readonly ("photo" | "video")[];
};
export declare const SharePermission: {
    comment: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "comment";
        readonly value: "COMMENT";
        readonly display: "Comment";
    };
    download: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "download";
        readonly value: "DOWNLOAD";
        readonly display: "Download";
    };
    view: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "view";
        readonly value: "VIEW";
        readonly display: "View";
    };
} & {
    fromValue(value: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "comment";
        readonly value: "COMMENT";
        readonly display: "Comment";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "download";
        readonly value: "DOWNLOAD";
        readonly display: "Download";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "view";
        readonly value: "VIEW";
        readonly display: "View";
    });
    tryFromValue(value?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "comment";
        readonly value: "COMMENT";
        readonly display: "Comment";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "download";
        readonly value: "DOWNLOAD";
        readonly display: "Download";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "view";
        readonly value: "VIEW";
        readonly display: "View";
    })) | undefined;
    fromKey(key: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "comment";
        readonly value: "COMMENT";
        readonly display: "Comment";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "download";
        readonly value: "DOWNLOAD";
        readonly display: "Download";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "view";
        readonly value: "VIEW";
        readonly display: "View";
    });
    tryFromKey(key?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "comment";
        readonly value: "COMMENT";
        readonly display: "Comment";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "download";
        readonly value: "DOWNLOAD";
        readonly display: "Download";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "view";
        readonly value: "VIEW";
        readonly display: "View";
    })) | undefined;
    items(): readonly ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "comment";
        readonly value: "COMMENT";
        readonly display: "Comment";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "download";
        readonly value: "DOWNLOAD";
        readonly display: "Download";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "view";
        readonly value: "VIEW";
        readonly display: "View";
    }))[];
    values(): readonly ("VIEW" | "COMMENT" | "DOWNLOAD")[];
    keys(): readonly ("comment" | "download" | "view")[];
};
export declare const ShareViewerRelationship: {
    anonymous: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "anonymous";
        readonly value: "ANONYMOUS";
        readonly display: "Anonymous";
    };
    authenticated: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "authenticated";
        readonly value: "AUTHENTICATED";
        readonly display: "Authenticated";
    };
    member: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "member";
        readonly value: "MEMBER";
        readonly display: "Member";
    };
    owner: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "owner";
        readonly value: "OWNER";
        readonly display: "Owner";
    };
} & {
    fromValue(value: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "anonymous";
        readonly value: "ANONYMOUS";
        readonly display: "Anonymous";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "authenticated";
        readonly value: "AUTHENTICATED";
        readonly display: "Authenticated";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "member";
        readonly value: "MEMBER";
        readonly display: "Member";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "owner";
        readonly value: "OWNER";
        readonly display: "Owner";
    });
    tryFromValue(value?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "anonymous";
        readonly value: "ANONYMOUS";
        readonly display: "Anonymous";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "authenticated";
        readonly value: "AUTHENTICATED";
        readonly display: "Authenticated";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "member";
        readonly value: "MEMBER";
        readonly display: "Member";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "owner";
        readonly value: "OWNER";
        readonly display: "Owner";
    })) | undefined;
    fromKey(key: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "anonymous";
        readonly value: "ANONYMOUS";
        readonly display: "Anonymous";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "authenticated";
        readonly value: "AUTHENTICATED";
        readonly display: "Authenticated";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "member";
        readonly value: "MEMBER";
        readonly display: "Member";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "owner";
        readonly value: "OWNER";
        readonly display: "Owner";
    });
    tryFromKey(key?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "anonymous";
        readonly value: "ANONYMOUS";
        readonly display: "Anonymous";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "authenticated";
        readonly value: "AUTHENTICATED";
        readonly display: "Authenticated";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "member";
        readonly value: "MEMBER";
        readonly display: "Member";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "owner";
        readonly value: "OWNER";
        readonly display: "Owner";
    })) | undefined;
    items(): readonly ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "anonymous";
        readonly value: "ANONYMOUS";
        readonly display: "Anonymous";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "authenticated";
        readonly value: "AUTHENTICATED";
        readonly display: "Authenticated";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "member";
        readonly value: "MEMBER";
        readonly display: "Member";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "owner";
        readonly value: "OWNER";
        readonly display: "Owner";
    }))[];
    values(): readonly ("MEMBER" | "OWNER" | "ANONYMOUS" | "AUTHENTICATED")[];
    keys(): readonly ("anonymous" | "authenticated" | "member" | "owner")[];
};
export declare const SortDir: {
    asc: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "asc";
        readonly value: "ASC";
        readonly display: "Asc";
    };
    desc: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "desc";
        readonly value: "DESC";
        readonly display: "Desc";
    };
} & {
    fromValue(value: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "asc";
        readonly value: "ASC";
        readonly display: "Asc";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "desc";
        readonly value: "DESC";
        readonly display: "Desc";
    });
    tryFromValue(value?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "asc";
        readonly value: "ASC";
        readonly display: "Asc";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "desc";
        readonly value: "DESC";
        readonly display: "Desc";
    })) | undefined;
    fromKey(key: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "asc";
        readonly value: "ASC";
        readonly display: "Asc";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "desc";
        readonly value: "DESC";
        readonly display: "Desc";
    });
    tryFromKey(key?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "asc";
        readonly value: "ASC";
        readonly display: "Asc";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "desc";
        readonly value: "DESC";
        readonly display: "Desc";
    })) | undefined;
    items(): readonly ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "asc";
        readonly value: "ASC";
        readonly display: "Asc";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "desc";
        readonly value: "DESC";
        readonly display: "Desc";
    }))[];
    values(): readonly ("ASC" | "DESC")[];
    keys(): readonly ("asc" | "desc")[];
};
//# sourceMappingURL=graphqlSmartEnums.d.ts.map