import { type Enumeration } from '@reharik/smart-enum';
export type UserRoleEnum = Enumeration<typeof UserRoleEnum>;
export declare const UserRoleEnum: {
    [x: string]: Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: string;
        readonly value: string;
        readonly display: string;
    };
} & {
    fromValue(value: string): Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: string;
        readonly value: string;
        readonly display: string;
    };
    tryFromValue(value?: string | null): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: string;
        readonly value: string;
        readonly display: string;
    }) | undefined;
    fromKey(key: string): Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: string;
        readonly value: string;
        readonly display: string;
    };
    tryFromKey(key?: string | null): (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: string;
        readonly value: string;
        readonly display: string;
    }) | undefined;
    items(): readonly (Omit<import("@reharik/smart-enum").StandardEnumItem, "display" | "key" | "value"> & {} & {
        readonly key: string;
        readonly value: string;
        readonly display: string;
    })[];
    values(): readonly string[];
    keys(): readonly string[];
};
//# sourceMappingURL=userRole.d.ts.map