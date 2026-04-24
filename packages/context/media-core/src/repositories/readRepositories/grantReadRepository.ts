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

export const buildGrantReadRepository = ({
  database,
}: GrantReadRepositoryDeps): GrantReadRepository => ({
  hasActiveGrant: (input: HasActiveGrantInput): Promise<boolean> => {
    return database('grant')
      .where('media_item_id', input.mediaItemId)
      .where(function () {
        if (input.viewerId) this.where('granted_to_user', input.viewerId);
        if (input.tokenHash) this.orWhere('token_hash', input.tokenHash);
      })
      .first();
  },
});
