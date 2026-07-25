// Only accept a same-origin internal path — guards against open-redirect via
// crafted router state OR a crafted ?returnTo= URL param. Rejects absolute URLs
// (no leading '/') and protocol-relative '//host' paths.
export const safeReturnTo = (value: string | undefined): string =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
