import type { CheckResult, ThemeReport } from './analyze.js';
import { CRITERIA } from './standards.js';

/** Two decimals, or more when two would round a failing value up to the threshold. */
function format(value: number, threshold: number | null): string {
  let digits = 2;
  while (threshold != null && digits < 6 && Number(value.toFixed(digits)) >= threshold) {
    digits++;
  }
  return value.toFixed(digits);
}

/** The suggested color as a sentence to append to a failure, or nothing when there is no fix. */
function describeFix({ fix }: CheckResult): string {
  if (fix == null) {
    return '';
  }
  const what = fix.target === 'text' ? 'label color' : `series ${(fix.series ?? 0) + 1}`;
  return `. Try ${what} ${fix.to} instead of ${fix.from}`;
}

/** One failure as a line: the check, where, the colors, the measured value against its threshold, and the standard. */
function describeFailure(result: CheckResult): string {
  const who =
    result.series.length === 0 ? 'text' : result.series.map((i) => `series ${i + 1}`).join(' vs ');
  const subject = result.mark == null ? who : `${who} ${result.mark}`;
  const measured =
    result.check === 'seriesVsSeries'
      ? `ΔE00 ${format(result.value, result.threshold)} < ${result.threshold}`
      : `${format(result.value, result.threshold)}:1 < ${result.threshold}:1`;
  return (
    `${result.check} [${result.background}, ${result.vision}] ${subject} ` +
    `(${result.colors[0]} / ${result.colors[1]}): ${measured}, ${CRITERIA[result.criterion].title}` +
    describeFix(result)
  );
}

/**
 * One readable line per failed check. Checks without a threshold never fail.
 *
 * @example
 * expect(themeFailures(analyzeTheme(myTheme))).toEqual([]);
 */
export function themeFailures(report: ThemeReport): string[] {
  return report.checks.filter((result) => result.passes === false).map(describeFailure);
}
