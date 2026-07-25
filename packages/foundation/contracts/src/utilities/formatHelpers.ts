export const toDisplayName = <T extends { firstName?: string; lastName?: string }>(
  person: T,
  fallback = 'Someone',
): string =>
  [person.firstName, person.lastName]
    .map((n) => n?.trim())
    .filter(Boolean)
    .join(' ') || fallback;
