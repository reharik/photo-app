import {
  ShareContactRepository,
  ShareContactSuggestion,
} from '../../../repositories/readRepositories/shareContactRepository';
import type { EntityId } from '../../../types/types';
import { ReadServiceFactoryBase } from '../readServiceBaseType';

export interface ViewerAlbumAuthzReadService {
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
    getShareContacts: async (): Promise<ShareContactSuggestion[]> => {
      return shareContactRepository.getShareSuggestions(viewerId);
    },
  });
};
