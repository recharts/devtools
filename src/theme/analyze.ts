import type { RechartsTheme } from 'recharts';
import {
  colorDifference,
  composite,
  contrastRatio,
  parseColor,
  simulateVision,
  toHex,
  VISIONS,
  type Vision,
} from './color.js';
import { type CriterionId, WCAG_CONTRAST } from './standards.js';
import { nearestPassingColor } from './suggest.js';

/**
 * - `fill`: the series fill, painted at its `fillOpacity` over the page. Bars, areas, pie slices.
 * - `stroke`: the series stroke, fully opaque. Lines, outlines, dots.
 */
export type Mark = 'fill' | 'stroke';

export type CheckId =
  | 'seriesOnBackground'
  | 'seriesVsSeries'
  | 'seriesContrast'
  | 'textOnBackground'
  | 'seriesAsText'
  | 'textOnSeries';

export type Thresholds = {
  /** Series against the page. Defaults to 3, from WCAG SC 1.4.11. */
  nonTextContrast: number;
  /** Labels against what they sit on. Defaults to 4.5, from WCAG SC 1.4.3. See `WCAG_CONTRAST` for the others. */
  textContrast: number;
  /**
   * Smallest CIEDE2000 difference between two series in typical vision.
   * No standard defines one, so there is no default: without it the check only reports values.
   */
  seriesDifference: number | null;
  /** Like `seriesDifference`, under simulated color vision deficiencies. No default either. */
  seriesDifferenceCvd: number | null;
  /**
   * WCAG contrast between two series, for charts where series touch, like pie slices without borders.
   * No default: WCAG SC 1.4.11 asks for 3:1 only when nothing else separates them.
   */
  seriesContrast: number | null;
};

export type ThemeCheckOptions = {
  /**
   * The backgrounds to check on, by name. Defaults to `{ page: theme.pageBackground }`, falling back to
   * `theme.chart.backgroundColor`. Pass more when the same theme shows on several surfaces, like cards.
   */
  backgrounds?: Readonly<Record<string, string>>;
  /** Only check the first N `graphicalItems`, when your charts never show more series. */
  seriesCount?: number;
  /** Defaults to all four. */
  visions?: ReadonlyArray<Vision>;
  /** From 0 to 1, see `simulateVision`. Defaults to 1. */
  severity?: number;
  /** Defaults to both. */
  marks?: ReadonlyArray<Mark>;
  thresholds?: Partial<Thresholds>;
  /**
   * Turn off checks that don't apply to your charts. Every check is on by default, except that
   * `textOnBackground` and `textOnSeries` only run when `theme.typography.color` is set.
   */
  checks?: Partial<Record<CheckId, boolean>>;
};

/** One series, as read from `theme.graphicalItems`. */
export type ThemeSeries = {
  index: number;
  fill: string;
  stroke: string;
  fillOpacity: number;
};

/**
 * A color that would make a failed check pass: the nearest lighter or darker color with the same hue.
 * Changing it may affect other checks, so run the analysis again after you change it.
 */
export type Fix = {
  /** Which color to change: a series (its fill or stroke, see `CheckResult.mark`) or the label color. */
  target: 'series' | 'text';
  /** The zero-based index of the series to change, or `null` for the label color. */
  series: number | null;
  from: string;
  to: string;
};

export type CheckResult = {
  check: CheckId;
  criterion: CriterionId;
  /** The name of the background, as a key of `ThemeReport.backgrounds`. */
  background: string;
  vision: Vision;
  mark: Mark | null;
  /** Zero-based indexes of the series involved. */
  series: ReadonlyArray<number>;
  /** The two colors compared, as the reader with this vision sees them. */
  colors: readonly [string, string];
  /** A contrast ratio, or a CIEDE2000 difference for `seriesVsSeries`. */
  value: number;
  threshold: number | null;
  /** `null` when there is no threshold, so the result is informational. */
  passes: boolean | null;
  /** Only on failed checks, and `null` when no lighter or darker color passes. */
  fix: Fix | null;
};

