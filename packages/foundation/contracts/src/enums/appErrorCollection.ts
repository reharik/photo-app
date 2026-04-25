import { getSubsetByProp } from '@reharik/smart-enum';
import { ContractError, ErrorArea } from './ContractError';

const getAlbumErrors = () => getSubsetByProp(ContractError, 'area', ErrorArea.album);
const getMediaItemErrors = () => getSubsetByProp(ContractError, 'area', ErrorArea.mediaItem);
const getShareErrors = () => getSubsetByProp(ContractError, 'area', ErrorArea.share);
const getUserErrors = () => getSubsetByProp(ContractError, 'area', ErrorArea.user);

export type AppErrorCollection = {
  album: ReturnType<typeof getAlbumErrors>;
  mediaItem: ReturnType<typeof getMediaItemErrors>;
  share: ReturnType<typeof getShareErrors>;
  user: ReturnType<typeof getUserErrors>;
};

export const AppErrorCollection: AppErrorCollection = {
  album: getAlbumErrors(),
  mediaItem: getMediaItemErrors(),
  share: getShareErrors(),
  user: getUserErrors(),
};
