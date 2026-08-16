import {
  AlbumMemberRole,
  AppErrorCollection,
  AuthorizationOrigin,
  ContractError,
  fail,
  MediaKind,
  ok,
  Operation,
  OperationResult,
} from '@packages/contracts';
import { eachIndependently } from '../../infrastructure';
import type { ActorId, EntityId } from '../../types/types';
import { AggregateRoot } from '../AggregateRoot';
import { grantAuthorizationValidation } from '../Authorization/grantAuthorizationValidation';
import {
  PendingUserAuthorization,
  PendingUserAuthorizationRecord,
} from '../Authorization/PendingUserAuthorization';
import {
  PublicLinkAuthorization,
  PublicLinkAuthorizationRecord,
} from '../Authorization/PublicLinkAuthorization';
import { UserAuthorization, UserAuthorizationRecord } from '../Authorization/UserAuthorization';
import type { AuditRecord, ChildEntities } from '../Entity';
import { reorderAlbumItems } from '../utilities/reorderAlbumItems';
import { AlbumItem, AlbumItemRecord } from './AlbumItem';
import { ALBUM_ITEM_ORDER_GAP, ALBUM_ITEM_ORDER_INITIAL } from './albumItemOrder';
import { AlbumMember, AlbumMemberRecord } from './AlbumMember';

export type AlbumAuthorizationInput = {
  actorId: ActorId;
  grantedToUserId: EntityId;
  label?: string;
};

export type AlbumProps = CreateAlbumInput & {
  coverMediaId?: EntityId | null;
};

export type CreateAlbumInput = {
  title: string;
  isShadowAlbum?: boolean;
};

export type AlbumRecord = AlbumProps & { id: EntityId } & AuditRecord;

export type AlbumChildRecords = {
  items: AlbumItemRecord[];
  members: AlbumMemberRecord[];
  authorizations: UserAuthorizationRecord[];
  pendingUserAuthorizations: PendingUserAuthorizationRecord[];
  publicLinks: PublicLinkAuthorizationRecord[];
};

export class Album extends AggregateRoot<AlbumRecord> {
  protected props: AlbumProps;

  #items: AlbumItem[] = [];
  #members: AlbumMember[] = [];
  #authorizations: UserAuthorization[] = [];
  #publicLinks: PublicLinkAuthorization[] = [];
  #pendingUserAuthorizations: PendingUserAuthorization[] = [];
  #removedItems: AlbumItem[] = [];
  #removedMembers: AlbumMember[] = [];
  #removedAuthorizations: UserAuthorization[] = [];
  #removedPublicLinks: PublicLinkAuthorization[] = [];
  #removedPendingUserAuthorizations: PendingUserAuthorization[] = [];

  private constructor(actorId: ActorId, props: AlbumProps, id?: EntityId) {
    super(id, actorId, 'album');
    this.props = props;
  }

  static create(input: CreateAlbumInput, actorId: ActorId): Album {
    const album = new Album(actorId, {
      title: input.title,
      isShadowAlbum: input.isShadowAlbum,
    });
    const member = AlbumMember.create(
      { userId: actorId, role: AlbumMemberRole.owner, albumId: album.id() },
      actorId,
    );
    album.#members.push(member);
    return album;
  }

