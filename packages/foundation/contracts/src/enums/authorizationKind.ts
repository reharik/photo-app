import { Enumeration, enumeration } from '@reharik/smart-enum';

const input = ['user', 'public', 'pending'] as const;

export const AuthorizationKind = enumeration('AuthorizationKind', { input });
export type AuthorizationKind = Enumeration<typeof AuthorizationKind>;
