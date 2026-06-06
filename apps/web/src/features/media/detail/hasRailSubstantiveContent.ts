export type HasRailSubstantiveContentInput = {
  title?: string | null;
  description?: string | null;
  reactionTotal: number;
  commentCount: number;
};

export const hasRailSubstantiveContent = (input: HasRailSubstantiveContentInput): boolean => {
  const title = input.title?.trim();
  const description = input.description?.trim();

  return (
    (title != null && title.length > 0) ||
    (description != null && description.length > 0) ||
    input.reactionTotal > 0 ||
    input.commentCount > 0
  );
};
