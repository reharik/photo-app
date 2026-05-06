# heic-converter

Self-contained HEIC/HEIF to JPEG conversion module for Node.js, with a Lambda-ready wrapper.

## Why this package

- Single conversion entry point: `convertHeicToJpeg(input, options)`
- Input support: file path, `Buffer`, or `Readable` stream
- HEIC detection by magic bytes (`ftyp` + `heic`/`heix`/`mif1`/`msf1`), not extension
- Lambda-friendly conversion core built on pure JavaScript `heic-convert`
- Separate AWS Lambda handler with AWS SDK v3

## Install

```bash
npm install
```

## Local usage

```js
import { convertHeicToJpeg, isHeic } from './src/index.js';

const inputPath = './test/fixtures/sample.heic';

if (await isHeic(inputPath)) {
  const result = await convertHeicToJpeg(inputPath, {
    quality: 0.9,
    destination: './output.jpg',
  });

  console.log(result.width, result.height, result.convertedSize);
}
```

## CLI usage

Run with npm script:

```bash
npm run convert -- ./test/fixtures/sample.heic ./output.jpg 0.9
```

Run directly:

```bash
node ./src/cli.js ./test/fixtures/sample.heic ./output.jpg 0.9
```

Installed as a package, it also exposes `heic-converter` as a bin command.

## API

### `isHeic(input): Promise<boolean>`

Checks HEIC/HEIF using magic-byte inspection:

- bytes `4..7` must be `ftyp`
- bytes `8..11` brand must be one of: `heic`, `heix`, `mif1`, `msf1`

Accepted `input` types:

- `string` file path
- `Buffer`
- `Readable` stream

### `convertHeicToJpeg(input, options): Promise<ConvertResult>`

Accepted `input` types:

- `string` file path
- `Buffer`
- `Readable` stream

`options`:

- `quality` (`number`, default `0.9`)
- `destination` (`string` file path or `Writable` stream)
- `logger` (`pino` logger instance)

Returns:

- `outputBuffer` (`Buffer`)
- `originalSize` (`number`)
- `convertedSize` (`number`)
- `width` (`number`)
- `height` (`number`)
- `metadata` (`object`)

### EXIF orientation behavior

This package uses:

- [`exifr`](https://www.npmjs.com/package/exifr) to read EXIF orientation
- [`jpeg-js`](https://www.npmjs.com/package/jpeg-js) to apply pixel rotation/flip to JPEG output

Output JPEG files are re-encoded from raw pixels, so EXIF metadata is stripped from the final JPEG.

`sharp` was intentionally not used to avoid introducing native binary dependencies in the core conversion path.

### Multi-image HEIC behavior

`heic-convert` can decode all images with `heicConvert.all()`, but this module intentionally calls `heicConvert()` (single-image API) so only the primary image is returned.

## Tests

Run tests:

```bash
npm test
```

Fixture notes:

- Add real HEIC fixtures to `test/fixtures/`
- Required names:
  - `sample.heic`
  - `orientation-6.heic` (an image with EXIF orientation `6`)
- Integration tests are skipped automatically if these files are missing

## Lambda deployment notes

- **Runtime**: Node.js `20.x` or later
- **Packaging**: zip deployment is sufficient (core conversion uses pure JS `heic-convert`; no libheif system dependency required)
- **Memory**: minimum `512 MB`, recommended `1024 MB` for high-resolution iPhone images
- **Timeout**: `30s` is typically sufficient
- **IAM**:
  - `s3:GetObject` on source bucket
  - `s3:PutObject` on destination bucket

## Version pinning policy

Dependencies in `package.json` are pinned to exact versions (no `^` ranges) for reproducible Lambda deployments. This avoids accidental production behavior changes from transitive version drift during future installs.
