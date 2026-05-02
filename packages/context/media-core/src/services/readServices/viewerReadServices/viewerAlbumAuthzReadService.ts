import { AlbumMemberRole } from '@packages/contracts';
import {
  ShareContactRepository,
  ShareContactSuggestion,
} from '../../../repositories/readRepositories/shareContactRepository';
import type { EntityId } from '../../../types/types';
import { ReadServiceFactoryBase } from '../readServiceBaseType';

export interface ViewerAlbumAuthzReadService {
  getAuthz: (args: { viewerMemberRole?: string }) => string[];
  getShareContacts: () => Promise<ShareContactSuggestion[]>;
}

export interface ViewerAlbumAuthzReadServiceFactory extends ReadServiceFactoryBase {
  (args: { viewerId: EntityId }): ViewerAlbumAuthzReadService;
}

type ViewerAlbumAuthzReadServiceFactoryDeps = {
  shareContactRepository: ShareContactRepository;
};

export const buildViewerAlbumAuthzReadServiceFactory = ({
  shareContactRepository,
}: ViewerAlbumAuthzReadServiceFactoryDeps): ViewerAlbumAuthzReadServiceFactory => {
  return ({ viewerId }: { viewerId: EntityId }) => ({
    getAuthz: ({ viewerMemberRole }: { viewerMemberRole?: string }): string[] => {
      if (!viewerMemberRole) {
        return [];
      }
      const role = AlbumMemberRole.fromValue(viewerMemberRole);
      if (!role) {
        return [];
      }
      return role.operations.map((op) => op.value);
    },
    getShareContacts: async (): Promise<ShareContactSuggestion[]> => {
      return shareContactRepository.getShareSuggestions(viewerId);
    },
  });
};
