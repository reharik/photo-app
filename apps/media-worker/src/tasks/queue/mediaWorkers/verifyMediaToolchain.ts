import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

/**
 * `ffmpeg` and `ffprobe` are CLI programs, not npm packages: nothing in
 * `npm ci` puts them on PATH, and `videoDerivativeGenerator` spawns them by
 * bare name via `execFile`. So a worker image built without the apt install
 * (docker/Dockerfile, the SERVICE_NAME-conditional layer in `runtime-node`)
 * looks perfectly healthy until the first video job, which then fails once per
 * attempt until it hits the retry cap.
 *
 * Both binaries are checked, not just one. They come from the same Debian
 * package today, but a partial install or a bad COPY can leave one behind, and
 * the second probe is free.
 *
 * `-version` is chosen over a no-op invocation because it is the cheapest call
 * that still proves the binary loads and links — and it hands us the version
 * string to log, which is the answer to "which ffmpeg is actually in prod".
 */
const TOOLS = ['ffprobe', 'ffmpeg'] as const;

/**
 * Deliberately short. A healthy `-version` returns in milliseconds; anything
 * slower means a binary that cannot resolve its libraries, and boot should say
 * so rather than hang before the Postgres and S3 probes get their turn.
 */
const PROBE_TIMEOUT_MS = 5_000;

export type MediaToolchainVersions = Record<(typeof TOOLS)[number], string>;

export const verifyMediaToolchain = async (): Promise<MediaToolchainVersions> => {
  const versions = {} as MediaToolchainVersions;

  for (const tool of TOOLS) {
    const { stdout } = await exec(tool, ['-version'], { timeout: PROBE_TIMEOUT_MS });
    // `ffmpeg -version` opens with e.g. "ffmpeg version 5.1.9-0+deb12u1 ...";
    // the rest is build flags and per-library versions, which are noise in a
    // boot log.
    versions[tool] = stdout.split('\n')[0]?.trim() ?? '';
  }

  return versions;
};
