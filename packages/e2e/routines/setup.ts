import { UserSession } from '../fixtures/test';
import { GrabTestImagesResult } from '../fixtures/testAssets';
import { loginAndOpenLibrary, uploadMediaViaUi } from '../fixtures/upload';
export const setup = async (
  grabTestImages: (count: number) => GrabTestImagesResult[],
  user: UserSession,
  numberOfItems: number,
) => {
  await loginAndOpenLibrary(user.page, user.context, user.user);

  const items = grabTestImages(numberOfItems);
  return uploadMediaViaUi(user.page, items);
};
