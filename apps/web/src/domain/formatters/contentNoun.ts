/**
 * The user-facing noun for a piece of media, and the count phrase built from it.
 *
 * A deliberate web-local twin of the notifications package's `contentNoun`, NOT an import
 * across the package wall: `apps/web` depends on `@packages/contracts` only, and
 * `@packages/notifications` is a server-side react-email context. Two four-line functions
 * are a better trade than a frontend dependency on an email-rendering package.
 *
 * Count-based rather than a boolean so a future mixed-media library can branch on per-kind
 * counts ("3 photos and a video") without changing a single call site.
 */
export const contentNoun = (count = 0): string => (count === 1 ? 'photo' : 'photos');

/** "1 photo" / "4 photos". */
export const contentCount = (count: number): string => `${count} ${contentNoun(count)}`;
