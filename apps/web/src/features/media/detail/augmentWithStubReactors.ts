import type { ReactionCountsFragment } from '../../../graphql/generated/types';
import type { ReactionCountsVM, ReactorVM } from '../../../viewModels/reaction';

// TODO: delete when backend exposes reactors on EmojiCount
const STUB_REACTORS: ReactorVM[] = [
  { id: 'u3', displayName: 'You', isViewer: true },
  { id: 'u1', displayName: 'Bob', isViewer: false },
  { id: 'u2', displayName: 'Carol', isViewer: false },
  { id: 'u4', displayName: 'Dave', isViewer: false },
  { id: 'u5', displayName: 'Eve', isViewer: false },
  { id: 'u6', displayName: 'Frank', isViewer: false },
  { id: 'u7', displayName: 'Grace', isViewer: false },
];

export const augmentWithStubReactors = (counts: ReactionCountsFragment): ReactionCountsVM => ({
  ...counts,
  byEmoji: counts.byEmoji.map((entry) => ({
    ...entry,
    // TODO: This temporarily ignores `count` to surface overflow UI in dev.
    // Revert to .slice(0, entry.count) before any merge, or remove the helper entirely
    // when backend reactors land.
    reactors: STUB_REACTORS,
  })),
});
