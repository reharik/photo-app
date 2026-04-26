import { type Enumeration } from '@reharik/smart-enum';
export type FrontendUploadStep = Enumeration<typeof FrontendUploadStep>;
export declare const FrontendUploadStep: {
    create: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        start: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "creating";
            readonly value: "CREATING";
            readonly display: "Creating";
        };
        end: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "uploading";
            readonly value: "UPLOADING";
            readonly display: "Uploading";
        };
        stage: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "creating";
            readonly value: "CREATING";
            readonly display: "Creating";
        };
        fail: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "failed";
            readonly value: "FAILED";
            readonly display: "Failed";
        };
    } & {
        readonly key: "create";
        readonly value: "CREATE";
        readonly display: "Create";
    };
    upload: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        start: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "uploading";
            readonly value: "UPLOADING";
            readonly display: "Uploading";
        };
        end: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "finalizing";
            readonly value: "FINALIZING";
            readonly display: "Finalizing";
        };
        stage: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "uploading";
            readonly value: "UPLOADING";
            readonly display: "Uploading";
        };
        fail: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "failed";
            readonly value: "FAILED";
            readonly display: "Failed";
        };
    } & {
        readonly key: "upload";
        readonly value: "UPLOAD";
        readonly display: "Upload";
    };
    finalize: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        start: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "finalizing";
            readonly value: "FINALIZING";
            readonly display: "Finalizing";
        };
        end: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "complete";
            readonly value: "COMPLETE";
            readonly display: "Complete";
        };
        stage: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "finalizing";
            readonly value: "FINALIZING";
            readonly display: "Finalizing";
        };
        fail: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "failed";
            readonly value: "FAILED";
            readonly display: "Failed";
        };
    } & {
        readonly key: "finalize";
        readonly value: "FINALIZE";
        readonly display: "Finalize";
    };
} & {
    fromValue(value: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        start: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "creating";
            readonly value: "CREATING";
            readonly display: "Creating";
        };
        end: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "uploading";
            readonly value: "UPLOADING";
            readonly display: "Uploading";
        };
        stage: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "creating";
            readonly value: "CREATING";
            readonly display: "Creating";
        };
        fail: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "failed";
            readonly value: "FAILED";
            readonly display: "Failed";
        };
    } & {
        readonly key: "create";
        readonly value: "CREATE";
        readonly display: "Create";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        start: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "uploading";
            readonly value: "UPLOADING";
            readonly display: "Uploading";
        };
        end: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "finalizing";
            readonly value: "FINALIZING";
            readonly display: "Finalizing";
        };
        stage: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "uploading";
            readonly value: "UPLOADING";
            readonly display: "Uploading";
        };
        fail: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "failed";
            readonly value: "FAILED";
            readonly display: "Failed";
        };
    } & {
        readonly key: "upload";
        readonly value: "UPLOAD";
        readonly display: "Upload";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        start: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "finalizing";
            readonly value: "FINALIZING";
            readonly display: "Finalizing";
        };
        end: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "complete";
            readonly value: "COMPLETE";
            readonly display: "Complete";
        };
        stage: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "finalizing";
            readonly value: "FINALIZING";
            readonly display: "Finalizing";
        };
        fail: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "failed";
            readonly value: "FAILED";
            readonly display: "Failed";
        };
    } & {
        readonly key: "finalize";
        readonly value: "FINALIZE";
        readonly display: "Finalize";
    });
    tryFromValue(value?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        start: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "creating";
            readonly value: "CREATING";
            readonly display: "Creating";
        };
        end: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "uploading";
            readonly value: "UPLOADING";
            readonly display: "Uploading";
        };
        stage: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "creating";
            readonly value: "CREATING";
            readonly display: "Creating";
        };
        fail: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "failed";
            readonly value: "FAILED";
            readonly display: "Failed";
        };
    } & {
        readonly key: "create";
        readonly value: "CREATE";
        readonly display: "Create";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        start: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "uploading";
            readonly value: "UPLOADING";
            readonly display: "Uploading";
        };
        end: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "finalizing";
            readonly value: "FINALIZING";
            readonly display: "Finalizing";
        };
        stage: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "uploading";
            readonly value: "UPLOADING";
            readonly display: "Uploading";
        };
        fail: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "failed";
            readonly value: "FAILED";
            readonly display: "Failed";
        };
    } & {
        readonly key: "upload";
        readonly value: "UPLOAD";
        readonly display: "Upload";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        start: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "finalizing";
            readonly value: "FINALIZING";
            readonly display: "Finalizing";
        };
        end: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "complete";
            readonly value: "COMPLETE";
            readonly display: "Complete";
        };
        stage: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "finalizing";
            readonly value: "FINALIZING";
            readonly display: "Finalizing";
        };
        fail: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "failed";
            readonly value: "FAILED";
            readonly display: "Failed";
        };
    } & {
        readonly key: "finalize";
        readonly value: "FINALIZE";
        readonly display: "Finalize";
    })) | undefined;
    fromKey(key: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        start: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "creating";
            readonly value: "CREATING";
            readonly display: "Creating";
        };
        end: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "uploading";
            readonly value: "UPLOADING";
            readonly display: "Uploading";
        };
        stage: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "creating";
            readonly value: "CREATING";
            readonly display: "Creating";
        };
        fail: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "failed";
            readonly value: "FAILED";
            readonly display: "Failed";
        };
    } & {
        readonly key: "create";
        readonly value: "CREATE";
        readonly display: "Create";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        start: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "uploading";
            readonly value: "UPLOADING";
            readonly display: "Uploading";
        };
        end: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "finalizing";
            readonly value: "FINALIZING";
            readonly display: "Finalizing";
        };
        stage: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "uploading";
            readonly value: "UPLOADING";
            readonly display: "Uploading";
        };
        fail: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "failed";
            readonly value: "FAILED";
            readonly display: "Failed";
        };
    } & {
        readonly key: "upload";
        readonly value: "UPLOAD";
        readonly display: "Upload";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        start: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "finalizing";
            readonly value: "FINALIZING";
            readonly display: "Finalizing";
        };
        end: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "complete";
            readonly value: "COMPLETE";
            readonly display: "Complete";
        };
        stage: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "finalizing";
            readonly value: "FINALIZING";
            readonly display: "Finalizing";
        };
        fail: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "failed";
            readonly value: "FAILED";
            readonly display: "Failed";
        };
    } & {
        readonly key: "finalize";
        readonly value: "FINALIZE";
        readonly display: "Finalize";
    });
    tryFromKey(key?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        start: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "creating";
            readonly value: "CREATING";
            readonly display: "Creating";
        };
        end: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "uploading";
            readonly value: "UPLOADING";
            readonly display: "Uploading";
        };
        stage: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "creating";
            readonly value: "CREATING";
            readonly display: "Creating";
        };
        fail: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "failed";
            readonly value: "FAILED";
            readonly display: "Failed";
        };
    } & {
        readonly key: "create";
        readonly value: "CREATE";
        readonly display: "Create";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        start: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "uploading";
            readonly value: "UPLOADING";
            readonly display: "Uploading";
        };
        end: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "finalizing";
            readonly value: "FINALIZING";
            readonly display: "Finalizing";
        };
        stage: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "uploading";
            readonly value: "UPLOADING";
            readonly display: "Uploading";
        };
        fail: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "failed";
            readonly value: "FAILED";
            readonly display: "Failed";
        };
    } & {
        readonly key: "upload";
        readonly value: "UPLOAD";
        readonly display: "Upload";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        start: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "finalizing";
            readonly value: "FINALIZING";
            readonly display: "Finalizing";
        };
        end: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "complete";
            readonly value: "COMPLETE";
            readonly display: "Complete";
        };
        stage: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "finalizing";
            readonly value: "FINALIZING";
            readonly display: "Finalizing";
        };
        fail: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "failed";
            readonly value: "FAILED";
            readonly display: "Failed";
        };
    } & {
        readonly key: "finalize";
        readonly value: "FINALIZE";
        readonly display: "Finalize";
    })) | undefined;
    items(): readonly ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        start: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "creating";
            readonly value: "CREATING";
            readonly display: "Creating";
        };
        end: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "uploading";
            readonly value: "UPLOADING";
            readonly display: "Uploading";
        };
        stage: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "creating";
            readonly value: "CREATING";
            readonly display: "Creating";
        };
        fail: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "failed";
            readonly value: "FAILED";
            readonly display: "Failed";
        };
    } & {
        readonly key: "create";
        readonly value: "CREATE";
        readonly display: "Create";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        start: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "uploading";
            readonly value: "UPLOADING";
            readonly display: "Uploading";
        };
        end: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "finalizing";
            readonly value: "FINALIZING";
            readonly display: "Finalizing";
        };
        stage: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "uploading";
            readonly value: "UPLOADING";
            readonly display: "Uploading";
        };
        fail: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "failed";
            readonly value: "FAILED";
            readonly display: "Failed";
        };
    } & {
        readonly key: "upload";
        readonly value: "UPLOAD";
        readonly display: "Upload";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {
        start: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "finalizing";
            readonly value: "FINALIZING";
            readonly display: "Finalizing";
        };
        end: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "complete";
            readonly value: "COMPLETE";
            readonly display: "Complete";
        };
        stage: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "finalizing";
            readonly value: "FINALIZING";
            readonly display: "Finalizing";
        };
        fail: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
            readonly key: "failed";
            readonly value: "FAILED";
            readonly display: "Failed";
        };
    } & {
        readonly key: "finalize";
        readonly value: "FINALIZE";
        readonly display: "Finalize";
    }))[];
    values(): readonly ("UPLOAD" | "CREATE" | "FINALIZE")[];
    keys(): readonly ("create" | "upload" | "finalize")[];
};
//# sourceMappingURL=frontendUploadStep.d.ts.map