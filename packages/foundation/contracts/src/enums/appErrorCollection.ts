import { getSubsetByProp } from '@reharik/smart-enum';
import { ContractError, ErrorArea } from './ContractError';

const getAlbumErrors = () => getSubsetByProp(ContractError, 'area', ErrorArea.album);
const getMediaItemErrors = () => getSubsetByProp(ContractError, 'area', ErrorArea.mediaItem);
const getAuthorizationErrors = () =>
  getSubsetByProp(ContractError, 'area', ErrorArea.authorization);
const getUserErrors = () => getSubsetByProp(ContractError, 'area', ErrorArea.user);
const getCommentErrors = () => getSubsetByProp(ContractError, 'area', ErrorArea.comment);

export type AppErrorCollection = {
  album: ReturnType<typeof getAlbumErrors>;
  mediaItem: ReturnType<typeof getMediaItemErrors>;
  authorization: ReturnType<typeof getAuthorizationErrors>;
  user: ReturnType<typeof getUserErrors>;
  comment: ReturnType<typeof getCommentErrors>;
};

export const AppErrorCollection: AppErrorCollection = {
  album: getAlbumErrors(),
  mediaItem: getMediaItemErrors(),
  authorization: getAuthorizationErrors(),
  user: getUserErrors(),
  comment: getCommentErrors(),
};
