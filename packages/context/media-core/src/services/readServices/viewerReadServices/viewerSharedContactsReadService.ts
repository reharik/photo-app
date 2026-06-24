import { ShareContactReadRepository } from '../../../repositories/readRepositories/shareContactReadRepository';
import { ShareContactSuggestion } from '../../../repositories/readRepositories/types';
import { ReadServiceBase } from '../readServiceBaseType';

export interface ViewerSharedContactsReadService extends ReadServiceBase {
  getShareContacts: () => Promise<ShareContactSuggestion[]>;
}

type ViewerSharedContactsReadServiceDeps = {
  shareContactReadRepository: ShareContactReadRepository;
  viewerId: string;
};

export const build__ViewerSharedContactsReadService = ({
  shareContactReadRepository,
  viewerId,
}: ViewerSharedContactsReadServiceDeps): ViewerSharedContactsReadService => {
  return {
    getShareContacts: async (): Promise<ShareContactSuggestion[]> => {
      return shareContactReadRepository.getShareSuggestions(viewerId);
    },
  };
};
