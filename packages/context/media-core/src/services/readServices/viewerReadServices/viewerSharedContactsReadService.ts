import {
  ShareContactRepository,
  ShareContactSuggestion,
} from '../../../repositories/readRepositories/shareContactRepository';
import type { EntityId } from '../../../types/types';
import { ReadServiceFactoryBase } from '../readServiceBaseType';

export interface ViewerSharedContactsReadService {
  getShareContacts: () => Promise<ShareContactSuggestion[]>;
}

export interface ViewerSharedContactsReadServiceFactory extends ReadServiceFactoryBase {
  (args: { viewerId: EntityId }): ViewerSharedContactsReadService;
}

type ViewerSharedContactsReadServiceFactoryDeps = {
  shareContactRepository: ShareContactRepository;
};

export const build__ViewerSharedContactsReadServiceFactory = ({
  shareContactRepository,
}: ViewerSharedContactsReadServiceFactoryDeps): ViewerSharedContactsReadServiceFactory => {
  return ({ viewerId }: { viewerId: EntityId }) => ({
    getShareContacts: async (): Promise<ShareContactSuggestion[]> => {
      return shareContactRepository.getShareSuggestions(viewerId);
    },
  });
};
