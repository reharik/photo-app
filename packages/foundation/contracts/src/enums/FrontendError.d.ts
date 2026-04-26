import { type Enumeration } from '@reharik/smart-enum';
export type FrontendError = Enumeration<typeof FrontendError>;
export declare const FrontendError: {
    readonly networkError: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "NETWORK_ERROR";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "network";
            readonly value: "NETWORK";
            readonly display: "Network";
        };
        readonly retryable: false;
        readonly message: "Network error";
        readonly source: "frontend";
    } & {
        readonly key: "networkError";
        readonly value: "NETWORK_ERROR";
        readonly display: "Network Error";
    };
    readonly finalizeFailed: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "FINALIZE_FAILED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "validation";
            readonly value: "VALIDATION";
            readonly display: "Validation";
        };
        readonly retryable: false;
        readonly message: "Finalize media upload returned an invalid payload.";
        readonly source: "frontend";
    } & {
        readonly key: "finalizeFailed";
        readonly value: "FINALIZE_FAILED";
        readonly display: "Finalize Failed";
    };
    readonly uploadFailed: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "UPLOAD_FAILED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "validation";
            readonly value: "VALIDATION";
            readonly display: "Validation";
        };
        readonly retryable: false;
        readonly message: "Upload failed.";
        readonly source: "frontend";
    } & {
        readonly key: "uploadFailed";
        readonly value: "UPLOAD_FAILED";
        readonly display: "Upload Failed";
    };
    readonly invalidCreateMediaUploadPayload: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "INVALID_CREATE_MEDIA_UPLOAD_PAYLOAD";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "validation";
            readonly value: "VALIDATION";
            readonly display: "Validation";
        };
        readonly retryable: false;
        readonly message: "Create media upload returned an invalid payload.";
        readonly source: "frontend";
    } & {
        readonly key: "invalidCreateMediaUploadPayload";
        readonly value: "INVALID_CREATE_MEDIA_UPLOAD_PAYLOAD";
        readonly display: "Invalid Create Media Upload Payload";
    };
    readonly unsupportedMediaType: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "UNSUPPORTED_MEDIA_TYPE";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "validation";
            readonly value: "VALIDATION";
            readonly display: "Validation";
        };
        readonly retryable: false;
        readonly message: "Only image and video uploads are supported.";
        readonly source: "frontend";
    } & {
        readonly key: "unsupportedMediaType";
        readonly value: "UNSUPPORTED_MEDIA_TYPE";
        readonly display: "Unsupported Media Type";
    };
} & {
    fromValue(value: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "NETWORK_ERROR";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "network";
            readonly value: "NETWORK";
            readonly display: "Network";
        };
        readonly retryable: false;
        readonly message: "Network error";
        readonly source: "frontend";
    } & {
        readonly key: "networkError";
        readonly value: "NETWORK_ERROR";
        readonly display: "Network Error";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "FINALIZE_FAILED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "validation";
            readonly value: "VALIDATION";
            readonly display: "Validation";
        };
        readonly retryable: false;
        readonly message: "Finalize media upload returned an invalid payload.";
        readonly source: "frontend";
    } & {
        readonly key: "finalizeFailed";
        readonly value: "FINALIZE_FAILED";
        readonly display: "Finalize Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "UPLOAD_FAILED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "validation";
            readonly value: "VALIDATION";
            readonly display: "Validation";
        };
        readonly retryable: false;
        readonly message: "Upload failed.";
        readonly source: "frontend";
    } & {
        readonly key: "uploadFailed";
        readonly value: "UPLOAD_FAILED";
        readonly display: "Upload Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "INVALID_CREATE_MEDIA_UPLOAD_PAYLOAD";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "validation";
            readonly value: "VALIDATION";
            readonly display: "Validation";
        };
        readonly retryable: false;
        readonly message: "Create media upload returned an invalid payload.";
        readonly source: "frontend";
    } & {
        readonly key: "invalidCreateMediaUploadPayload";
        readonly value: "INVALID_CREATE_MEDIA_UPLOAD_PAYLOAD";
        readonly display: "Invalid Create Media Upload Payload";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "UNSUPPORTED_MEDIA_TYPE";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "validation";
            readonly value: "VALIDATION";
            readonly display: "Validation";
        };
        readonly retryable: false;
        readonly message: "Only image and video uploads are supported.";
        readonly source: "frontend";
    } & {
        readonly key: "unsupportedMediaType";
        readonly value: "UNSUPPORTED_MEDIA_TYPE";
        readonly display: "Unsupported Media Type";
    });
    tryFromValue(value?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "NETWORK_ERROR";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "network";
            readonly value: "NETWORK";
            readonly display: "Network";
        };
        readonly retryable: false;
        readonly message: "Network error";
        readonly source: "frontend";
    } & {
        readonly key: "networkError";
        readonly value: "NETWORK_ERROR";
        readonly display: "Network Error";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "FINALIZE_FAILED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "validation";
            readonly value: "VALIDATION";
            readonly display: "Validation";
        };
        readonly retryable: false;
        readonly message: "Finalize media upload returned an invalid payload.";
        readonly source: "frontend";
    } & {
        readonly key: "finalizeFailed";
        readonly value: "FINALIZE_FAILED";
        readonly display: "Finalize Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "UPLOAD_FAILED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "validation";
            readonly value: "VALIDATION";
            readonly display: "Validation";
        };
        readonly retryable: false;
        readonly message: "Upload failed.";
        readonly source: "frontend";
    } & {
        readonly key: "uploadFailed";
        readonly value: "UPLOAD_FAILED";
        readonly display: "Upload Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "INVALID_CREATE_MEDIA_UPLOAD_PAYLOAD";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "validation";
            readonly value: "VALIDATION";
            readonly display: "Validation";
        };
        readonly retryable: false;
        readonly message: "Create media upload returned an invalid payload.";
        readonly source: "frontend";
    } & {
        readonly key: "invalidCreateMediaUploadPayload";
        readonly value: "INVALID_CREATE_MEDIA_UPLOAD_PAYLOAD";
        readonly display: "Invalid Create Media Upload Payload";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "UNSUPPORTED_MEDIA_TYPE";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "validation";
            readonly value: "VALIDATION";
            readonly display: "Validation";
        };
        readonly retryable: false;
        readonly message: "Only image and video uploads are supported.";
        readonly source: "frontend";
    } & {
        readonly key: "unsupportedMediaType";
        readonly value: "UNSUPPORTED_MEDIA_TYPE";
        readonly display: "Unsupported Media Type";
    })) | undefined;
    fromKey(key: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "NETWORK_ERROR";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "network";
            readonly value: "NETWORK";
            readonly display: "Network";
        };
        readonly retryable: false;
        readonly message: "Network error";
        readonly source: "frontend";
    } & {
        readonly key: "networkError";
        readonly value: "NETWORK_ERROR";
        readonly display: "Network Error";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "FINALIZE_FAILED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "validation";
            readonly value: "VALIDATION";
            readonly display: "Validation";
        };
        readonly retryable: false;
        readonly message: "Finalize media upload returned an invalid payload.";
        readonly source: "frontend";
    } & {
        readonly key: "finalizeFailed";
        readonly value: "FINALIZE_FAILED";
        readonly display: "Finalize Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "UPLOAD_FAILED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "validation";
            readonly value: "VALIDATION";
            readonly display: "Validation";
        };
        readonly retryable: false;
        readonly message: "Upload failed.";
        readonly source: "frontend";
    } & {
        readonly key: "uploadFailed";
        readonly value: "UPLOAD_FAILED";
        readonly display: "Upload Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "INVALID_CREATE_MEDIA_UPLOAD_PAYLOAD";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "validation";
            readonly value: "VALIDATION";
            readonly display: "Validation";
        };
        readonly retryable: false;
        readonly message: "Create media upload returned an invalid payload.";
        readonly source: "frontend";
    } & {
        readonly key: "invalidCreateMediaUploadPayload";
        readonly value: "INVALID_CREATE_MEDIA_UPLOAD_PAYLOAD";
        readonly display: "Invalid Create Media Upload Payload";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "UNSUPPORTED_MEDIA_TYPE";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "validation";
            readonly value: "VALIDATION";
            readonly display: "Validation";
        };
        readonly retryable: false;
        readonly message: "Only image and video uploads are supported.";
        readonly source: "frontend";
    } & {
        readonly key: "unsupportedMediaType";
        readonly value: "UNSUPPORTED_MEDIA_TYPE";
        readonly display: "Unsupported Media Type";
    });
    tryFromKey(key?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "NETWORK_ERROR";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "network";
            readonly value: "NETWORK";
            readonly display: "Network";
        };
        readonly retryable: false;
        readonly message: "Network error";
        readonly source: "frontend";
    } & {
        readonly key: "networkError";
        readonly value: "NETWORK_ERROR";
        readonly display: "Network Error";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "FINALIZE_FAILED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "validation";
            readonly value: "VALIDATION";
            readonly display: "Validation";
        };
        readonly retryable: false;
        readonly message: "Finalize media upload returned an invalid payload.";
        readonly source: "frontend";
    } & {
        readonly key: "finalizeFailed";
        readonly value: "FINALIZE_FAILED";
        readonly display: "Finalize Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "UPLOAD_FAILED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "validation";
            readonly value: "VALIDATION";
            readonly display: "Validation";
        };
        readonly retryable: false;
        readonly message: "Upload failed.";
        readonly source: "frontend";
    } & {
        readonly key: "uploadFailed";
        readonly value: "UPLOAD_FAILED";
        readonly display: "Upload Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "INVALID_CREATE_MEDIA_UPLOAD_PAYLOAD";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "validation";
            readonly value: "VALIDATION";
            readonly display: "Validation";
        };
        readonly retryable: false;
        readonly message: "Create media upload returned an invalid payload.";
        readonly source: "frontend";
    } & {
        readonly key: "invalidCreateMediaUploadPayload";
        readonly value: "INVALID_CREATE_MEDIA_UPLOAD_PAYLOAD";
        readonly display: "Invalid Create Media Upload Payload";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "UNSUPPORTED_MEDIA_TYPE";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "validation";
            readonly value: "VALIDATION";
            readonly display: "Validation";
        };
        readonly retryable: false;
        readonly message: "Only image and video uploads are supported.";
        readonly source: "frontend";
    } & {
        readonly key: "unsupportedMediaType";
        readonly value: "UNSUPPORTED_MEDIA_TYPE";
        readonly display: "Unsupported Media Type";
    })) | undefined;
    items(): readonly ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "NETWORK_ERROR";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "network";
            readonly value: "NETWORK";
            readonly display: "Network";
        };
        readonly retryable: false;
        readonly message: "Network error";
        readonly source: "frontend";
    } & {
        readonly key: "networkError";
        readonly value: "NETWORK_ERROR";
        readonly display: "Network Error";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "FINALIZE_FAILED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "validation";
            readonly value: "VALIDATION";
            readonly display: "Validation";
        };
        readonly retryable: false;
        readonly message: "Finalize media upload returned an invalid payload.";
        readonly source: "frontend";
    } & {
        readonly key: "finalizeFailed";
        readonly value: "FINALIZE_FAILED";
        readonly display: "Finalize Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "UPLOAD_FAILED";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "validation";
            readonly value: "VALIDATION";
            readonly display: "Validation";
        };
        readonly retryable: false;
        readonly message: "Upload failed.";
        readonly source: "frontend";
    } & {
        readonly key: "uploadFailed";
        readonly value: "UPLOAD_FAILED";
        readonly display: "Upload Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "INVALID_CREATE_MEDIA_UPLOAD_PAYLOAD";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "validation";
            readonly value: "VALIDATION";
            readonly display: "Validation";
        };
        readonly retryable: false;
        readonly message: "Create media upload returned an invalid payload.";
        readonly source: "frontend";
    } & {
        readonly key: "invalidCreateMediaUploadPayload";
        readonly value: "INVALID_CREATE_MEDIA_UPLOAD_PAYLOAD";
        readonly display: "Invalid Create Media Upload Payload";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        readonly code: "UNSUPPORTED_MEDIA_TYPE";
        readonly category: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "validation";
            readonly value: "VALIDATION";
            readonly display: "Validation";
        };
        readonly retryable: false;
        readonly message: "Only image and video uploads are supported.";
        readonly source: "frontend";
    } & {
        readonly key: "unsupportedMediaType";
        readonly value: "UNSUPPORTED_MEDIA_TYPE";
        readonly display: "Unsupported Media Type";
    }))[];
    values(): readonly ("NETWORK_ERROR" | "FINALIZE_FAILED" | "UPLOAD_FAILED" | "INVALID_CREATE_MEDIA_UPLOAD_PAYLOAD" | "UNSUPPORTED_MEDIA_TYPE")[];
    keys(): readonly ("networkError" | "finalizeFailed" | "uploadFailed" | "invalidCreateMediaUploadPayload" | "unsupportedMediaType")[];
};
//# sourceMappingURL=FrontendError.d.ts.map