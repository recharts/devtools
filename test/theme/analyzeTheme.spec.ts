import type { RechartsTheme } from 'recharts';
import {
  analyzeTheme,
  colorDifference,
  composite,
  contrastRatio,
  nearestPassingColor,
  themeFailures,
  type CheckId,
} from '../../src/theme/index.js';
import { darkTheme, lightTheme } from './fixtures.js';

const checkIds: ReadonlyArray<CheckId> = [
  'seriesOnBackground',
  'seriesVsSeries',
  'seriesContrast',
  'textOnBackground',
  'seriesAsText',
  'textOnSeries',
];

const twoSeries: RechartsTheme = {
  graphicalItems: [
    { fill: '#2775e8', stroke: '#2775e8' },
    { fill: '#b65900', fillOpacity: 0.5 },
  ],
  typography: { color: '#18181b' },
  pageBackground: '#fff',
};

describe('analyzeTheme', () => {
  test('runs every check for every background, vision and mark', () => {
    const report = analyzeTheme(twoSeries, { backgrounds: { light: '#fff', card: '#f4f4f5' } });
    const count = (check: string) => report.checks.filter((c) => c.check === check).length;
    // 2 backgrounds x 4 visions = 8 combinations
    expect(count('seriesOnBackground')).toBe(8 * 2 * 2); // x 2 marks x 2 series
    expect(count('seriesVsSeries')).toBe(8 * 2 * 1); // x 2 marks x 1 pair
    expect(count('seriesContrast')).toBe(8 * 2 * 1);
    expect(count('seriesAsText')).toBe(8 * 2); // strokes only
    expect(count('textOnSeries')).toBe(8 * 2); // fills only
    expect(count('textOnBackground')).toBe(8);
  });

  test('reads the series, the page background and the label color from the theme', () => {
    const report = analyzeTheme(twoSeries);
    expect(report.backgrounds).toEqual({ page: '#fff' });
    expect(report.text).toBe('#18181b');
    expect(report.series).toEqual([
      { index: 0, fill: '#2775e8', stroke: '#2775e8', fillOpacity: 1 },
      { index: 1, fill: '#b65900', stroke: '#b65900', fillOpacity: 0.5 },
    ]);
  });

  test('falls back to the chart background, and asks for one when there is none', () => {
    const items = [{ fill: '#000' }];
    expect(
      analyzeTheme({ graphicalItems: items, chart: { backgroundColor: '#eee' } }).backgrounds,
    ).toEqual({
      page: '#eee',
    });
    expect(() => analyzeTheme({ graphicalItems: items })).toThrow('pass options.backgrounds');
  });

  test('rejects a series without a color, and a translucent background', () => {
    expect(() => analyzeTheme({ graphicalItems: [{}], pageBackground: '#fff' })).toThrow(
      'graphicalItems[0] has no fill or stroke color',
    );
    expect(() =>
      analyzeTheme({
        graphicalItems: [{ fill: '#000' }],
        pageBackground: 'rgba(255, 255, 255, 0.5)',
      }),
    ).toThrow('must be opaque');
  });

  test('composites the fill at its opacity before measuring', () => {
    const report = analyzeTheme(twoSeries, { visions: ['normal'] });
    const fill = report.checks.find(
      (c) => c.check === 'seriesOnBackground' && c.mark === 'fill' && c.series[0] === 1,
    );
    expect(fill?.colors).toEqual(['#dbac80', '#ffffff']);
  });

  test('reports values without a verdict when no standard defines a threshold', () => {
    const report = analyzeTheme(twoSeries);
    const pairs = report.checks.filter(
      (c) => c.check === 'seriesVsSeries' || c.check === 'seriesContrast',
    );
    expect(pairs.every((c) => c.threshold === null && c.passes === null && c.fix === null)).toBe(
      true,
    );
  });

  test('uses separate thresholds for typical vision and for simulated deficiencies', () => {
    const report = analyzeTheme(twoSeries, {
      thresholds: { seriesDifference: 10, seriesDifferenceCvd: 2 },
    });
    const pairs = report.checks.filter((c) => c.check === 'seriesVsSeries');
    expect(pairs.filter((c) => c.vision === 'normal').every((c) => c.threshold === 10)).toBe(true);
    expect(pairs.filter((c) => c.vision !== 'normal').every((c) => c.threshold === 2)).toBe(true);
  });

  test('skips the label checks without a label color, and the checks that are turned off', () => {
    const report = analyzeTheme(
      { graphicalItems: twoSeries.graphicalItems, pageBackground: '#fff' },
      { checks: { seriesContrast: false } },
    );
    const ran = new Set(report.checks.map((c) => c.check));
    expect([...ran].sort()).toEqual(['seriesAsText', 'seriesOnBackground', 'seriesVsSeries']);
    expect(report.text).toBeNull();
  });

  test('reports failure when text has not enough contrast vs background', () => {
    const exampleTheme: RechartsTheme = {
      pageBackground: '#fff',
      typography: {
        color: '#eee',
      },
      graphicalItems: [],
    };
    const report = analyzeTheme(exampleTheme, {
      visions: ['normal'],
      checks: { textOnBackground: true },
    });
    expect(report.checks).toHaveLength(1);
    expect(report.checks).toEqual([
      {
        background: 'page',
        check: 'textOnBackground',
        colors: ['#eeeeee', '#ffffff'],
        criterion: 'wcag-1.4.3',
        fix: {
          from: '#eee',
          series: null,
          target: 'text',
          to: '#767676',
        },
        mark: null,
        passes: false,
        series: [],
        threshold: 4.5,
        value: 1.1602304710270739,
        vision: 'normal',
      },
    ]);
  });

  test('compares label text with the rendered series fill and background separately', () => {
    const report = analyzeTheme(
      {
        pageBackground: '#000',
        typography: { color: '#eee' },
        graphicalItems: [{ fill: '#fff', fillOpacity: 0.5 }],
      },
      { visions: ['normal'], marks: ['fill'] },
    );

    expect(report.checks).toEqual([
      {
        background: 'page',
        check: 'seriesOnBackground',
        // #808080 is half opacity #fff
        colors: ['#808080', '#000000'],
        criterion: 'wcag-1.4.11',
        fix: null,
        mark: 'fill',
        passes: true,
        series: [0],
        threshold: 3,
        value: 5.317210002277984,
        vision: 'normal',
      },
      {
        background: 'page',
        check: 'textOnSeries',
        colors: ['#eeeeee', '#808080'],
        criterion: 'wcag-1.4.3',
        fix: {
          from: '#eee',
          series: null,
          target: 'text',
          to: '#171717',
        },
        mark: 'fill',
        passes: false,
        series: [0],
        threshold: 4.5,
        value: 3.404013035921167,
        vision: 'normal',
      },
      {
        background: 'page',
        check: 'textOnBackground',
        colors: ['#eeeeee', '#000000'],
        criterion: 'wcag-1.4.3',
        fix: null,
        mark: null,
        passes: true,
        series: [],
        threshold: 4.5,
        value: 18.099852162484677,
        vision: 'normal',
      },
    ]);
  });

  test('composites a translucent label color over the background', () => {
    const label = 'rgba(255, 255, 255, 0.5)';
    const report = analyzeTheme(
      {
        graphicalItems: [],
        pageBackground: '#000',
        typography: { color: label },
      },
      { visions: ['normal'] },
    );

    expect(report.text).toBe(label);
    expect(report.checks).toEqual([
      {
        background: 'page',
        check: 'textOnBackground',
        colors: ['#808080', '#000000'],
        criterion: 'wcag-1.4.3',
        fix: null,
        mark: null,
        passes: true,
        series: [],
        threshold: 4.5,
        value: 5.317210002277984,
        vision: 'normal',
      },
    ]);
  });

  test('uses stroke when fill is absent and defaults fill opacity to one', () => {
    const report = analyzeTheme(
      { graphicalItems: [{ stroke: '#123456' }], pageBackground: '#fff' },
      { visions: ['normal'], marks: ['fill'] },
    );

    expect(report.series).toEqual([
      { index: 0, fill: '#123456', stroke: '#123456', fillOpacity: 1 },
    ]);
    expect(report.checks).toEqual([
      {
        background: 'page',
        check: 'seriesOnBackground',
        colors: ['#123456', '#ffffff'],
        criterion: 'wcag-1.4.11',
        fix: null,
        mark: 'fill',
        passes: true,
        series: [0],
        threshold: 3,
        value: 12.717304079982272,
        vision: 'normal',
      },
    ]);
  });

  test.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'defaults non-finite fill opacity (%s) to one',
    (fillOpacity) => {
      const report = analyzeTheme(
        { graphicalItems: [{ fill: '#123456', fillOpacity }], pageBackground: '#fff' },
        { visions: ['normal'], marks: ['fill'] },
      );

      expect(report.series[0]?.fillOpacity).toBe(1);
      expect(report.checks[0]?.colors[0]).toBe('#123456');
    },
  );

  test('multiplies a fill color alpha by fill opacity before measuring', () => {
    const report = analyzeTheme(
      {
        graphicalItems: [{ fill: 'rgba(255, 0, 0, 0.5)', fillOpacity: 0.5 }],
        pageBackground: '#fff',
      },
      { visions: ['normal'], marks: ['fill'] },
    );

    expect(report.checks[0]?.colors).toEqual(['#ffbfbf', '#ffffff']);
  });

  test('does not apply fill opacity to a series stroke', () => {
    const report = analyzeTheme(
      {
        graphicalItems: [{ fill: '#0000ff', stroke: '#ff0000', fillOpacity: 0 }],
        pageBackground: '#fff',
      },
      { visions: ['normal'], marks: ['stroke'] },
    );

    expect(report.checks.find((result) => result.check === 'seriesAsText')?.colors).toEqual([
      '#ff0000',
      '#ffffff',
    ]);
  });

  test('uses supplied named backgrounds instead of the theme backgrounds', () => {
    const backgrounds = { card: '#f4f4f5', tooltip: '#18181b' };
    const report = analyzeTheme(
      {
        graphicalItems: [{ fill: '#777' }],
        pageBackground: '#fff',
        chart: { backgroundColor: '#000' },
      },
      { backgrounds, visions: ['normal'], marks: ['fill'] },
    );

    expect(report.backgrounds).toEqual(backgrounds);
    expect(report.checks.map((result) => result.background)).toEqual(['card', 'tooltip']);
  });

  test('accepts explicit backgrounds when the theme has no background', () => {
    const report = analyzeTheme(
      { graphicalItems: [{ fill: '#000' }] },
      { backgrounds: { panel: '#fff' }, visions: ['normal'], marks: ['fill'] },
    );

    expect(report.backgrounds).toEqual({ panel: '#fff' });
    expect(report.checks[0]?.background).toBe('panel');
  });

  test('returns no checks for an explicitly empty background set', () => {
    const report = analyzeTheme({ graphicalItems: [] }, { backgrounds: {} });

    expect(report.backgrounds).toEqual({});
    expect(report.checks).toEqual([]);
  });

  test('prefers pageBackground over the chart background', () => {
    const report = analyzeTheme({
      graphicalItems: [{ fill: '#000' }],
      pageBackground: '#eee',
      chart: { backgroundColor: '#fff' },
    });

    expect(report.backgrounds).toEqual({ page: '#eee' });
  });

  test('rejects a translucent named background', () => {
    expect(() =>
      analyzeTheme(
        { graphicalItems: [] },
        { backgrounds: { overlay: 'rgba(255, 255, 255, 0.5)' } },
      ),
    ).toThrow('Background "overlay" must be opaque');
  });

  test('accepts an opaque alpha background and normalizes its measured color', () => {
    const report = analyzeTheme(
      { graphicalItems: [{ fill: '#000' }] },
      {
        backgrounds: { card: 'rgba(255, 255, 255, 1)' },
        visions: ['normal'],
        marks: ['fill'],
      },
    );

    expect(report.backgrounds).toEqual({ card: 'rgba(255, 255, 255, 1)' });
    expect(report.checks[0]?.colors).toEqual(['#000000', '#ffffff']);
  });

  test('rejects a background color it cannot parse', () => {
    expect(() =>
      analyzeTheme({ graphicalItems: [] }, { backgrounds: { card: 'not-a-color' } }),
    ).toThrow('Cannot parse color "not-a-color"');
  });

  test('rejects a series color it cannot parse', () => {
    expect(() =>
      analyzeTheme(
        { graphicalItems: [{ fill: 'not-a-color' }], pageBackground: '#fff' },
        { visions: ['normal'], marks: ['fill'] },
      ),
    ).toThrow('Cannot parse color "not-a-color"');
  });

  test('reports the documented defaults for visions, severity, marks, and thresholds', () => {
    const report = analyzeTheme({ graphicalItems: [], pageBackground: '#fff' });

    expect(report.visions).toEqual(['normal', 'protanopia', 'deuteranopia', 'tritanopia']);
    expect(report.severity).toBe(1);
    expect(report.marks).toEqual(['fill', 'stroke']);
    expect(report.thresholds).toEqual({
      nonTextContrast: 3,
      textContrast: 4.5,
      seriesDifference: null,
      seriesDifferenceCvd: null,
      seriesContrast: null,
    });
  });

  test('merges threshold overrides and applies the custom text threshold', () => {
    const report = analyzeTheme(
      {
        graphicalItems: [{ fill: '#777' }],
        typography: { color: '#777' },
        pageBackground: '#fff',
      },
      { visions: ['normal'], marks: ['fill'], thresholds: { textContrast: 7 } },
    );
    const textOnBackground = report.checks.find((result) => result.check === 'textOnBackground');

    expect(report.thresholds).toEqual({
      nonTextContrast: 3,
      textContrast: 7,
      seriesDifference: null,
      seriesDifferenceCvd: null,
      seriesContrast: null,
    });
    expect(report.checks.find((result) => result.check === 'seriesOnBackground')?.threshold).toBe(
      3,
    );
    expect(textOnBackground?.threshold).toBe(7);
    expect(textOnBackground?.passes).toBe(false);
  });

  test('uses severity zero as typical vision for a simulated deficiency', () => {
    const theme: RechartsTheme = {
      graphicalItems: [{ fill: '#ff0000' }],
      pageBackground: '#fff',
    };
    const normal = analyzeTheme(theme, { visions: ['normal'], marks: ['fill'] });
    const noDeficiency = analyzeTheme(theme, {
      visions: ['protanopia'],
      severity: 0,
      marks: ['fill'],
    });
    const fullDeficiency = analyzeTheme(theme, {
      visions: ['protanopia'],
      severity: 1,
      marks: ['fill'],
    });

    expect(noDeficiency.severity).toBe(0);
    expect(noDeficiency.checks[0]?.colors).toEqual(normal.checks[0]?.colors);
    expect(fullDeficiency.checks[0]?.colors).not.toEqual(normal.checks[0]?.colors);
  });

  test('uses fractional severity for simulated color vision', () => {
    const theme: RechartsTheme = {
      graphicalItems: [{ fill: '#ff0000' }],
      pageBackground: '#fff',
    };
    const halfDeficiency = analyzeTheme(theme, {
      visions: ['protanopia'],
      severity: 0.5,
      marks: ['fill'],
    });
    const fullDeficiency = analyzeTheme(theme, {
      visions: ['protanopia'],
      severity: 1,
      marks: ['fill'],
    });

    expect(halfDeficiency.severity).toBe(0.5);
    expect(halfDeficiency.checks[0]?.colors[0]).not.toBe(fullDeficiency.checks[0]?.colors[0]);
  });

  test('returns no checks when no visions are selected', () => {
    const report = analyzeTheme(twoSeries, { visions: [] });

    expect(report.visions).toEqual([]);
    expect(report.series).toHaveLength(2);
    expect(report.checks).toEqual([]);
  });

  test.each(checkIds)('omits %s when that check is disabled', (check) => {
    const report = analyzeTheme(twoSeries, {
      visions: ['normal'],
      checks: { [check]: false },
    });

    expect(report.checks.some((result) => result.check === check)).toBe(false);
    expect(report.checks.length).toBeGreaterThan(0);
  });

  test('clears report text when both label checks are disabled', () => {
    const report = analyzeTheme(twoSeries, {
      visions: ['normal'],
      checks: { textOnBackground: false, textOnSeries: false },
    });

    expect(report.text).toBeNull();
    expect(report.checks.some((result) => result.check === 'textOnBackground')).toBe(false);
    expect(report.checks.some((result) => result.check === 'textOnSeries')).toBe(false);
  });

  test.each([
    ['textOnBackground', 'textOnSeries'],
    ['textOnSeries', 'textOnBackground'],
  ] as const)('retains report text when %s is disabled but %s is enabled', (disabled, enabled) => {
    const report = analyzeTheme(twoSeries, {
      visions: ['normal'],
      checks: { [disabled]: false },
    });

    expect(report.text).toBe('#18181b');
    expect(report.checks.some((result) => result.check === enabled)).toBe(true);
  });

  test('runs the text-on-background check even when no marks are selected', () => {
    const report = analyzeTheme(twoSeries, { visions: ['normal'], marks: [] });

    expect(report.marks).toEqual([]);
    expect(report.checks.map((result) => result.check)).toEqual(['textOnBackground']);
  });

  test('compares every unordered pair of series once in index order', () => {
    const report = analyzeTheme(
      {
        graphicalItems: [{ fill: '#123456' }, { fill: '#789abc' }, { fill: '#def012' }],
        pageBackground: '#fff',
      },
      { visions: ['normal'], marks: ['fill'] },
    );

    expect(report.checks).toEqual([
      {
        background: 'page',
        check: 'seriesOnBackground',
        colors: ['#123456', '#ffffff'],
        criterion: 'wcag-1.4.11',
        fix: null,
        mark: 'fill',
        passes: true,
        series: [0],
        threshold: 3,
        value: 12.717304079982272,
        vision: 'normal',
      },
      {
        background: 'page',
        check: 'seriesOnBackground',
        colors: ['#789abc', '#ffffff'],
        criterion: 'wcag-1.4.11',
        fix: {
          from: '#789abc',
          series: 1,
          target: 'series',
          to: '#7698ba',
        },
        mark: 'fill',
        passes: false,
        series: [1],
        threshold: 3,
        value: 2.938286566008018,
        vision: 'normal',
      },
      {
        background: 'page',
        check: 'seriesOnBackground',
        colors: ['#def012', '#ffffff'],
        criterion: 'wcag-1.4.11',
        fix: {
          from: '#def012',
          series: 2,
          target: 'series',
          to: '#909c00',
        },
        mark: 'fill',
        passes: false,
        series: [2],
        threshold: 3,
        value: 1.2666864179647987,
        vision: 'normal',
      },
      {
        background: 'page',
        check: 'seriesVsSeries',
        colors: ['#123456', '#789abc'],
        criterion: 'ciede2000',
        fix: null,
        mark: 'fill',
        passes: null,
        series: [0, 1],
        threshold: null,
        value: 37.33308554842795,
        vision: 'normal',
      },
      {
        background: 'page',
        check: 'seriesContrast',
        colors: ['#123456', '#789abc'],
        criterion: 'wcag-1.4.11',
        fix: null,
        mark: 'fill',
        passes: null,
        series: [0, 1],
        threshold: null,
        value: 4.328136073283047,
        vision: 'normal',
      },
      {
        background: 'page',
        check: 'seriesVsSeries',
        colors: ['#123456', '#def012'],
        criterion: 'ciede2000',
        fix: null,
        mark: 'fill',
        passes: null,
        series: [0, 2],
        threshold: null,
        value: 84.94507563213139,
        vision: 'normal',
      },
      {
        background: 'page',
        check: 'seriesContrast',
        colors: ['#123456', '#def012'],
        criterion: 'wcag-1.4.11',
        fix: null,
        mark: 'fill',
        passes: null,
        series: [0, 2],
        threshold: null,
        value: 10.039820353024174,
        vision: 'normal',
      },
      {
        background: 'page',
        check: 'seriesVsSeries',
        colors: ['#789abc', '#def012'],
        criterion: 'ciede2000',
        fix: null,
        mark: 'fill',
        passes: null,
        series: [1, 2],
        threshold: null,
        value: 55.77904567322128,
        vision: 'normal',
      },
      {
        background: 'page',
        check: 'seriesContrast',
        colors: ['#789abc', '#def012'],
        criterion: 'wcag-1.4.11',
        fix: null,
        mark: 'fill',
        passes: null,
        series: [1, 2],
        threshold: null,
        value: 2.3196637497139982,
        vision: 'normal',
      },
    ]);
  });

  test('does not emit pairwise checks for a single series', () => {
    const report = analyzeTheme(
      { graphicalItems: [{ fill: '#000' }], pageBackground: '#fff' },
      { visions: ['normal'], marks: ['fill'] },
    );

    expect(report.checks.map((result) => result.check)).toEqual(['seriesOnBackground']);
  });

  test('applies the optional threshold to series contrast and omits an impossible fix', () => {
    const report = analyzeTheme(
      {
        graphicalItems: [{ fill: '#000' }, { fill: '#fff' }],
        pageBackground: '#fff',
      },
      {
        visions: ['normal'],
        marks: ['fill'],
        thresholds: { seriesContrast: 22 },
        checks: { seriesOnBackground: false, seriesVsSeries: false },
      },
    );

    expect(report.checks).toEqual([
      {
        background: 'page',
        check: 'seriesContrast',
        colors: ['#000000', '#ffffff'],
        criterion: 'wcag-1.4.11',
        fix: null,
        mark: 'fill',
        passes: false,
        series: [0, 1],
        threshold: 22,
        value: 21,
        vision: 'normal',
      },
    ]);
  });

  test('passes a check whose value equals its threshold', () => {
    const report = analyzeTheme(
      { graphicalItems: [{ fill: '#000' }], pageBackground: '#fff' },
      {
        visions: ['normal'],
        marks: ['fill'],
        thresholds: { nonTextContrast: 21 },
      },
    );

    expect(report.checks).toEqual([
      {
        background: 'page',
        check: 'seriesOnBackground',
        colors: ['#000000', '#ffffff'],
        criterion: 'wcag-1.4.11',
        fix: null,
        mark: 'fill',
        passes: true,
        series: [0],
        threshold: 21,
        value: 21,
        vision: 'normal',
      },
    ]);
  });

  test('does not suggest a color fix when zero fill opacity prevents any change in contrast', () => {
    const report = analyzeTheme(
      {
        graphicalItems: [{ fill: '#123456', fillOpacity: 0 }],
        pageBackground: '#fff',
      },
      { visions: ['normal'], marks: ['fill'] },
    );

    expect(report.checks).toEqual([
      {
        background: 'page',
        check: 'seriesOnBackground',
        colors: ['#ffffff', '#ffffff'],
        criterion: 'wcag-1.4.11',
        fix: null,
        mark: 'fill',
        passes: false,
        series: [0],
        threshold: 3,
        value: 1,
        vision: 'normal',
      },
    ]);
  });
});

