import { expect, UserSession } from '../fixtures/test';
import { GrabTestImagesResult } from '../fixtures/testAssets';
import { loginAndOpenRecentMedia, uploadMediaViaUi } from '../fixtures/upload';
export const setup = async (
  grabTestImages: (count: number) => GrabTestImagesResult[],
  user: UserSession,
  numberOfItems: number,
) => {
  await loginAndOpenRecentMedia(user.page, user.context, user.user);
  await expect(user.page.getByText('Recent Media')).toBeVisible();
  await expect(user.page.getByRole('button', { name: 'Upload Media' }).first()).toBeVisible();

  const items = grabTestImages(numberOfItems);
  return uploadMediaViaUi(user.page, items);
};