export type ThemeReport = {
  series: ReadonlyArray<ThemeSeries>;
  backgrounds: Readonly<Record<string, string>>;
  /** `theme.typography.color`, or `null` when the theme has none or the label checks are off. */
  text: string | null;
  visions: ReadonlyArray<Vision>;
  severity: number;
  marks: ReadonlyArray<Mark>;
  thresholds: Thresholds;
  checks: ReadonlyArray<CheckResult>;
};

const DEFAULT_THRESHOLDS: Thresholds = {
  nonTextContrast: WCAG_CONTRAST.nonText,
  textContrast: WCAG_CONTRAST.text,
  seriesDifference: null,
  seriesDifferenceCvd: null,
  seriesContrast: null,
};

/** The checks that need `theme.typography.color`. */
const LABEL_CHECKS: ReadonlyArray<CheckId> = ['textOnBackground', 'textOnSeries'];

function readSeries(theme: RechartsTheme, count: number): ThemeSeries[] {
  return theme.graphicalItems.slice(0, count).map((item, index) => {
    const color = item.fill ?? item.stroke;
    if (color == null) {
      throw new Error(`graphicalItems[${index}] has no fill or stroke color`);
    }
    const opacity = Number(item.fillOpacity ?? 1);
    return {
      index,
      fill: color,
      stroke: item.stroke ?? color,
      fillOpacity: Number.isFinite(opacity) ? opacity : 1,
    };
  });
}

function readBackgrounds(
  theme: RechartsTheme,
  options: ThemeCheckOptions,
): Readonly<Record<string, string>> {
  if (options.backgrounds != null) {
    return options.backgrounds;
  }
  const chartBackground = theme.chart?.backgroundColor;
  const page =
    theme.pageBackground ?? (typeof chartBackground === 'string' ? chartBackground : undefined);
  if (page == null) {
    throw new Error('The theme has no pageBackground; set it, or pass options.backgrounds');
  }
  return { page };
}

/**
 * Measures how readable the colors of a Recharts theme are: series against the page, series against
 * each other, and labels on the page and on the series, for every background and every simulated vision.
 *
 * Nothing from Recharts runs here: the theme is plain data, and its type is only used at compile time.
 * The result is plain data too. Use `themeFailures` to turn it into test assertions.
 */
