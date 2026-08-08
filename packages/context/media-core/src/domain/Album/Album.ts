import {
  AlbumMemberRole,
  AppErrorCollection,
  ContractError,
  fail,
  MediaKind,
  ok,
  Operation,
  WriteResult,
} from '@packages/contracts';
import { EnumArraysAreEqual } from '@packages/infrastructure';
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
  operations: Operation[];
  actorId: ActorId;
  grantedToUserId: EntityId;
  label?: string;
  expiresAt?: Date;
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

  addItem(mediaItemId: EntityId, actorId: ActorId, mediaKind: MediaKind): WriteResult<AlbumItem> {
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

  reorderItems(orderedAlbumItemIds: EntityId[], actorId: ActorId): WriteResult {
    const reorder = reorderAlbumItems(orderedAlbumItemIds, this.#items, actorId);
    if (!reorder.success) {
      return reorder;
    }

    this.#items = reorder.value ?? [];
    this.touch(actorId);
    return ok(undefined);
  }

  addMember(userId: EntityId, role: AlbumMemberRole, actorId: ActorId): WriteResult<AlbumMember> {
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

  removeMember(albumMemberId: EntityId, actorId: ActorId): WriteResult<AlbumMember> {
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
  setCoverMedia(albumItemId: EntityId, actorId: ActorId): WriteResult {
    const albumItem = this.#items.find((i) => i.id() === albumItemId);
    if (!albumItem) {
      return fail(AppErrorCollection.album.CoverMediaNotPartOfAlbum);
    }
    this.props.coverMediaId = albumItem.mediaItemId();
    this.touch(actorId);
    return ok(undefined);
  }

  unsetCoverMedia(actorId: ActorId): WriteResult {
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
  removeMediaItemFromAlbum(mediaItemId: EntityId, actorId: ActorId): WriteResult {
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

  deleteItems(albumItemIds: EntityId[], actorId: ActorId): WriteResult {
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

  grantAuthorization(input: AlbumAuthorizationInput): WriteResult<{
    authorization: UserAuthorization;
  }> {
    const { operations, actorId, grantedToUserId, label, expiresAt } = input;
    const result = grantAuthorizationValidation(this, grantedToUserId, label, expiresAt);
    if (!result.success) {
      return result;
    }

    // Maybe this should not be an upsert, we'll see.
    const existingAuthorization = this.#authorizations.find(
      (s) => s.grantedToUser() === grantedToUserId,
    );
    if (!existingAuthorization) {
      const authorization = UserAuthorization.create(
        {
          operations,
          grantedToUser: grantedToUserId,
          grantedBy: actorId,
          label,
          expiresAt,
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

    if (expiresAt && result.value.status === 'updateExpireDate') {
      const updatedExpireDate = existingAuthorization.updateExpireDate(expiresAt, actorId);
      if (!updatedExpireDate.success) {
        return updatedExpireDate;
      }
      this.touch(actorId);
    }

    if (label && result.value.status === 'updateLabel') {
      const updatedLabel = existingAuthorization.updateLabel(label, actorId);
      if (!updatedLabel.success) {
        return updatedLabel;
      }
      this.touch(actorId);
    }
    if (operations && !EnumArraysAreEqual(existingAuthorization.operations(), operations)) {
      const updatedOperations = existingAuthorization.updateOperations(operations, actorId);
      if (!updatedOperations.success) {
        return updatedOperations;
      }
      this.touch(actorId);
      // not handling yet. implement please
      // this.recordEvent(
      //   'authorizationOperationsUpdated',
      //   { authorizationId: existingAuthorization.id() },
      //   actorId,
      // );
    }
    return ok({ authorization: existingAuthorization });
  }
  /**
   * ⚠️ NOT WIRED YET — no write service or mutation calls this. When it goes live, the
   * CALLING SERVICE MUST DELETE THE MATERIALIZED `grant` ROWS SYNCHRONOUSLY, inside the
   * same unit of work as this revoke. Do not rely on the `authorizationRevoked` event.
   *
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
   *
   * Gotcha: SystemGrantRepository is a SINGLETON on the raw `database` handle, so calling
   * it as-is autocommits OUTSIDE the uow — not atomic, and it still deletes if the uow
   * later rolls back (cutting off a user who was never revoked). Pass `uow.db()` in, or
   * add a scoped repository that reads it.
   *
   * The same applies to revokePendingUserAuthorization and revokePublicLink below.
   */
  revokeAuthorization(authorizationId: EntityId, actorId: ActorId): WriteResult {
    const authorization = this.#authorizations.find((s) => s.id() === authorizationId);
    if (!authorization) {
      return fail(AppErrorCollection.authorization.AuthorizationNotFound);
    }

    // Soft delete
    const result = authorization.revokeAuthorization(actorId);
    if (!result.success) {
      return result;
    }
    this.touch(actorId);
    this.recordEvent('authorizationRevoked', { authorizationId: authorizationId }, actorId);
    return ok(undefined);
  }

  getPendingUserAuthorizations(): PendingUserAuthorization[] {
    return this.#pendingUserAuthorizations;
  }

  grantPendingUserAuthorization(input: AlbumAuthorizationInput): WriteResult<{
    authorization: PendingUserAuthorization;
  }> {
    const { operations, actorId, grantedToUserId, label, expiresAt } = input;
    const result = grantAuthorizationValidation(this, grantedToUserId, label, expiresAt);
    if (!result.success) {
      return result;
    }

    const existingPendingUserAuthorization = this.#pendingUserAuthorizations.find(
      (s) => s.grantedToUser() === grantedToUserId,
    );
    if (!existingPendingUserAuthorization) {
      const pendingUserAuthorization = PendingUserAuthorization.create(
        {
          operations,
          grantedToUser: grantedToUserId,
          grantedBy: actorId,
          label,
          expiresAt,
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

    if (expiresAt && result.value.status === 'updateExpireDate') {
      const updatedExpireDate = existingPendingUserAuthorization.updateExpireDate(
        expiresAt,
        actorId,
      );
      if (!updatedExpireDate.success) {
        return updatedExpireDate;
      }
      this.touch(actorId);
    }

    if (label && result.value.status === 'updateLabel') {
      const updatedLabel = existingPendingUserAuthorization.updateLabel(label, actorId);
      if (!updatedLabel.success) {
        return updatedLabel;
      }
      this.touch(actorId);
    }
    if (
      operations &&
      !EnumArraysAreEqual(existingPendingUserAuthorization.operations(), operations)
    ) {
      const updatedOperations = existingPendingUserAuthorization.updateOperations(
        operations,
        actorId,
      );
      if (!updatedOperations.success) {
        return updatedOperations;
      }
      this.touch(actorId);
      // not handling yet
      // this.recordEvent(
      //   'authorizationOperationsUpdated',
      //   { authorizationId: existingAuthorization.id() },
      //   actorId,
      // );
    }
    return ok({ authorization: existingPendingUserAuthorization });
  }
  /**
   * ⚠️ NOT WIRED YET. As with revokeAuthorization above: when this goes live the calling
   * service must delete this authorization's materialized `grant` rows synchronously in
   * the same unit of work. `pendingUserAuthorizationRevoked` has no subscriber and must
   * not be relied on for teardown. See revokeAuthorization for the full rationale.
   */
  revokePendingUserAuthorization(
    pendingUserAuthorizationId: EntityId,
    actorId: ActorId,
  ): WriteResult {
    const pendingUserAuthorization = this.#pendingUserAuthorizations.find(
      (s) => s.id() === pendingUserAuthorizationId,
    );
    if (!pendingUserAuthorization) {
      return fail(AppErrorCollection.authorization.AuthorizationNotFound);
    }
    // Soft delete
    const result = pendingUserAuthorization.revokeAuthorization(actorId);
    if (!result.success) {
      return result;
    }

    this.recordEvent(
      'pendingUserAuthorizationRevoked',
      { authorizationId: pendingUserAuthorizationId },
      actorId,
    );
    return ok(undefined);
  }

  getPublicLinks(): PublicLinkAuthorization[] {
    return this.#publicLinks;
  }

  grantPublicLink(
    input: Omit<AlbumAuthorizationInput, 'grantedToUserId'>,
  ): WriteResult<PublicLinkAuthorization> {
    const { operations, actorId, label, expiresAt } = input;
    let publicLink = this.#publicLinks.find((x) => {
      const exp = x.expiresAt();
      return !x.revokedAt() && (!exp || exp > new Date());
    });

    if (!publicLink) {
      // creating a new public link creates a new authorization/access_grant
      publicLink = PublicLinkAuthorization.create(
        {
          operations: operations ?? [],
          grantedBy: actorId,
          label,
          expiresAt,
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
    if (expiresAt && publicLink.expiresAt() !== expiresAt) {
      const updatedExpireDate = publicLink.updateExpireDate(expiresAt, actorId);
      if (!updatedExpireDate.success) {
        return updatedExpireDate;
      }
      this.touch(actorId);
    }
    return ok(publicLink);
  }

  /**
   * ⚠️ NOT WIRED YET. As with revokeAuthorization above: when this goes live the calling
   * service must delete this link's materialized `grant` rows synchronously in the same
   * unit of work. `publicLinkRevoked` has no subscriber and must not be relied on for
   * teardown. Public links are the sharper case — the token keeps working for anyone who
   * has it. See revokeAuthorization for the full rationale.
   */
  revokePublicLink(publicLinkId: EntityId, actorId: ActorId): WriteResult {
    const publicLink = this.#publicLinks.find((s) => s.id() === publicLinkId);
    if (!publicLink) {
      return fail(AppErrorCollection.authorization.PublicLinkNotFound);
    }

    // Soft delete
    const result = publicLink.revokeAuthorization(actorId);
    if (!result.success) {
      return result;
    }

    this.touch(actorId);
    this.recordEvent('publicLinkRevoked', { authorizationId: publicLink.id() }, actorId);
    return ok(undefined);
  }

  activatePendingUserAuthorization(id: string, actorId: string): WriteResult<void> {
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
