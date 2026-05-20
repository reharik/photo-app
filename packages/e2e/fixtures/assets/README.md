# E2E image assets

Add real image files here (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`). Tests pick from this folder at random.

In a spec:

```ts
test('example', async ({ userA, grabTestImages }) => {
  const { paths } = grabTestImages(3);
  await loginAndOpenRecentMedia(userA.page, userA.context, userA.user);
  await uploadMediaViaUi(userA.page, paths);
});
```

Upload file names are `{originalStem}-{uniqueSuffix}{ext}` (e.g. `beach-m1abc2-0.jpg`).