export function analyzeTheme(theme: RechartsTheme, options: ThemeCheckOptions = {}): ThemeReport {
  const visions = options.visions ?? VISIONS;
  const severity = options.severity ?? 1;
  const marks = options.marks ?? (['fill', 'stroke'] as const);
  const thresholds: Thresholds = { ...DEFAULT_THRESHOLDS, ...options.thresholds };
  const typography = theme.typography?.color;
  const text = typeof typography === 'string' ? typography : null;
  const enabled = (check: CheckId) =>
    options.checks?.[check] !== false && (text != null || !LABEL_CHECKS.includes(check));

  const series = readSeries(theme, options.seriesCount ?? theme.graphicalItems.length);
  const backgrounds = readBackgrounds(theme, options);
  const checks: CheckResult[] = [];

  for (const [background, backgroundColor] of Object.entries(backgrounds)) {
    const page = parseColor(backgroundColor);
    if (page.alpha !== undefined && page.alpha < 1) {
      throw new Error(`Background "${background}" must be opaque, got "${backgroundColor}"`);
    }
    const pageHex = toHex(page);
    // What a series looks like on this page in typical vision, before simulation.
    const paint = (s: ThemeSeries, mark: Mark, color = mark === 'fill' ? s.fill : s.stroke) =>
      toHex(composite(color, mark === 'fill' ? s.fillOpacity : 1, page));
    const label = text == null ? null : toHex(composite(text, 1, page));

    for (const vision of visions) {
      const see = (color: string) => toHex(simulateVision(color, vision, severity));
      const seenPage = see(pageHex);
      const seenLabel = label == null ? null : see(label);

      /**
       * Records one measurement. `measure` takes the color under test as it is in the theme, so the same
       * function finds a fix when the check fails.
       */
      const add = (
        result: Omit<CheckResult, 'criterion' | 'passes' | 'fix' | 'value'>,
        criterion: CriterionId,
        target: Omit<Fix, 'to'>,
        measure: (color: string) => number,
      ) => {
        const value = measure(target.from);
        const passes = result.threshold == null ? null : value >= result.threshold;
        const threshold = result.threshold;
        const to =
          passes === false && threshold != null
            ? nearestPassingColor(target.from, (hex) => measure(hex) >= threshold)
            : null;
        checks.push({
          ...result,
          value,
          criterion,
          passes,
          fix: to == null ? null : { ...target, to },
        });
      };

      for (const mark of marks) {
        const seen = series.map((s) => see(paint(s, mark)));
        const own = (s: ThemeSeries) => (mark === 'fill' ? s.fill : s.stroke);
        const seriesFix = (s: ThemeSeries) =>
          ({ target: 'series', series: s.index, from: own(s) }) as const;

        if (enabled('seriesOnBackground')) {
          series.forEach((s, i) =>
            add(
              {
                check: 'seriesOnBackground',
                background,
                vision,
                mark,
                series: [i],
                colors: [seen[i], seenPage],
                threshold: thresholds.nonTextContrast,
              },
              'wcag-1.4.11',
              seriesFix(s),
              (color) => contrastRatio(see(paint(s, mark, color)), seenPage),
            ),
          );
        }

        for (let i = 0; i < series.length; i++) {
          for (let j = i + 1; j < series.length; j++) {
            // A fix changes the second series of the pair, and keeps the first one as it is.
            const second = series[j];
            if (enabled('seriesVsSeries')) {
              add(
                {
                  check: 'seriesVsSeries',
                  background,
                  vision,
                  mark,
                  series: [i, j],
                  colors: [seen[i], seen[j]],
                  threshold:
                    vision === 'normal'
                      ? thresholds.seriesDifference
                      : thresholds.seriesDifferenceCvd,
                },
                'ciede2000',
                seriesFix(second),
                (color) => colorDifference(seen[i], see(paint(second, mark, color))),
              );
            }
            if (enabled('seriesContrast')) {
              add(
                {
                  check: 'seriesContrast',
                  background,
                  vision,
                  mark,
                  series: [i, j],
                  colors: [seen[i], seen[j]],
                  threshold: thresholds.seriesContrast,
                },
                'wcag-1.4.11',
                seriesFix(second),
                (color) => contrastRatio(seen[i], see(paint(second, mark, color))),
              );
            }
          }
        }

        if (mark === 'stroke' && enabled('seriesAsText')) {
          series.forEach((s, i) =>
            add(
              {
                check: 'seriesAsText',
                background,
                vision,
                mark,
                series: [i],
                colors: [seen[i], seenPage],
                threshold: thresholds.textContrast,
              },
              'wcag-1.4.3',
              seriesFix(s),
              (color) => contrastRatio(see(paint(s, mark, color)), seenPage),
            ),
          );
        }

        if (mark === 'fill' && text != null && seenLabel != null && enabled('textOnSeries')) {
          series.forEach((s, i) =>
            add(
              {
                check: 'textOnSeries',
                background,
                vision,
                mark,
                series: [i],
                colors: [seenLabel, seen[i]],
                threshold: thresholds.textContrast,
              },
              'wcag-1.4.3',
              // The label color is shared by every series, so the fix is a label color for this one series.
              { target: 'text', series: null, from: text },
              (color) => contrastRatio(see(toHex(composite(color, 1, page))), seen[i]),
            ),
          );
        }
      }

      if (text != null && seenLabel != null && enabled('textOnBackground')) {
        add(
          {
            check: 'textOnBackground',
            background,
            vision,
            mark: null,
            series: [],
            colors: [seenLabel, seenPage],
            threshold: thresholds.textContrast,
          },
          'wcag-1.4.3',
          { target: 'text', series: null, from: text },
          (color) => contrastRatio(see(toHex(composite(color, 1, page))), seenPage),
        );
      }
    }
  }

  return {
    series,
    backgrounds: { ...backgrounds },
    text: enabled('textOnBackground') || enabled('textOnSeries') ? text : null,
    visions: [...visions],
    severity,
    marks: [...marks],
    thresholds,
    checks,
  };
}
