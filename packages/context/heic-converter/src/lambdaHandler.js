import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import pino from "pino";

import { convertHeicToJpeg } from "./converter.js";

const logger = pino({
  name: "heic-converter-lambda",
  level: process.env.LOG_LEVEL ?? "info",
});

const s3Client = new S3Client({});

/**
 * @typedef {Object} LambdaResponse
 * @property {string} outputBucket
 * @property {string} outputKey
 * @property {number} originalSize
 * @property {number} convertedSize
 * @property {number} width
 * @property {number} height
 */

/**
 * @param {import("aws-lambda").S3Event} event
 * @returns {Promise<LambdaResponse[]>}
 */
export const handler = async (event) => {
  const records = Array.isArray(event?.Records) ? event.Records : [];
  if (records.length === 0) {
    logger.warn("No S3 records were provided");
    return [];
  }

  /** @type {LambdaResponse[]} */
  const results = [];

  for (const record of records) {
    const inputBucket = record.s3.bucket.name;
    const inputKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    const outputBucket = process.env.OUTPUT_BUCKET ?? inputBucket;
    const outputPrefix = process.env.OUTPUT_PREFIX ?? "converted/";
    const outputKey = `${outputPrefix}${toJpegKey(inputKey)}`;

    logger.info({ inputBucket, inputKey, outputBucket, outputKey }, "Processing HEIC object");

    const object = await s3Client.send(
      new GetObjectCommand({
        Bucket: inputBucket,
        Key: inputKey,
      })
    );

    const inputBuffer = await bodyToBuffer(object.Body);
    const converted = await convertHeicToJpeg(inputBuffer, {
      quality: 0.9,
      logger,
    });

    await s3Client.send(
      new PutObjectCommand({
        Bucket: outputBucket,
        Key: outputKey,
        Body: converted.outputBuffer,
        ContentType: "image/jpeg",
      })
    );

    results.push({
      outputBucket,
      outputKey,
      originalSize: converted.originalSize,
      convertedSize: converted.convertedSize,
      width: converted.width,
      height: converted.height,
    });
  }

  return results;
};

/**
 * @param {unknown} body
 * @returns {Promise<Buffer>}
 */
const bodyToBuffer = async (body) => {
  if (body && typeof body === "object" && "transformToByteArray" in body) {
    const byteArray = await body.transformToByteArray();
    return Buffer.from(byteArray);
  }

  if (body && typeof body === "object" && Symbol.asyncIterator in body) {
    const chunks = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  throw new Error("S3 response body is missing or unsupported");
};

/**
 * @param {string} inputKey
 * @returns {string}
 */
const toJpegKey = (inputKey) => {
  const withoutExtension = inputKey.replace(/\.[^./]+$/, "");
  return `${withoutExtension}.jpg`;
};