describe('fixes', () => {
  test('suggest the nearest color with the same hue that passes', () => {
    const report = analyzeTheme(
      { graphicalItems: [{ fill: '#2775e8', stroke: '#2775e8' }], pageBackground: '#fff' },
      { visions: ['normal'], marks: ['stroke'] },
    );
    const asText = report.checks.find((c) => c.check === 'seriesAsText');
    expect(asText?.passes).toBe(false);
    expect(asText?.fix).toEqual({
      target: 'series',
      series: 0,
      from: '#2775e8',
      to: expect.stringMatching(/^#/),
    });
    const to = asText?.fix?.to ?? '';
    expect(contrastRatio(to, '#fff')).toBeGreaterThanOrEqual(4.5);
    // The nearest passing color, not just any: one lightness step lighter fails again.
    expect(colorDifference(to, '#2775e8')).toBeLessThan(3);
  });

  test('pass the check they were made for, through compositing and simulation', () => {
    const report = analyzeTheme(lightTheme, {
      thresholds: { seriesDifference: 10, seriesDifferenceCvd: 2 },
    });
    const failed = report.checks.filter((c) => c.passes === false);
    expect(failed.length).toBeGreaterThan(0);
    for (const result of failed) {
      expect(result.fix).not.toBeNull();
      const theme: RechartsTheme =
        result.fix?.target === 'text'
          ? { ...lightTheme, typography: { color: result.fix.to } }
          : {
              ...lightTheme,
              graphicalItems: lightTheme.graphicalItems.map((item, i) =>
                i === result.fix?.series
                  ? { ...item, [result.mark ?? 'fill']: result.fix.to }
                  : item,
              ),
            };
      const again = analyzeTheme(theme, {
        visions: [result.vision],
        thresholds: report.thresholds,
      }).checks.find(
        (c) =>
          c.check === result.check &&
          c.mark === result.mark &&
          c.series.join() === result.series.join(),
      );
      expect(again?.passes, `${result.check} ${result.vision} ${result.series.join()}`).toBe(true);
    }
  });

  test('nearestPassingColor returns null when no lightness passes', () => {
    expect(nearestPassingColor('#808080', () => false)).toBeNull();
    expect(
      nearestPassingColor(
        '#808080',
        (hex) => contrastRatio(hex, composite('#808080', 1, '#fff')) > 1,
      ),
    ).not.toBeNull();
  });
});

describe('themeFailures', () => {
  test('is empty when everything passes', () => {
    expect(
      themeFailures(analyzeTheme({ graphicalItems: [{ fill: '#000' }], pageBackground: '#fff' })),
    ).toEqual([]);
  });

  test('names the check, the colors, the values, the standard and a fix', () => {
    const failures = themeFailures(
      analyzeTheme(
        { graphicalItems: [{ fill: '#2775e8' }], pageBackground: '#fff' },
        { visions: ['normal'], marks: ['stroke'] },
      ),
    );
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(
      /^seriesAsText \[page, normal\] series 1 stroke \(#2775e8 \/ #ffffff\): 4\.38:1 < 4\.5:1, WCAG 2\.2 Success Criterion 1\.4\.3 Contrast \(Minimum\) \(Level AA\)\. Try series 1 #[0-9a-f]{6} instead of #2775e8$/,
    );
  });
});

describe('the Recharts themes', () => {
  /*
   * The same requirements as recharts' test/theme/themeAccessibility.spec.ts: series at 3:1 against
   * the page in typical vision, ΔE00 10 apart in typical vision and 2 apart under simulation.
   * Series colors are not required to work as label colors.
   */
  test.each([
    ['light', lightTheme],
    ['dark', darkTheme],
  ])('%s theme meets the requirements of the Recharts test suite', (_, theme) => {
    const contrast = analyzeTheme(theme, {
      visions: ['normal'],
      checks: { seriesVsSeries: false, seriesAsText: false, textOnSeries: false },
    });
    const difference = analyzeTheme(theme, {
      thresholds: { seriesDifference: 10, seriesDifferenceCvd: 2 },
      checks: { seriesOnBackground: false, seriesAsText: false, textOnSeries: false },
      marks: ['fill'],
    });
    expect([...themeFailures(contrast), ...themeFailures(difference)]).toEqual([]);
  });

  test('light theme, all checks', () => {
    const report = analyzeTheme(lightTheme, {
      thresholds: { seriesDifference: 10, seriesDifferenceCvd: 2 },
    });
    expect(themeFailures(report)).toMatchSnapshot();
  });
});
