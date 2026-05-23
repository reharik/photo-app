# heic-converter

`@packages/heic-converter` converts HEIC/HEIF images to JPEG for Node.js consumers (for example `media-worker`).

## API

- `isHeic(input)` — magic-byte detection for file paths, buffers, or readable streams
- `convertHeicToJpeg(input, options?)` — converts to JPEG, applies EXIF orientation to pixels, strips EXIF from output

Conversion uses pure-JavaScript dependencies (`heic-convert`, `jpeg-js`, `exifr`) so callers avoid native image stacks for the HEIC step.

## Tests

```bash
npm run test:heic-converter
```

Optional integration fixtures (skipped when missing):

- `test/fixtures/sample.heic`
- `test/fixtures/orientation-6.heic`

## Build

```bash
npm run build:heic-converter
```

Built output is emitted to `dist/` per monorepo policy.
