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

## Video

`viewer-clip.mp4` is a 30s 320×180 H.264 test pattern with an audio track, used by the
media-viewer video specs through `fixtures/videoViewer.ts`. It is not an image extension,
so `grabTestImages` never picks it. Regenerate with:

```sh
ffmpeg -f lavfi -i testsrc=duration=30:size=320x180:rate=10 -f lavfi -i sine=frequency=440:duration=30 \
  -c:v libx264 -preset veryslow -crf 34 -pix_fmt yuv420p -g 10 -c:a aac -b:a 24k -ac 1 -movflags +faststart viewer-clip.mp4
```
