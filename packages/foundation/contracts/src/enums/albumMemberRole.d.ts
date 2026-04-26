import { type Enumeration } from '@reharik/smart-enum';
export type AlbumMemberRoleEnum = Enumeration<typeof AlbumMemberRoleEnum>;
export declare const AlbumMemberRoleEnum: {
    owner: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "owner";
        readonly value: "OWNER";
        readonly display: "Owner";
    };
    viewer: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "viewer";
        readonly value: "VIEWER";
        readonly display: "Viewer";
    };
    contributor: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "contributor";
        readonly value: "CONTRIBUTOR";
        readonly display: "Contributor";
    };
    admin: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "admin";
        readonly value: "ADMIN";
        readonly display: "Admin";
    };
} & {
    fromValue(value: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "owner";
        readonly value: "OWNER";
        readonly display: "Owner";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "viewer";
        readonly value: "VIEWER";
        readonly display: "Viewer";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "contributor";
        readonly value: "CONTRIBUTOR";
        readonly display: "Contributor";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "admin";
        readonly value: "ADMIN";
        readonly display: "Admin";
    });
    tryFromValue(value?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "owner";
        readonly value: "OWNER";
        readonly display: "Owner";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "viewer";
        readonly value: "VIEWER";
        readonly display: "Viewer";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "contributor";
        readonly value: "CONTRIBUTOR";
        readonly display: "Contributor";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "admin";
        readonly value: "ADMIN";
        readonly display: "Admin";
    })) | undefined;
    fromKey(key: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "owner";
        readonly value: "OWNER";
        readonly display: "Owner";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "viewer";
        readonly value: "VIEWER";
        readonly display: "Viewer";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "contributor";
        readonly value: "CONTRIBUTOR";
        readonly display: "Contributor";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "admin";
        readonly value: "ADMIN";
        readonly display: "Admin";
    });
    tryFromKey(key?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "owner";
        readonly value: "OWNER";
        readonly display: "Owner";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "viewer";
        readonly value: "VIEWER";
        readonly display: "Viewer";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "contributor";
        readonly value: "CONTRIBUTOR";
        readonly display: "Contributor";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "admin";
        readonly value: "ADMIN";
        readonly display: "Admin";
    })) | undefined;
    items(): readonly ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "owner";
        readonly value: "OWNER";
        readonly display: "Owner";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "viewer";
        readonly value: "VIEWER";
        readonly display: "Viewer";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "contributor";
        readonly value: "CONTRIBUTOR";
        readonly display: "Contributor";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "admin";
        readonly value: "ADMIN";
        readonly display: "Admin";
    }))[];
    values(): readonly ("OWNER" | "VIEWER" | "CONTRIBUTOR" | "ADMIN")[];
    keys(): readonly ("owner" | "viewer" | "contributor" | "admin")[];
};
//# sourceMappingURL=albumMemberRole.d.ts.map