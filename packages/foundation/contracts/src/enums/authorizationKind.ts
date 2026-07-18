import { Enumeration, enumeration } from '@reharik/smart-enum';

const input = ['user', 'publicLink'] as const;

export const AuthorizationKind = enumeration('AuthorizationKind', { input });
export type AuthorizationKind = Enumeration<typeof AuthorizationKind>;
