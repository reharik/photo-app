import { Knex } from 'knex';

export type HasActiveGrantInput = {
  mediaItemId: string;
  viewerId?: string;
  tokenHash?: string;
};

export type GrantReadRepository = {
  hasActiveGrant: (input: HasActiveGrantInput) => Promise<boolean>;
};
type GrantReadRepositoryDeps = { database: Knex };

export const build__GrantReadRepository = ({
  database,
}: GrantReadRepositoryDeps): GrantReadRepository => ({
  hasActiveGrant: (input: HasActiveGrantInput): Promise<boolean> => {
    if (input.viewerId) {
      return database('grant')
        .where('media_item_id', input.mediaItemId)
        .where('granted_to_user', input.viewerId)
        .first();
    }
    return database('shareLink')
      .join('accessGrant', 'accessGrant.shareLinkId', 'shareLink.id')
      .join('grant', 'accessGrant.id', 'grant.accessGrantId')
      .where('shareLink.linkToken', input.tokenHash)
      .where('grant.mediaItemId', input.mediaItemId)
      .first();
  },
});
