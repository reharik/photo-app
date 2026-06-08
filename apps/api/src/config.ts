import { config as loadDotEnv, type DotenvConfigOutput } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nodeEnvs = ['development', 'test', 'production', 'prod'] as const;
type NodeEnv = (typeof nodeEnvs)[number];

const DEFAULT_UPLOAD_URL_TTL_SECONDS = 15 * 60;
const DEFAULT_DOWNLOAD_URL_TTL_SECONDS = 15 * 60;
const DEFAULT_DOWNLOAD_URL_SIGNING_BUCKET_SECONDS = 5 * 60;

export type Config = {
  nodeEnv: NodeEnv;
  mediaStorageRoot: string;
  postgresHost: string;
  postgresPort: number;
  postgresUser: string;
  postgresPassword: string;
  postgresDatabase: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigins: string[];
  /** Pathname for GraphQL over HTTP (must match web Apollo `${apiBaseUrl}/graphql`). */
  graphqlHttpPath: string;
  serverUrl: string;
  serverPort: number;
  logLevel: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug';
  warnings?: string[];
  logJsonFilePath?: string;
  awsRegion: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  s3Bucket: string;
  s3UploadUrlTtlSeconds: number;
  s3DownloadUrlTtlSeconds: number;
  s3DownloadUrlSigningBucketSeconds: number;
  mediaWorkerPollIntervalMs: number;
  /**
   * When true, Koa trusts `X-Forwarded-Proto` / `X-Forwarded-For` from a reverse proxy.
   * Required for `Secure` session cookies when TLS terminates at the load balancer or nginx.
   */
  trustProxy: boolean;
};

const getValidValue = <T extends string>(value: string, allowedValues: readonly T[]): T => {
  if (allowedValues.includes(value as T)) {
    return value as T;
  }

  throw new Error(`Invalid value: ${value}. Allowed values: ${allowedValues.join(', ')}`);
};

const ensureEnvLoaded = (): DotenvConfigOutput | undefined => {
  if (process.env.POSTGRES_HOST) {
    return undefined;
  }

  return loadDotEnv({
    path: path.resolve(__dirname, '../.env'),
  });
};

const createConfigFromEnv = (): Config => {
  const nodeEnv = getValidValue<NodeEnv>(process.env.NODE_ENV || 'development', nodeEnvs);

  const isProduction = nodeEnv === 'production' || nodeEnv === 'prod';
  const warnings: string[] = [];

  if (isProduction && process.env.JWT_SECRET === 'your-secret-key-here') {
    warnings.push('Using default JWT secret in production. This is a security risk.');
  }

  const trustProxyEnv = process.env.TRUST_PROXY;
  const trustProxy =
    trustProxyEnv === 'true' ? true : trustProxyEnv === 'false' ? false : isProduction;

  return {
    nodeEnv,
    mediaStorageRoot: process.env.MEDIA_STORAGE_ROOT || path.resolve(__dirname, '../media'),
    postgresHost: process.env.POSTGRES_HOST || '127.0.0.1',
    postgresPort: Number(process.env.POSTGRES_PORT || 5432),
    postgresUser: process.env.POSTGRES_USER || 'postgres',
    postgresPassword: process.env.POSTGRES_PASSWORD || '',
    postgresDatabase: process.env.POSTGRES_DB || 'photo_app',
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-here',
    jwtExpiresIn: '30d',
    corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    graphqlHttpPath: process.env.GRAPHQL_HTTP_PATH || '/api/graphql',
    serverPort: Number(process.env.API_PORT || 3001),
    serverUrl: process.env.SERVER_URL || `http://localhost:${process.env.API_PORT || 3001}`,
    logLevel:
      (process.env.LOG_LEVEL as Config['logLevel'] | undefined) ||
      (isProduction ? 'info' : 'debug'),
    ...(warnings.length > 0 ? { warnings } : {}),
    logJsonFilePath: process.env.LOG_JSON_FILE_PATH || undefined,
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || undefined,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || undefined,
    s3Bucket: process.env.S3_BUCKET || 'photoshare-dev',
    s3UploadUrlTtlSeconds: process.env.S3_UPLOAD_URL_TTL_SECONDS
      ? Number(process.env.S3_UPLOAD_URL_TTL_SECONDS)
      : DEFAULT_UPLOAD_URL_TTL_SECONDS,
    s3DownloadUrlTtlSeconds: process.env.S3_DOWNLOAD_URL_TTL_SECONDS
      ? Number(process.env.S3_DOWNLOAD_URL_TTL_SECONDS)
      : DEFAULT_DOWNLOAD_URL_TTL_SECONDS,
    s3DownloadUrlSigningBucketSeconds: process.env.S3_DOWNLOAD_URL_SIGNING_BUCKET_SECONDS
      ? Number(process.env.S3_DOWNLOAD_URL_SIGNING_BUCKET_SECONDS)
      : DEFAULT_DOWNLOAD_URL_SIGNING_BUCKET_SECONDS,
    mediaWorkerPollIntervalMs: process.env.MEDIA_WORKER_POLL_MS
      ? Number(process.env.MEDIA_WORKER_POLL_MS)
      : 2000,
    trustProxy,
  };
};

export const build__Config = (): Config => {
  ensureEnvLoaded();
  return createConfigFromEnv();
};
