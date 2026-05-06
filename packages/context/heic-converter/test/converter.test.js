import { createReadStream } from "node:fs";
import fsPromises from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { convertHeicToJpeg, isHeic } from "../src/converter.js";
import { ConversionError } from "../src/errors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, "fixtures");
const tempFixturesDir = path.join(os.tmpdir(), "heic-converter-tests");
const sampleFixture = path.join(fixturesDir, "sample.heic");
const orientedFixture = path.join(fixturesDir, "orientation-6.heic");

const createHeicLikeBuffer = (brand = "heic") => {
  const header = Buffer.alloc(12, 0);
  header.writeUInt32BE(24, 0);
  header.write("ftyp", 4, "ascii");
  header.write(brand, 8, "ascii");
  return Buffer.concat([header, Buffer.from("payload")]);
};

const fixtureExists = async (filePath) => {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch {
    return false;
  }
};

describe("isHeic", () => {
  describe("When input is a HEIC-like buffer", () => {
    it("should return true", async () => {
    const result = await isHeic(createHeicLikeBuffer("heic"));
    assert.equal(result, true);
  });
  });

  describe("When input is a HEIC-like stream", () => {
    it("should return true", async () => {
      const stream = createReadStream(
        await writeTempFixture(createHeicLikeBuffer("mif1"), "stream-test.heic")
      );
    const result = await isHeic(stream);
    assert.equal(result, true);
  });
  });

  describe("When input is a HEIC-like file path", () => {
    it("should return true", async () => {
    const filePath = await writeTempFixture(createHeicLikeBuffer("msf1"), "path-test.heic");
    const result = await isHeic(filePath);
    assert.equal(result, true);
  });
  });

  describe("When input has a non-HEIC brand", () => {
    it("should return false", async () => {
    const result = await isHeic(createHeicLikeBuffer("avif"));
    assert.equal(result, false);
  });
  });
});

describe("convertHeicToJpeg", () => {
  describe("When input is not HEIC", () => {
    it("should throw a validation ConversionError", async () => {
    await assert.rejects(
      () => convertHeicToJpeg(Buffer.from("not-a-heic")),
      (error) => {
        assert.equal(error instanceof ConversionError, true);
        assert.equal(error.context.stage, "validate_format");
        return true;
      }
    );
  });
  });

  describe("When input is corrupted HEIC bytes", () => {
    it("should throw a conversion-stage ConversionError", async () => {
    const corrupted = createHeicLikeBuffer("heic");
    await assert.rejects(
      () => convertHeicToJpeg(corrupted),
      (error) => {
        assert.equal(error instanceof ConversionError, true);
        assert.equal(error.context.stage, "convert_primary_image");
        return true;
      }
    );
  });
  });

  describe("When destination is a writable stream", () => {
    it("should write JPEG bytes to the stream", async (t) => {
    const hasFixture = await fixtureExists(sampleFixture);
    if (!hasFixture) {
      t.skip("Missing fixture: test/fixtures/sample.heic");
      return;
    }

    const input = await fsPromises.readFile(sampleFixture);
    const sink = new PassThrough();
    /** @type {Buffer[]} */
    const chunks = [];
    sink.on("data", (chunk) => {
      chunks.push(Buffer.from(chunk));
    });

    const result = await convertHeicToJpeg(input, { destination: sink });

    assert.equal(result.convertedSize > 0, true);
    assert.equal(Buffer.concat(chunks).length > 0, true);
  });
  });

  describe("When converting a valid HEIC fixture", () => {
    it("should return JPEG buffer and dimensions", async (t) => {
    const hasFixture = await fixtureExists(sampleFixture);
    if (!hasFixture) {
      t.skip("Missing fixture: test/fixtures/sample.heic");
      return;
    }

    const result = await convertHeicToJpeg(sampleFixture);

    assert.equal(Buffer.isBuffer(result.outputBuffer), true);
    assert.equal(result.originalSize > 0, true);
    assert.equal(result.convertedSize > 0, true);
    assert.equal(result.width > 0, true);
    assert.equal(result.height > 0, true);
  });
  });

  describe("When converting an orientation fixture", () => {
    it("should preserve orientation in output geometry", async (t) => {
    const hasFixture = await fixtureExists(orientedFixture);
    if (!hasFixture) {
      t.skip("Missing fixture: test/fixtures/orientation-6.heic");
      return;
    }

    const result = await convertHeicToJpeg(orientedFixture);
    assert.equal(result.metadata.orientation, 6);
    assert.equal(result.width > 0, true);
    assert.equal(result.height > 0, true);
  });
  });
});

const writeTempFixture = async (content, fileName) => {
  await fsPromises.mkdir(tempFixturesDir, { recursive: true });
  const target = path.join(tempFixturesDir, fileName);
  await fsPromises.writeFile(target, content);
  return target;
};
