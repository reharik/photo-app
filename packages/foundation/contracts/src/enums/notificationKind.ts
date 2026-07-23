import { enumeration, EnumSubset, pickEnum, type Enumeration } from '@reharik/smart-enum';
import { EntityType } from './graphqlSmartEnums';

// Merges the former InAppNotificationType + AsyncNotificationKind into one enum.
// Full union of every notification kind that exists. Which branch consumes a kind
// is a ROUTING fact (declared on each strategy's `branches`), NOT an enum-membership
// fact — so reactionAdded lives here even though only the async branch sends it.
//
// CONFIRM: mirror your actual @reharik/smart-enum construction. This shows the
// intended membership + that it's a smart enum (.value at Knex boundaries, .equals,
// .match all available downstream).

const input = [
  'commentPosted',
  'replyPosted',
  'albumShared',
  'itemAdded',
  'itemShared',
  'reactionAdded',
  'guestAlbumShared',
] as const;
export type NotificationKind = Enumeration<typeof NotificationKind>;
export const NotificationKind = enumeration<typeof input>('NotificationKind', {
  input,
});

export type NotificationContainerType = EnumSubset<EntityType, 'album' | 'comment' | 'mediaItem'>;
export type NotificationSubjectType = EnumSubset<
  EntityType,
  'album' | 'comment' | 'mediaItem' | 'authorization' | 'reaction'
>;
export const NotificationContainerType = pickEnum(EntityType, ['album', 'comment', 'mediaItem']);
export const NotificationSubjectType = pickEnum(EntityType, [
  'album',
  'comment',
  'mediaItem',
  'reaction',
  'authorization',
]);
