type OwnerNameParts = {
  firstName?: string | null;
  lastName?: string | null;
};

/**
 * "First Last" for the "shared with you by" lines, or '' when nothing is resolvable.
 *
 * The owner is always an active user with an enforced non-empty name, but the payload types
 * it nullable (owner is left-joined and both name parts are nullable String), so an empty
 * result stays possible. Callers omit the attribution rather than render a trailing blank.
 */
export const publicOwnerName = (owner: OwnerNameParts | null | undefined): string =>
  [owner?.firstName, owner?.lastName]
    .filter((part) => part != null && part.trim() !== '')
    .join(' ');
