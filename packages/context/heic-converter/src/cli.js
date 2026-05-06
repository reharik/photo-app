#!/usr/bin/env node

import pino from "pino";

import { convertHeicToJpeg, isHeic } from "./converter.js";

const logger = pino({
  name: "heic-converter-cli",
  level: process.env.LOG_LEVEL ?? "info",
});

/**
 * @param {string[]} argv
 * @returns {{ inputPath: string; outputPath: string; quality: number }}
 */
const parseArgs = (argv) => {
  const args = argv.slice(2);
  const [inputPath, outputPath, qualityArg] = args;

  if (!inputPath || !outputPath) {
    throw new Error("Usage: node src/cli.js <input.heic> <output.jpg> [quality=0.9]");
  }

  const quality = qualityArg === undefined ? 0.9 : Number(qualityArg);
  if (Number.isNaN(quality) || quality <= 0 || quality > 1) {
    throw new Error("quality must be a number between 0 (exclusive) and 1 (inclusive)");
  }

  return { inputPath, outputPath, quality };
};

const main = async () => {
  const { inputPath, outputPath, quality } = parseArgs(process.argv);

  if (!(await isHeic(inputPath))) {
    throw new Error(`Input file is not HEIC/HEIF by magic-byte check: ${inputPath}`);
  }

  const result = await convertHeicToJpeg(inputPath, {
    quality,
    destination: outputPath,
    logger,
  });

  process.stdout.write(
    JSON.stringify(
      {
        inputPath,
        outputPath,
        originalSize: result.originalSize,
        convertedSize: result.convertedSize,
        width: result.width,
        height: result.height,
      },
      null,
      2
    ) + "\n"
  );
};

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
