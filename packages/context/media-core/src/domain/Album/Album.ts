import { AlbumMemberRole, AppErrorCollection, SharePermission } from '@packages/contracts';
import type { ActorId, EntityId, WriteResult } from '../../types/types';
import { AggregateRoot } from '../AggregateRoot';
import { Authorization, AuthorizationRecord } from '../Authorization/Authorization';
import { grantAuthorizationValidation } from '../Authorization/grantAuthorizationValidation';
import type { AuditRecord, ChildEntities } from '../Entity';
import { PublicLink, PublicLinkRecord } from '../PublicLink/PublicLink';
import { reorderAlbumItems } from '../utilities/reorderAlbumItems';
import { fail, ok } from '../utilities/writeResponse';
import type { AlbumItemRecord } from './AlbumItem';
import { AlbumItem } from './AlbumItem';
import { ALBUM_ITEM_ORDER_GAP, ALBUM_ITEM_ORDER_INITIAL } from './albumItemOrder';
import { AlbumMember, AlbumMemberRecord } from './AlbumMember';

export type AlbumProps = {
  title: string;
  coverMediaId?: EntityId;
  isPublicLinkAlbum?: boolean;
};

export type CreateAlbumInput = {
  title: string;
  isPublicLinkAlbum?: boolean;
};

export type AlbumRecord = {
  id: EntityId;
  title: string;
  coverMediaId?: EntityId | null;
  items: AlbumItemRecord[];
  members: AlbumMemberRecord[];
  authorizations: AuthorizationRecord[];
  publicLinks: PublicLinkRecord[];
  isPublicLinkAlbum?: boolean;
} & AuditRecord;

export class Album extends AggregateRoot<AlbumRecord> {
  protected props: AlbumProps;

  #items: AlbumItem[] = [];
  #members: AlbumMember[] = [];
  #authorizations: Authorization[] = [];
  #publicLinks: PublicLink[] = [];

  private constructor(id: EntityId, actorId: ActorId, props: AlbumProps) {
    super(id, actorId);
    this.props = props;
  }

  static create(input: CreateAlbumInput, actorId: ActorId): Album {
    const album = new Album(crypto.randomUUID(), actorId, {
      title: input.title,
    });
    const member = AlbumMember.create({ userId: actorId, role: AlbumMemberRole.owner }, actorId);
    album.#members.push(member);
    return album;
  }

  static rehydrate(record: AlbumRecord): Album {
    const album = new Album(record.id, record.createdBy, {
      title: record.title,
      coverMediaId: record.coverMediaId ?? undefined,
    });

    album.rehydrateAudit(record);

    album.#items = record.items.map((r) => AlbumItem.rehydrate(r));
    album.#members = record.members.map((r) => AlbumMember.rehydrate(r));
    album.#authorizations = record.authorizations.map((r) => Authorization.rehydrate(r));
    album.#publicLinks = record.publicLinks.map((r) => PublicLink.rehydrate(r));
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

  addItem(mediaItemId: EntityId, actorId: ActorId): WriteResult<AlbumItem> {
    if (this.#items.some((i) => i.mediaItemId() === mediaItemId)) {
      return fail(AppErrorCollection.album.MediaAlreadyInAlbum);
    }
    // TODO: check various invariants when they exist e.g. is album mutable

    const albumItem = AlbumItem.create({ mediaItemId, orderIndex: this.nextOrderIndex() }, actorId);
    this.#items.push(albumItem);
    this.touch(actorId);
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
    this.#members.push(AlbumMember.create({ userId, role }, actorId));
    this.touch(actorId);
    return ok(undefined);
  }
  coverMediaId(): EntityId | undefined {
    return this.props.coverMediaId;
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
    this.props.coverMediaId = undefined;
    this.touch(actorId);
    return ok(undefined);
  }

  /**
   * Removes every album item that references this media (at most one per album under normal DB constraints).
   * If the album cover pointed at this media, clears the cover so the aggregate stays consistent.
   */
  removeMediaItemFromAlbum(mediaItemId: EntityId, actorId: ActorId): WriteResult {
    // TODO: check various invariants when they exist e.g. is album mutable
    const removedAnyItem = this.#items.some((i) => i.mediaItemId() === mediaItemId);
    this.#items = this.#items.filter((i) => i.mediaItemId() !== mediaItemId);
    const coverWasThisMedia = this.props.coverMediaId === mediaItemId;
    if (coverWasThisMedia) {
      this.props.coverMediaId = undefined;
    }
    if (removedAnyItem || coverWasThisMedia) {
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
    permission: SharePermission,
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
          permission,
          grantedToUser: grantedToUserId,
          publicLinkId: undefined,
          grantedBy: actorId,
          label,
          expiresAt,
        },
        actorId,
      );
      this.#authorizations.push(authorization);
      this.touch(actorId);
      return ok({ authorization });
    }

    if (expiresAt && result.value.status === 'updateExpireDate') {
      const updatedExpireDate = existingAuthorization.updateExpireDate(expiresAt, actorId);
      if (!updatedExpireDate.success) {
        return updatedExpireDate;
      }
      this.touch(actorId);
      return ok({ authorization: existingAuthorization });
    }

    if (label && result.value.status === 'updateLabel') {
      const updatedLabel = existingAuthorization.updateLabel(label, actorId);
      if (!updatedLabel.success) {
        return updatedLabel;
      }
      this.touch(actorId);
      return ok({ authorization: existingAuthorization });
    }

    return fail(AppErrorCollection.album.NoActionProvidedOnAuthorizationCommand);
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
    token: string,
    expiresAt?: Date,
    permission?: SharePermission,
    publicLinkId?: EntityId,
  ): WriteResult<PublicLink> {
    if (!publicLinkId && !token) {
      return fail(AppErrorCollection.authorization.PublicLinkMustHaveTokenOrId);
    }
    const publicLink = this.#publicLinks.find((x) => x.id() === publicLinkId);
    if (!publicLink) {
      const publicLink = PublicLink.create(
        {
          permission: permission ?? SharePermission.view,
          linkToken: token,
          grantedBy: actorId,
          label: undefined,
          expiresAt,
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
      return ok(publicLink);
    }
    return fail(AppErrorCollection.album.NoActionProvidedOnPublicLinkCommand);
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

  public override persistenceState(): Record<string, unknown> {
    return {
      ...super.persistenceState(),
      authorizations: this.#authorizations,
      members: this.#members,
      publicLinks: this.#publicLinks,
    };
  }

  protected childEntities(): ChildEntities {
    return {
      items: this.#items,
      members: this.#members,
      authorizations: this.#authorizations,
      publicLinks: this.#publicLinks,
    };
  }
}
