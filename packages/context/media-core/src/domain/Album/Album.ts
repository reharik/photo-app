import {
  AlbumMemberRole,
  AppErrorCollection,
  fail,
  MediaKind,
  ok,
  Operation,
  WriteResult,
} from '@packages/contracts';
import { EnumArraysAreEqual } from '@packages/infrastructure';
import type { ActorId, EntityId } from '../../types/types';
import { AggregateRoot } from '../AggregateRoot';
import { Authorization, AuthorizationRecord } from '../Authorization/Authorization';
import { grantAuthorizationValidation } from '../Authorization/grantAuthorizationValidation';
import type { AuditRecord, ChildEntities } from '../Entity';
import { PublicLink, PublicLinkChildRecords, PublicLinkRecord } from '../PublicLink/PublicLink';
import { reorderAlbumItems } from '../utilities/reorderAlbumItems';
import { AlbumItem, AlbumItemRecord } from './AlbumItem';
import { ALBUM_ITEM_ORDER_GAP, ALBUM_ITEM_ORDER_INITIAL } from './albumItemOrder';
import { AlbumMember, AlbumMemberRecord } from './AlbumMember';

export type AlbumProps = CreateAlbumInput & {
  coverMediaId?: EntityId | null;
};

export type CreateAlbumInput = {
  title: string;
  isPublicLinkAlbum?: boolean;
};

export type AlbumRecord = AlbumProps & { id: EntityId } & AuditRecord;

export type AlbumChildRecords = {
  items: AlbumItemRecord[];
  members: AlbumMemberRecord[];
  authorizations: AuthorizationRecord[];
  publicLinks: { publicLink: PublicLinkRecord; publicLinkChildRecords: PublicLinkChildRecords }[];
};

export class Album extends AggregateRoot<AlbumRecord> {
  protected props: AlbumProps;

  #items: AlbumItem[] = [];
  #members: AlbumMember[] = [];
  #authorizations: Authorization[] = [];
  #publicLinks: PublicLink[] = [];
  #removedItems: AlbumItem[] = [];
  #removedMembers: AlbumMember[] = [];
  #removedAuthorizations: Authorization[] = [];
  #removedPublicLinks: PublicLink[] = [];

  private constructor(actorId: ActorId, props: AlbumProps, id?: EntityId) {
    super(id, actorId, 'album');
    this.props = props;
  }

  static create(input: CreateAlbumInput, actorId: ActorId): Album {
    const album = new Album(actorId, {
      title: input.title,
      isPublicLinkAlbum: input.isPublicLinkAlbum,
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
    album.#authorizations = childRecords.authorizations.map((r) => Authorization.rehydrate(r));
    album.#publicLinks = childRecords.publicLinks.map((r) =>
      PublicLink.rehydrate(r.publicLink, r.publicLinkChildRecords),
    );
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

  addMember(userId: EntityId, role: AlbumMemberRole, actorId: ActorId): WriteResult {
    if (this.#members.some((m) => m.userId() === userId)) {
      return fail(AppErrorCollection.album.UserAlreadyMember);
    }
    this.#members.push(AlbumMember.create({ userId, role, albumId: this.id() }, actorId));
    this.touch(actorId);
    return ok(undefined);
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
    if (coverWasThisMedia) {
      this.touch(actorId);
    }
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
    return ok(undefined);
  }

  getAlbumMember(userId: EntityId): AlbumMember | undefined {
    return this.#members.find((m) => m.userId() === userId) ?? undefined;
  }
  getAlbumItem(albumItemId: EntityId): AlbumItem | undefined {
    return this.#items.find((i) => i.id() === albumItemId) ?? undefined;
  }
  getMediaItemIds(): EntityId[] {
    return this.#items.map((i) => i.mediaItemId());
  }
  getAuthorizations(): Authorization[] {
    return this.#authorizations;
  }
  grantAuthorization(
    operations: Operation[],
    actorId: ActorId,
    grantedToUserId?: EntityId,
    label?: string,
    expiresAt?: Date,
  ): WriteResult<{
    authorization: Authorization;
  }> {
    const result = grantAuthorizationValidation(
      this,
      grantedToUserId,
      undefined, // publicLink link has it's own command
      label,
      expiresAt,
    );
    if (!result.success) {
      return result;
    }

    // Maybe this should not be an upsert, we'll see.
    const existingAuthorization = this.#authorizations.find(
      (s) => s.grantedToUser() === grantedToUserId,
    );
    if (!existingAuthorization) {
      const authorization = Authorization.create(
        {
          operations,
          grantedToUser: grantedToUserId,
          publicLinkId: undefined,
          grantedBy: actorId,
          label,
          expiresAt,
          albumId: this.id(),
        },
        actorId,
      );
      this.#authorizations.push(authorization);
      this.touch(actorId);
      // TODO add event here so we can see when a new album has been shared
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
    }
    return ok({ authorization: existingAuthorization });
  }
  revokeAuthorization(authorizationId: EntityId, actorId: ActorId): WriteResult {
    const authorization = this.#authorizations.find((s) => s.id() === authorizationId);
    if (!authorization) {
      return fail(AppErrorCollection.authorization.AuthorizationNotFound);
    }
    const result = authorization.revokeAuthorization(actorId);
    if (!result.success) {
      return result;
    }
    this.touch(actorId);
    return ok(undefined);
  }

  getPublicLinks(): PublicLink[] {
    return this.#publicLinks;
  }

  grantPublicLink(
    actorId: ActorId,
    expiresAt?: Date,
    operations?: Operation[],
  ): WriteResult<PublicLink> {
    let publicLink = this.#publicLinks.find((x) => {
      const exp = x.authorization().expiresAt();
      return !x.authorization().revokedAt() && (!exp || exp > new Date());
    });

    if (!publicLink) {
      // creating a new public link creates a new authorization/access_grant
      publicLink = PublicLink.create(
        {
          operations: operations ?? [],
          grantedBy: actorId,
          label: undefined,
          expiresAt,
          albumId: this.id(),
        },
        actorId,
      );
      this.#publicLinks.push(publicLink);
      this.touch(actorId);
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

  revokePublicLink(publicLinkId: EntityId, actorId: ActorId): WriteResult {
    const publicLink = this.#publicLinks.find((s) => s.id() === publicLinkId);
    if (!publicLink) {
      return fail(AppErrorCollection.authorization.PublicLinkNotFound);
    }
    const result = publicLink.revokePublicLink(actorId);
    if (!result.success) {
      return result;
    }
    this.touch(actorId);
    return ok(undefined);
  }

  childEntities(): ChildEntities {
    return {
      items: { upsert: this.#items, removed: this.#removedItems },
      members: { upsert: this.#members, removed: this.#removedMembers },
      authorizations: { upsert: this.#authorizations, removed: this.#removedAuthorizations },
      publicLinks: { upsert: this.#publicLinks, removed: this.#removedPublicLinks },
    };
  }
}
