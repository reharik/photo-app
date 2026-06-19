import { dedupeBy } from '@packages/infrastructure';
import { Knex } from 'knex';
import { Album } from '../domain/Album/Album';
import { AlbumItem } from '../domain/Album/AlbumItem';
import { Authorization } from '../domain/Authorization/Authorization';
import { PublicLink } from '../domain/PublicLink/PublicLink';
import { GrantRepository } from './domainRepositories/grantRepository';

export type GrantSync = {
  syncGrants: (album: Album, trx: Knex.Transaction) => Promise<void>;
};

export type GrantSyncDeps = {
  grantRepository: GrantRepository;
};

export const build__GrantSync = ({ grantRepository }: GrantSyncDeps): GrantSync => {
  const buildUpsertsForNewItems = (
    albumItems: AlbumItem[],
    authorizations: Authorization[],
    publicLinks: PublicLink[],
  ) => {
    const upserts = albumItems.filter((x) => x.isNew());
    const itemsFromAuths = authorizations.flatMap((authz) =>
      upserts.map((item) => ({
        id: crypto.randomUUID(),
        mediaItemId: item.mediaItemId(),
        accessGrantId: authz.id(),
        grantedToUser: authz.grantedToUser(),
        shareLinkId: null,
        operations: authz.operations(),
        createdAt: authz.createdAt() || new Date(),
      })),
    );

    const itemsFromPublicLinks = publicLinks.flatMap((pl) =>
      upserts.map((item) => ({
        id: crypto.randomUUID(),
        mediaItemId: item.mediaItemId(),
        accessGrantId: pl.authorization().id(),
        shareLinkId: pl.id(),
        grantedToUser: null,
        operations: pl.authorization().operations(),
        createdAt: pl.authorization().createdAt() || new Date(),
      })),
    );

    return [...itemsFromAuths, ...itemsFromPublicLinks];
  };

  const buildUpsertsForDirtyAuthorizations = (
    albumItems: AlbumItem[],
    authorizations: Authorization[],
  ) => {
    return authorizations
      .filter((authz) => {
        return authz.isNew() || authz.isDirty();
      })
      .flatMap((authz) =>
        albumItems.map((item) => ({
          id: crypto.randomUUID(),
          mediaItemId: item.mediaItemId(),
          accessGrantId: authz.id(),
          grantedToUser: authz.grantedToUser(),
          shareLinkId: null,
          operations: authz.operations(),
          createdAt: authz.createdAt() || new Date(),
        })),
      );
  };

  const buildUpsertsForDirtyPublicLinks = (albumItems: AlbumItem[], publicLinks: PublicLink[]) => {
    return publicLinks
      .filter((pl) => {
        return pl.isNew() || pl.isDirty();
      })
      .flatMap((pl) =>
        albumItems.map((item) => ({
          id: crypto.randomUUID(),
          mediaItemId: item.mediaItemId(),
          accessGrantId: pl.authorization().id(),
          shareLinkId: pl.id(),
          grantedToUser: null,
          operations: pl.authorization().operations(),
          createdAt: pl.authorization().createdAt() || new Date(),
        })),
      );
  };

  return {
    syncGrants: async (album: Album, trx: Knex.Transaction) => {
      const albumItems = album.childEntities().items.upsert as AlbumItem[];
      const authorizations = (
        album.childEntities().authorizations.upsert as Authorization[]
      ).filter((authz) => {
        if (authz.revokedAt() || !authz.grantedToUser()) {
          return false;
        }
        const expiresAt = authz.expiresAt();
        return !expiresAt || expiresAt > new Date();
      });
      const publicLinks = (album.childEntities().publicLinks.upsert as PublicLink[]).filter(
        (pl) => {
          if (pl.authorization().revokedAt()) {
            return false;
          }
          const expiresAt = pl.authorization().expiresAt();
          return !expiresAt || expiresAt > new Date();
        },
      );

      const newFromAlbumItems = buildUpsertsForNewItems(albumItems, authorizations, publicLinks);
      const newFromAuthorizations = buildUpsertsForDirtyAuthorizations(albumItems, authorizations);
      const newFromPublicLinks = buildUpsertsForDirtyPublicLinks(albumItems, publicLinks);
      const newGrants = [...newFromAlbumItems, ...newFromAuthorizations, ...newFromPublicLinks];
      // builders intentionally overlap on (new item × dirty authz); dedupe resolves it.
      const dedupedGrants = dedupeBy(newGrants, [(x) => x.mediaItemId, (x) => x.accessGrantId]);
      if (dedupedGrants.length > 0) {
        await grantRepository.createGrants(dedupedGrants, trx);
      }
      const removedItems = album.childEntities().items.removed as AlbumItem[];

      const removedItemIds = removedItems.map((item) => item.mediaItemId());
      const allAuthorizationIds = [
        ...authorizations.map((authz) => authz.id()),
        ...publicLinks.map((pl) => pl.authorization().id()),
      ];

      await grantRepository.deleteGrantsByAccessGrantAndMediaItem(
        allAuthorizationIds,
        removedItemIds,
        trx,
      );
    },
  };
};
