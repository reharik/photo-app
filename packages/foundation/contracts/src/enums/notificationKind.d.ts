import { type Enumeration } from '@reharik/smart-enum';
export type NotificationKindEnum = Enumeration<typeof NotificationKindEnum>;
export declare const NotificationKindEnum: {
    comment: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "comment";
        readonly value: "COMMENT";
        readonly display: "Comment";
    };
    shareInvite: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "shareInvite";
        readonly value: "SHARE_INVITE";
        readonly display: "Share Invite";
    };
    albumShared: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "albumShared";
        readonly value: "ALBUM_SHARED";
        readonly display: "Album Shared";
    };
    mediaAdded: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "mediaAdded";
        readonly value: "MEDIA_ADDED";
        readonly display: "Media Added";
    };
    commentReply: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "commentReply";
        readonly value: "COMMENT_REPLY";
        readonly display: "Comment Reply";
    };
} & {
    fromValue(value: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "comment";
        readonly value: "COMMENT";
        readonly display: "Comment";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "shareInvite";
        readonly value: "SHARE_INVITE";
        readonly display: "Share Invite";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "albumShared";
        readonly value: "ALBUM_SHARED";
        readonly display: "Album Shared";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "mediaAdded";
        readonly value: "MEDIA_ADDED";
        readonly display: "Media Added";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "commentReply";
        readonly value: "COMMENT_REPLY";
        readonly display: "Comment Reply";
    });
    tryFromValue(value?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "comment";
        readonly value: "COMMENT";
        readonly display: "Comment";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "shareInvite";
        readonly value: "SHARE_INVITE";
        readonly display: "Share Invite";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "albumShared";
        readonly value: "ALBUM_SHARED";
        readonly display: "Album Shared";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "mediaAdded";
        readonly value: "MEDIA_ADDED";
        readonly display: "Media Added";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "commentReply";
        readonly value: "COMMENT_REPLY";
        readonly display: "Comment Reply";
    })) | undefined;
    fromKey(key: string): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "comment";
        readonly value: "COMMENT";
        readonly display: "Comment";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "shareInvite";
        readonly value: "SHARE_INVITE";
        readonly display: "Share Invite";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "albumShared";
        readonly value: "ALBUM_SHARED";
        readonly display: "Album Shared";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "mediaAdded";
        readonly value: "MEDIA_ADDED";
        readonly display: "Media Added";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "commentReply";
        readonly value: "COMMENT_REPLY";
        readonly display: "Comment Reply";
    });
    tryFromKey(key?: string | null): ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "comment";
        readonly value: "COMMENT";
        readonly display: "Comment";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "shareInvite";
        readonly value: "SHARE_INVITE";
        readonly display: "Share Invite";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "albumShared";
        readonly value: "ALBUM_SHARED";
        readonly display: "Album Shared";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "mediaAdded";
        readonly value: "MEDIA_ADDED";
        readonly display: "Media Added";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "commentReply";
        readonly value: "COMMENT_REPLY";
        readonly display: "Comment Reply";
    })) | undefined;
    items(): readonly ((Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "comment";
        readonly value: "COMMENT";
        readonly display: "Comment";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "shareInvite";
        readonly value: "SHARE_INVITE";
        readonly display: "Share Invite";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "albumShared";
        readonly value: "ALBUM_SHARED";
        readonly display: "Album Shared";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "mediaAdded";
        readonly value: "MEDIA_ADDED";
        readonly display: "Media Added";
    }) | (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: "commentReply";
        readonly value: "COMMENT_REPLY";
        readonly display: "Comment Reply";
    }))[];
    values(): readonly ("COMMENT" | "SHARE_INVITE" | "ALBUM_SHARED" | "MEDIA_ADDED" | "COMMENT_REPLY")[];
    keys(): readonly ("comment" | "shareInvite" | "albumShared" | "mediaAdded" | "commentReply")[];
};
//# sourceMappingURL=notificationKind.d.ts.map