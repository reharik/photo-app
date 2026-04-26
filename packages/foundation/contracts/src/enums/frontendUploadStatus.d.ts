import { type Enumeration } from '@reharik/smart-enum';
export type FrontendUploadStatus = Enumeration<typeof FrontendUploadStatus>;
export declare const FrontendUploadStatus: {
    failed: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "failed";
        readonly value: "FAILED";
        readonly display: "Failed";
    };
    queued: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "queued";
        readonly value: "QUEUED";
        readonly display: "Queued";
    };
    creating: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "creating";
        readonly value: "CREATING";
        readonly display: "Creating";
    };
    uploading: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "uploading";
        readonly value: "UPLOADING";
        readonly display: "Uploading";
    };
    finalizing: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "finalizing";
        readonly value: "FINALIZING";
        readonly display: "Finalizing";
    };
    complete: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "complete";
        readonly value: "COMPLETE";
        readonly display: "Complete";
    };
} & {
    fromValue(value: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "failed";
        readonly value: "FAILED";
        readonly display: "Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "queued";
        readonly value: "QUEUED";
        readonly display: "Queued";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "creating";
        readonly value: "CREATING";
        readonly display: "Creating";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "uploading";
        readonly value: "UPLOADING";
        readonly display: "Uploading";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "finalizing";
        readonly value: "FINALIZING";
        readonly display: "Finalizing";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "complete";
        readonly value: "COMPLETE";
        readonly display: "Complete";
    });
    tryFromValue(value?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "failed";
        readonly value: "FAILED";
        readonly display: "Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "queued";
        readonly value: "QUEUED";
        readonly display: "Queued";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "creating";
        readonly value: "CREATING";
        readonly display: "Creating";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "uploading";
        readonly value: "UPLOADING";
        readonly display: "Uploading";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "finalizing";
        readonly value: "FINALIZING";
        readonly display: "Finalizing";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "complete";
        readonly value: "COMPLETE";
        readonly display: "Complete";
    })) | undefined;
    fromKey(key: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "failed";
        readonly value: "FAILED";
        readonly display: "Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "queued";
        readonly value: "QUEUED";
        readonly display: "Queued";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "creating";
        readonly value: "CREATING";
        readonly display: "Creating";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "uploading";
        readonly value: "UPLOADING";
        readonly display: "Uploading";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "finalizing";
        readonly value: "FINALIZING";
        readonly display: "Finalizing";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "complete";
        readonly value: "COMPLETE";
        readonly display: "Complete";
    });
    tryFromKey(key?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "failed";
        readonly value: "FAILED";
        readonly display: "Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "queued";
        readonly value: "QUEUED";
        readonly display: "Queued";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "creating";
        readonly value: "CREATING";
        readonly display: "Creating";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "uploading";
        readonly value: "UPLOADING";
        readonly display: "Uploading";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "finalizing";
        readonly value: "FINALIZING";
        readonly display: "Finalizing";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "complete";
        readonly value: "COMPLETE";
        readonly display: "Complete";
    })) | undefined;
    items(): readonly ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "failed";
        readonly value: "FAILED";
        readonly display: "Failed";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "queued";
        readonly value: "QUEUED";
        readonly display: "Queued";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "creating";
        readonly value: "CREATING";
        readonly display: "Creating";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "uploading";
        readonly value: "UPLOADING";
        readonly display: "Uploading";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "finalizing";
        readonly value: "FINALIZING";
        readonly display: "Finalizing";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "complete";
        readonly value: "COMPLETE";
        readonly display: "Complete";
    }))[];
    values(): readonly ("FAILED" | "COMPLETE" | "QUEUED" | "CREATING" | "UPLOADING" | "FINALIZING")[];
    keys(): readonly ("failed" | "queued" | "creating" | "uploading" | "finalizing" | "complete")[];
};
//# sourceMappingURL=frontendUploadStatus.d.ts.map