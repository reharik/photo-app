/**
 * `ffmpeg` and `ffprobe` are spawned by bare name, so PATH is the contract and
 * nothing in `npm ci` satisfies it. This suite exists because the failure it
 * guards against is invisible: an image built without the ffmpeg layer boots
 * clean and only breaks on the first video job.
 *
 * `node:child_process` is mocked at the module boundary. Shelling out to the
 * real binaries would make the suite pass or fail on whether the HOST has
 * ffmpeg installed — which is precisely the confusion this check exists to end,
 * and would have the suite silently assert nothing on a machine that has it.
 */
import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

type ExecFileCallback = (err: Error | null, out: { stdout: string; stderr: string }) => void;

/** Records what was spawned, and answers from a per-test script. */
const execFileCalls: Array<{ file: string; args: readonly string[]; options: unknown }> = [];
let execFileBehaviour: (file: string) => { stdout: string } | Error;

const FFPROBE_VERSION = 'ffprobe version 5.1.9-0+deb12u1 Copyright (c) 2007-2024';
const FFMPEG_VERSION = 'ffmpeg version 5.1.9-0+deb12u1 Copyright (c) 2000-2024';

// promisify() honours util.promisify.custom, but the plain callback shape is
// what execFile actually exports, so the mock mirrors that: last arg is the cb.
const execFileMock = (
  file: string,
  args: readonly string[],
  options: unknown,
  callback: ExecFileCallback,
) => {
  execFileCalls.push({ file, args, options });
  const result = execFileBehaviour(file);
  if (result instanceof Error) {
    callback(result, { stdout: '', stderr: '' });
    return;
  }
  callback(null, { stdout: result.stdout, stderr: '' });
};

describe('verifyMediaToolchain', () => {
  let verifyMediaToolchain: typeof import('../tasks/queue/mediaWorkers/verifyMediaToolchain.js').verifyMediaToolchain;

  beforeAll(async () => {
    jest.unstable_mockModule('node:child_process', () => ({ execFile: execFileMock }));
    ({ verifyMediaToolchain } =
      await import('../tasks/queue/mediaWorkers/verifyMediaToolchain.js'));
  });

  beforeEach(() => {
    execFileCalls.length = 0;
    execFileBehaviour = (file) => ({
      stdout: `${file === 'ffprobe' ? FFPROBE_VERSION : FFMPEG_VERSION}\n  built with gcc 12\n`,
    });
  });

  describe('When both binaries are present', () => {
    it('should return the first line of each version banner', async () => {
      const versions = await verifyMediaToolchain();

      // Only the first line: the rest is build flags and per-library versions,
      // which would bury the boot log.
      expect(versions).toEqual({ ffprobe: FFPROBE_VERSION, ffmpeg: FFMPEG_VERSION });
    });

    it('should probe both binaries by bare name, exactly as the pipeline spawns them', async () => {
      await verifyMediaToolchain();

      // Bare names, not absolute paths: if the check resolved a path that the
      // generator does not, it could pass while the pipeline still failed.
      expect(execFileCalls.map((c) => c.file)).toEqual(['ffprobe', 'ffmpeg']);
      expect(execFileCalls.every((c) => c.args[0] === '-version')).toBe(true);
    });

    it('should bound each probe with a timeout so a wedged binary cannot hang boot', async () => {
      await verifyMediaToolchain();

      for (const call of execFileCalls) {
        expect(call.options).toEqual(expect.objectContaining({ timeout: expect.any(Number) }));
      }
    });
  });

  describe('When ffprobe is missing', () => {
    it('should reject and not bother probing ffmpeg', async () => {
      execFileBehaviour = (file) => {
        if (file === 'ffprobe') return new Error('spawn ffprobe ENOENT');
        return { stdout: FFMPEG_VERSION };
      };

      await expect(verifyMediaToolchain()).rejects.toThrow('ENOENT');
      expect(execFileCalls.map((c) => c.file)).toEqual(['ffprobe']);
    });
  });

  describe('When only ffmpeg is missing', () => {
    it('should still reject', async () => {
      // The two ship in one Debian package, so this is the partial-install /
      // bad-COPY case. Checking both is what makes it detectable at all.
      execFileBehaviour = (file) => {
        if (file === 'ffmpeg') return new Error('spawn ffmpeg ENOENT');
        return { stdout: FFPROBE_VERSION };
      };

      await expect(verifyMediaToolchain()).rejects.toThrow('ENOENT');
      expect(execFileCalls.map((c) => c.file)).toEqual(['ffprobe', 'ffmpeg']);
    });
  });

  describe('When a binary is present but cannot run', () => {
    it('should reject rather than report a version', async () => {
      // e.g. a dynamically-linked binary whose libraries are absent: the file
      // exists, so a `command -v` style check would wrongly pass.
      execFileBehaviour = () =>
        new Error('ffprobe: error while loading shared libraries: libavcodec.so.59');

      await expect(verifyMediaToolchain()).rejects.toThrow('shared libraries');
    });
  });
});
