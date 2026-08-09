import { Enumeration, enumeration } from '@reharik/smart-enum';

const input = ['owner', 'converted'] as const;

export const AuthorizationOrigin = enumeration('AuthorizationOrigin', { input });
export type AuthorizationOrigin = Enumeration<typeof AuthorizationOrigin>;
