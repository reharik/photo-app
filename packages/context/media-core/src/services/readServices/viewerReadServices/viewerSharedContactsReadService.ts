import {
  ShareContactRepository,
  ShareContactSuggestion,
} from '../../../repositories/readRepositories/types';
import { ReadServiceBase } from '../readServiceBaseType';

export interface ViewerSharedContactsReadService extends ReadServiceBase {
  getShareContacts: () => Promise<ShareContactSuggestion[]>;
}

type ViewerSharedContactsReadServiceDeps = {
  shareContactRepository: ShareContactRepository;
  viewerId: string;
};

export const build__ViewerSharedContactsReadService = ({
  shareContactRepository,
  viewerId,
}: ViewerSharedContactsReadServiceDeps): ViewerSharedContactsReadService => {
  return {
    getShareContacts: async (): Promise<ShareContactSuggestion[]> => {
      return shareContactRepository.getShareSuggestions(viewerId);
    },
  };
};
