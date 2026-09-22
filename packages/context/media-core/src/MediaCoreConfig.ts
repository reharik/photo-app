export type MediaCoreConfig = {
  s3Bucket: string;
  awsRegion: string;
  s3UploadUrlTtlSeconds: number;
  s3DownloadUrlTtlSeconds: number;
  s3DownloadUrlSigningBucketSeconds: number;
};
