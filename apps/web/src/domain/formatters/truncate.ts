/**
 * Hard character cap with an ellipsis.
 *
 * Pair this with CSS `text-overflow: ellipsis` rather than choosing between them — they
 * guard different failure modes. The character cap is deterministic: the same title
 * renders the same length at every viewport width, which is what keeps a header row's
 * proportions stable. CSS ellipsis is the actual overflow backstop: a cap counts
 * characters, not pixels, so a title of wide glyphs ("WWWWW…") can still overrun its box
 * at the cap. The cap sets the look; the CSS guarantees the layout.
 *
 * The ellipsis is a single U+2026 character, so the result is at most `max` characters.
 */
export const truncate = (text: string, max: number): string =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
