import type {
  FullConfig,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

/**
 * Prints the full test title and error as soon as a test fails or times out.
 * Use alongside the built-in `list` reporter when the terminal is non-TTY
 * (e.g. Cursor's integrated terminal), which only shows a single compact line.
 */
export default class VerboseFailuresReporter implements Reporter {
  #rootDir = '';

  onBegin(config: FullConfig, _suite: Suite): void {
    this.#rootDir = config.rootDir;
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status !== 'failed' && result.status !== 'timedOut') {
      return;
    }

    const title = test.titlePath().join(' › ');
    const lines: string[] = [
      '',
      '═'.repeat(72),
      `FAILED (${result.status}): ${title}`,
      `Duration: ${(result.duration / 1000).toFixed(1)}s`,
    ];

    if (result.errors.length > 0) {
      lines.push('');
      for (const [index, error] of result.errors.entries()) {
        if (result.errors.length > 1) {
          lines.push(`--- Error ${index + 1} ---`);
        }
        if (error.message) {
          lines.push(error.message.trimEnd());
        }
        if (error.stack) {
          lines.push(error.stack.trimEnd());
        }
      }
    } else {
      lines.push('', '(no error message captured)');
    }

    const attachments = result.attachments.filter(
      (a) => a.path != null && a.path.length > 0,
    );
    if (attachments.length > 0) {
      lines.push('', 'Artifacts:');
      for (const attachment of attachments) {
        lines.push(`  ${attachment.name}: ${attachment.path}`);
      }
    }

    const trace = attachments.find((a) => a.name === 'trace');
    if (trace?.path != null) {
      lines.push('', `View trace: npx playwright show-trace "${trace.path}"`);
    }

    lines.push(
      '',
      `HTML report: npx playwright show-report`,
      `Config root: ${this.#rootDir}`,
      '═'.repeat(72),
      '',
    );

    console.log(lines.join('\n'));
  }
}
