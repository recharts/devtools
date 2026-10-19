import type { RechartsTheme } from 'recharts';
import {
  analyzeTheme,
  colorDifference,
  composite,
  contrastRatio,
  nearestPassingColor,
  themeFailures,
} from '../../src/theme/index.js';
import { darkTheme, lightTheme } from './fixtures.js';

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