  static rehydrate(record: AlbumRecord, childRecords: AlbumChildRecords): Album {
    const album = new Album(
      record.createdBy,
      {
        title: record.title,
        coverMediaId: record.coverMediaId ?? undefined,
      },
      record.id,
    );

    album.rehydrateAudit(record);
    album.#items = childRecords.items.map((r) => AlbumItem.rehydrate(r));
    album.#members = childRecords.members.map((r) => AlbumMember.rehydrate(r));
    album.#authorizations = childRecords.authorizations.map((r) => UserAuthorization.rehydrate(r));
    album.#pendingUserAuthorizations = childRecords.pendingUserAuthorizations.map((r) =>
      PendingUserAuthorization.rehydrate(r),
    );
    album.#publicLinks = childRecords.publicLinks.map((r) => PublicLinkAuthorization.rehydrate(r));
    return album;
  }

  private nextOrderIndex(): bigint {
    if (this.#items.length === 0) {
      return ALBUM_ITEM_ORDER_INITIAL;
    }
    let max = 0n;
    for (const item of this.#items) {
      const o = item.orderIndex();
      if (o > max) {
        max = o;
      }
    }
    return max + ALBUM_ITEM_ORDER_GAP;
  }

  addItem(
    mediaItemId: EntityId,
    actorId: ActorId,
    mediaKind: MediaKind,
  ): OperationResult<AlbumItem> {
    if (this.#items.some((i) => i.mediaItemId() === mediaItemId)) {
      return fail(AppErrorCollection.album.MediaAlreadyInAlbum);
    }
    // TODO: check various invariants when they exist e.g. is album mutable
    if (mediaKind.equals(MediaKind.photo)) {
      this.props.coverMediaId = this.props.coverMediaId ?? mediaItemId;
    }
    const albumItem = AlbumItem.create(
      { mediaItemId, orderIndex: this.nextOrderIndex(), albumId: this.id() },
      actorId,
    );
    this.#items.push(albumItem);
    this.touch(actorId);
    this.recordEvent(
      'mediaItemAddedToAlbum',
      { albumId: this.id(), mediaItemId: albumItem.mediaItemId() },
      actorId,
    );
    return ok(albumItem);
  }

  reorderItems(orderedAlbumItemIds: EntityId[], actorId: ActorId): OperationResult {
    const reorder = reorderAlbumItems(orderedAlbumItemIds, this.#items, actorId);
    if (!reorder.success) {
      return reorder;
    }

    this.#items = reorder.value ?? [];
    this.touch(actorId);
    return ok(undefined);
  }

  addMember(
    userId: EntityId,
    role: AlbumMemberRole,
    actorId: ActorId,
  ): OperationResult<AlbumMember> {
    if (role.equals(AlbumMemberRole.owner)) {
      return fail(AppErrorCollection.album.CanNotAddMoreThanOneAlbumOwner);
    }
    const actingMember = this.#members.find((m) => m.userId() === actorId);
    if (!actingMember || !actingMember.role().can(Operation.addMembers)) {
      return fail(Operation.addMembers.deniedError);
    }
    if (this.#members.some((m) => m.userId() === userId)) {
      return fail(AppErrorCollection.album.UserAlreadyMember);
    }
    const newMember = AlbumMember.create({ userId, role, albumId: this.id() }, actorId);
    this.#members.push(newMember);
    this.touch(actorId);
    return ok(newMember);
  }

  removeMember(albumMemberId: EntityId, actorId: ActorId): OperationResult<AlbumMember> {
    const actingMember = this.#members.find((m) => m.userId() === actorId);
    if (!actingMember || !actingMember.role().can(Operation.removeMembers)) {
      return fail(Operation.removeMembers.deniedError);
    }
    const targetMember = this.#members.find((m) => m.id() === albumMemberId);
    if (!targetMember) {
      return fail(AppErrorCollection.album.UserIsNotMember);
    }
    if (targetMember.role().equals(AlbumMemberRole.owner)) {
      return fail(AppErrorCollection.album.CanNotRemoveOwnerOfAlbum);
    }
    this.#members = this.#members.filter((x) => x.id() !== albumMemberId);
    this.#removedMembers.push(targetMember);
    this.touch(actorId);
    return ok(targetMember);
  }

  updateMember(
    albumMemberId: EntityId,
    role: AlbumMemberRole,
    actorId: ActorId,
  ): OperationResult<AlbumMember> {
    const actingMember = this.#members.find((m) => m.userId() === actorId);
    if (!actingMember || !actingMember.role().can(Operation.addMembers)) {
      return fail(Operation.addMembers.deniedError);
    }
    const targetMember = this.#members.find((m) => m.id() === albumMemberId);
    if (!targetMember) {
      return fail(AppErrorCollection.album.UserIsNotMember);
    }
    if (targetMember.role().equals(AlbumMemberRole.owner)) {
      return fail(AppErrorCollection.album.CanNotUpdateOwnerOfAlbum);
    }
    targetMember.changeRole(role, actorId);

    this.touch(actorId);
    return ok(targetMember);
  }

  coverMediaId(): EntityId | undefined {
    return this.props.coverMediaId ?? undefined;
  }

  /* Currently the rule is that album cover must be a reference to a 
  media item that is part of the album.  This is an easier implementation for now. 
  If we decide to open that up there are two ways to do it.  We could add a 
  role to the albumItem that state whether to display it or not ( in the album item list ),
  or perhaps just state that it's of kind albumCover.
  Another way would be to have the albumCoverMedia reference a media item directly with out
  requiring it to be part of the albumItems.  In the later case we must make sure to 
  check that the mediaItem has the status of ready as we wont have the previous albumItem check.*/
  setCoverMedia(albumItemId: EntityId, actorId: ActorId): OperationResult {
    const albumItem = this.#items.find((i) => i.id() === albumItemId);
    if (!albumItem) {
      return fail(AppErrorCollection.album.CoverMediaNotPartOfAlbum);
    }
    this.props.coverMediaId = albumItem.mediaItemId();
    this.touch(actorId);
    return ok(undefined);
  }

  unsetCoverMedia(actorId: ActorId): OperationResult {
    this.props.coverMediaId = null;
    this.touch(actorId);
    return ok(undefined);
  }

  title(): string {
    return this.props.title;
  }

  /**
   * Removes every album item that references this media (at most one per album under normal DB constraints).
   * If the album cover pointed at this media, clears the cover so the aggregate stays consistent.
   */
  removeMediaItemFromAlbum(mediaItemId: EntityId, actorId: ActorId): OperationResult {
    // TODO: check various invariants when they exist e.g. is album mutable
    this.#removedItems = this.#items.filter((i) => i.mediaItemId() === mediaItemId);
    this.#items = this.#items.filter((i) => i.mediaItemId() !== mediaItemId);
    const coverWasThisMedia = this.props.coverMediaId === mediaItemId;
    if (coverWasThisMedia) {
      this.props.coverMediaId = null;
    }
    // if (coverWasThisMedia) {
    this.touch(actorId);
    // }
    this.recordEvent('mediaItemRemovedFromAlbum', { albumId: this.id(), mediaItemId }, actorId);
    return ok(undefined);
  }

  deleteItems(albumItemIds: EntityId[], actorId: ActorId): OperationResult {
    // TODO: check various invariants when they exist e.g. is album mutable
    if (albumItemIds.length === 0) {
      return fail(AppErrorCollection.album.DeleteAlbumItemsNoItemIds);
    }
    const found = this.#items.filter((i) => albumItemIds.includes(i.id()));
    if (found.length !== albumItemIds.length) {
      return fail(AppErrorCollection.album.MediaItemNotInAlbum);
    }
    this.#items = this.#items.filter((i) => !albumItemIds.includes(i.id()));
    this.props.coverMediaId = !found.some((i) => i.mediaItemId() === this.props.coverMediaId)
      ? this.props.coverMediaId
      : null;
    this.#removedItems = [...this.#removedItems, ...found];
    this.touch(actorId);
    found.forEach((x) =>
      this.recordEvent(
        'mediaItemRemovedFromAlbum',
        { albumId: this.id(), mediaItemId: x.mediaItemId() },
        actorId,
      ),
    );
    return ok(undefined);
  }

  getAlbumMemberByUserId(userId: EntityId): AlbumMember | undefined {
    return this.#members.find((m) => m.userId() === userId) ?? undefined;
  }

  getAlbumItem(albumItemId: EntityId): AlbumItem | undefined {
    return this.#items.find((i) => i.id() === albumItemId) ?? undefined;
  }

  getMediaItemIds(): EntityId[] {
    return this.#items.map((i) => i.mediaItemId());
  }

  getAuthorizations(): UserAuthorization[] {
    return this.#authorizations;
  }

  grantAuthorization(input: AlbumAuthorizationInput): OperationResult<{
    authorization: UserAuthorization;
  }> {
    const { actorId, grantedToUserId, label } = input;
    const result = grantAuthorizationValidation(this, grantedToUserId, actorId, label);
    if (!result.success) {
      return result;
    }

    // this has been stripped down, can probably be cleaned up
    const existingAuthorization = this.#authorizations.find(
      (s) => s.grantedToUser() === grantedToUserId,
    );
    if (!existingAuthorization) {
      const authorization = UserAuthorization.create(
        {
          grantedToUser: grantedToUserId,
          grantedBy: actorId,
          label,
          albumId: this.id(),
        },
        actorId,
      );
      this.#authorizations.push(authorization);
      this.touch(actorId);
      this.recordEvent(
        'albumSharedWithUser',
        { userId: grantedToUserId, albumId: this.id(), authorizationId: authorization.id() },
        actorId,
      );
      return ok({ authorization });
    }

    if (label && result.value.status === 'updateLabel') {
      const updatedLabel = existingAuthorization.updateLabel(label, actorId);
      if (!updatedLabel.success) {
        return updatedLabel;
      }
      this.touch(actorId);
    }

    return ok({ authorization: existingAuthorization });
  }
  /**
   * Why: this is a soft delete, so the `access_grant` row survives and the FK cascade that
   * used to clear `grant` no longer fires. AuthorizationReconciliation deliberately no
   * longer handles revoke/expire, because post-commit publishing is best-effort — handler
   * throws are swallowed and in-flight events are lost on a crash or deploy. A missed
   * teardown is PERMANENT: reconciliation only ever visits authorizations that are still
   * active (getAuthorizationsByAlbumId filters `revokedAt`/`expiresAt`), so nothing
   * revisits a revoked one, and most readers of `grant` — hasActiveGrant,
   * hasActiveGrantPermission, withAlbumItemViewableByMemberOrGrant,
   * mediaItemReadRepository.getForViewer — treat a `grant` row as sufficient proof of
   * access without checking the authorization behind it. The revoked user would keep
   * listing the album and fetching the bytes forever.
   */
  revokeAuthorization(authorizationId: EntityId, actorId: ActorId): OperationResult {
    const authorization =
      this.#authorizations.find((s) => s.id() === authorizationId) ??
      this.#pendingUserAuthorizations.find((s) => s.id() === authorizationId);
    if (!authorization) {
      return fail(AppErrorCollection.authorization.AuthorizationNotFound);
    }
    const authorizingMember = this.getAlbumMemberByUserId(actorId);
    if (!authorizingMember || !authorizingMember.role().can(Operation.grantAlbumAuthorization)) {
      return fail(Operation.grantAlbumAuthorization.deniedError);
    }

    // can't revoke from owner
    const member = this.getAlbumMemberByUserId(authorization.grantedToUser());
    if (member && member.role().equals(AlbumMemberRole.owner)) {
      return fail(AppErrorCollection.authorization.CanNotGrantAuthorizationToOwner);
    }

    // can't revoke yourself
    if (authorization.grantedToUser() === actorId) {
      return fail(AppErrorCollection.album.CanNotRemoveYourselfFromAlbum);
    }

    // Soft delete
    const result = authorization.revokeAuthorization(actorId);
    if (!result.success) {
      return result;
    }
    this.touch(actorId);
    return ok(undefined);
  }

  getPendingUserAuthorizations(): PendingUserAuthorization[] {
    return this.#pendingUserAuthorizations;
  }

  grantPendingUserAuthorization(input: AlbumAuthorizationInput): OperationResult<{
    authorization: PendingUserAuthorization;
  }> {
    const { actorId, grantedToUserId, label } = input;
    const result = grantAuthorizationValidation(this, grantedToUserId, actorId, label);
    if (!result.success) {
      return result;
    }

    const existingPendingUserAuthorization = this.#pendingUserAuthorizations.find(
      (s) => s.grantedToUser() === grantedToUserId,
    );
    if (!existingPendingUserAuthorization) {
      const pendingUserAuthorization = PendingUserAuthorization.create(
        {
          grantedToUser: grantedToUserId,
          grantedBy: actorId,
          label,
          albumId: this.id(),
        },
        actorId,
      );
      this.#pendingUserAuthorizations.push(pendingUserAuthorization);
      this.touch(actorId);
      this.recordEvent(
        'albumSharedWithPendingUser',
        {
          userId: grantedToUserId,
          albumId: this.id(),
          authorizationId: pendingUserAuthorization.id(),
        },
        actorId,
      );
      return ok({ authorization: pendingUserAuthorization });
    }
    this.recordEvent(
      'albumSharedWithPendingUser',
      {
        userId: grantedToUserId,
        albumId: this.id(),
        authorizationId: existingPendingUserAuthorization.id(),
      },
      actorId,
    );
    // TODO if this is not causing problems remove it and remove it from the validation above as well
    // if (label && result.value.status === 'updateLabel') {
    //   const updatedLabel = existingPendingUserAuthorization.updateLabel(label, actorId);
    //   if (!updatedLabel.success) {
    //     return updatedLabel;
    //   }
    //   this.touch(actorId);
    // }

    return ok({ authorization: existingPendingUserAuthorization });
  }

  getPublicLinks(): PublicLinkAuthorization[] {
    return this.#publicLinks;
  }

  grantPublicLink(
    input: Omit<AlbumAuthorizationInput, 'grantedToUserId'>,
  ): OperationResult<PublicLinkAuthorization> {
    const { actorId, label } = input;
    const member = this.getAlbumMemberByUserId(actorId);
    if (!member || !member.role().can(Operation.grantAlbumAuthorization)) {
      return fail(Operation.grantAlbumAuthorization.deniedError);
    }

    let publicLink = this.#publicLinks.find((x) => {
      const exp = x.expiresAt();
      return (
        !x.revokedAt() &&
        (!exp || (exp > new Date() && x.origin().equals(AuthorizationOrigin.owner)))
      );
    });

    if (!publicLink) {
      // creating a new public link creates a new authorization/access_grant
      publicLink = PublicLinkAuthorization.create(
        {
          grantedBy: actorId,
          label,
          albumId: this.id(),
        },
        actorId,
      );
      this.#publicLinks.push(publicLink);
      this.touch(actorId);
      this.recordEvent(
        'albumSharedWithPublicLink',
        { albumId: this.id(), authorizationId: publicLink.id() },
        actorId,
      );

      return ok(publicLink);
    }

    return ok(publicLink);
  }

  revokePublicLinks(actorId: ActorId): OperationResult<EntityId[]> {
    const authorizingMember = this.getAlbumMemberByUserId(actorId);
    if (!authorizingMember || !authorizingMember.role().can(Operation.grantAlbumAuthorization)) {
      return fail(Operation.grantAlbumAuthorization.deniedError);
    }
    if (this.#publicLinks.length === 0) {
      return ok([]);
    }
    // Soft delete
    const authorizationIds = eachIndependently(this.#publicLinks, (x) => {
      const result = x.revokeAuthorization(actorId);
      if (!result.success) {
        return result;
      }
      return ok(x.id());
    });

    this.touch(actorId);
    return ok(authorizationIds.succeeded.map((x) => x.value));
  }

  activatePendingUserAuthorization(id: string, actorId: string): OperationResult<void> {
    const existingAuthorization = this.#pendingUserAuthorizations.find((x) => x.id() === id);
    if (!existingAuthorization) {
      return fail(ContractError.noAuthorizationFoundForId);
    }
    const { userAuthorization, publicLinkAuthorization } =
      existingAuthorization.convertAndCreate(actorId);
    this.#authorizations.push(userAuthorization);
    // Filtered out of #pendingUserAuthorizations WITHOUT being pushed to
    // #removedPendingUserAuthorizations, and that asymmetry is intentional: the access_grant
    // row is REUSED by the PublicLinkAuthorization below (fromConverted keeps the same id),
    // not deleted. Adding it to the removed list would make childEntities() emit a DELETE for
    // the very row the publicLinks upsert is about to write — a delete/insert race on one id.
    // Dropping it from the pending list is enough: the row leaves this collection and is
    // persisted from the other.
    this.#pendingUserAuthorizations = this.#pendingUserAuthorizations.filter((x) => x.id() !== id);
    this.#publicLinks.push(publicLinkAuthorization);
    this.recordEvent(
      'pendingUserActivated',
      { userId: userAuthorization.grantedToUser(), authorizationIds: [userAuthorization.id()] },
      actorId,
    );
    return ok(undefined);
  }
  childEntities(): ChildEntities {
    return {
      items: { upsert: this.#items, removed: this.#removedItems },
      members: { upsert: this.#members, removed: this.#removedMembers },
      authorizations: { upsert: this.#authorizations, removed: this.#removedAuthorizations },
      publicLinks: { upsert: this.#publicLinks, removed: this.#removedPublicLinks },
      pendingUserAuthorizations: {
        upsert: this.#pendingUserAuthorizations,
        removed: this.#removedPendingUserAuthorizations,
      },
    };
  }
}
