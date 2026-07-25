// The ONE place the recipient-facing word for shared media lives.
//
// Today every share is photos, so both functions return "photo"/"photos"
// with correct pluralization. When video ships, these two functions are the
// only code that changes — no template touches the literal word. That is why
// no template may type "photo"/"photos" directly (see CLAUDE-adjacent rule in
// the email copy spec).

export type ContentCounts = { photos: number; videos?: number };

const total = (counts: ContentCounts): number => counts.photos + (counts.videos ?? 0);

// Bare noun. No arg (or any count that isn't exactly 1) → plural "photos";
// contentNoun(1) → singular "photo". The optional count exists only so the
// digest's singular phrases ("liked your photo") and the plural share copy can
// share one source of truth.
export const contentNoun = (count = 0): string => (count === 1 ? 'photo' : 'photos');

// "1 photo", "12 photos".
export const contentCount = (counts: ContentCounts): string => {
  const n = total(counts);
  return `${n} ${contentNoun(n)}`;
};
