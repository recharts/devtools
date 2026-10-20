import { filterDeficiencyProt, formatHex } from 'culori';
import {
  colorDifference,
  composite,
  contrastRatio,
  parseColor,
  simulateVision,
  toHex,
} from '../../src/theme/index.js';

describe('contrastRatio', () => {
  test('spans 1 to 21, as WCAG defines it', () => {
    expect(contrastRatio('#000', '#fff')).toBe(21);
    expect(contrastRatio('#fff', '#000')).toBe(21);
    expect(contrastRatio('#2775e8', '#2775e8')).toBe(1);
  });
});

describe('composite', () => {
  test('paints a color at an opacity over the background', () => {
    expect(toHex(composite('#000', 0.5, '#fff'))).toBe('#808080');
    expect(toHex(composite('#2775e8', 1, '#fff'))).toBe('#2775e8');
    expect(toHex(composite('#2775e8', 0, '#18181b'))).toBe('#18181b');
  });

  test('multiplies alpha in the color with the opacity', () => {
    expect(toHex(composite('rgba(0, 0, 0, 0.5)', 1, '#fff'))).toBe('#808080');
    expect(toHex(composite('rgba(0, 0, 0, 0.5)', 0.5, '#fff'))).toBe(
      toHex(composite('#000', 0.25, '#fff')),
    );
  });
});

describe('parseColor', () => {
  test('parses any CSS color culori knows', () => {
    expect(toHex('rebeccapurple')).toBe('#663399');
    expect(toHex('rgb(255 0 0)')).toBe('#ff0000');
  });

  test('throws on values that are not a color on their own', () => {
    expect(() => parseColor('light-dark(#fff, #000)')).toThrow('Cannot parse color');
    expect(() => parseColor('var(--series-1)')).toThrow('Cannot parse color');
  });
});

/**
 * Test data published by Sharma, Wu and Dalal with their CIEDE2000 implementation notes:
 * L1, a1, b1, L2, a2, b2, ΔE00.
 * https://hajim.rochester.edu/ece/sites/gsharma/ciede2000/dataNprograms/ciede2000testdata.txt
 */
const SHARMA_TEST_DATA = [
  [50.0, 2.6772, -79.7751, 50.0, 0.0, -82.7485, 2.0425],
  [50.0, 3.1571, -77.2803, 50.0, 0.0, -82.7485, 2.8615],
  [50.0, 2.8361, -74.02, 50.0, 0.0, -82.7485, 3.4412],
  [50.0, -1.3802, -84.2814, 50.0, 0.0, -82.7485, 1.0],
  [50.0, -1.1848, -84.8006, 50.0, 0.0, -82.7485, 1.0],
  [50.0, -0.9009, -85.5211, 50.0, 0.0, -82.7485, 1.0],
  [50.0, 0.0, 0.0, 50.0, -1.0, 2.0, 2.3669],
  [50.0, -1.0, 2.0, 50.0, 0.0, 0.0, 2.3669],
  [50.0, 2.49, -0.001, 50.0, -2.49, 0.0009, 7.1792],
  [50.0, 2.49, -0.001, 50.0, -2.49, 0.001, 7.1792],
  [50.0, 2.49, -0.001, 50.0, -2.49, 0.0011, 7.2195],
  [50.0, 2.49, -0.001, 50.0, -2.49, 0.0012, 7.2195],
  [50.0, -0.001, 2.49, 50.0, 0.0009, -2.49, 4.8045],
  [50.0, -0.001, 2.49, 50.0, 0.001, -2.49, 4.8045],
  [50.0, -0.001, 2.49, 50.0, 0.0011, -2.49, 4.7461],
  [50.0, 2.5, 0.0, 50.0, 0.0, -2.5, 4.3065],
  [50.0, 2.5, 0.0, 73.0, 25.0, -18.0, 27.1492],
  [50.0, 2.5, 0.0, 61.0, -5.0, 29.0, 22.8977],
  [50.0, 2.5, 0.0, 56.0, -27.0, -3.0, 31.903],
  [50.0, 2.5, 0.0, 58.0, 24.0, 15.0, 19.4535],
  [50.0, 2.5, 0.0, 50.0, 3.1736, 0.5854, 1.0],
  [50.0, 2.5, 0.0, 50.0, 3.2972, 0.0, 1.0],
  [50.0, 2.5, 0.0, 50.0, 1.8634, 0.5757, 1.0],
  [50.0, 2.5, 0.0, 50.0, 3.2592, 0.335, 1.0],
  [60.2574, -34.0099, 36.2677, 60.4626, -34.1751, 39.4387, 1.2644],
  [63.0109, -31.0961, -5.8663, 62.8187, -29.7946, -4.0864, 1.263],
  [61.2901, 3.7196, -5.3901, 61.4292, 2.248, -4.962, 1.8731],
  [35.0831, -44.1164, 3.7933, 35.0232, -40.0716, 1.5901, 1.8645],
  [22.7233, 20.0904, -46.694, 23.0331, 14.973, -42.5619, 2.0373],
  [36.4612, 47.858, 18.3852, 36.2715, 50.5065, 21.2231, 1.4146],
  [90.8027, -2.0831, 1.441, 91.1528, -1.6435, 0.0447, 1.4441],
  [90.9257, -0.5406, -0.9208, 88.6381, -0.8985, -0.7239, 1.5381],
  [6.7747, -0.2908, -2.4247, 5.8714, -0.0985, -2.2286, 0.6377],
  [2.0776, 0.0795, -1.135, 0.9033, -0.0636, -0.5514, 0.9082],
];

describe('colorDifference', () => {
  test.each(SHARMA_TEST_DATA)(
    'matches Sharma et al. for Lab(%d, %d, %d) and Lab(%d, %d, %d)',
    (l1, a1, b1, l2, a2, b2, expected) => {
      const first = { mode: 'lab65', l: l1, a: a1, b: b1 } as const;
      const second = { mode: 'lab65', l: l2, a: a2, b: b2 } as const;
      expect(colorDifference(first, second)).toBeCloseTo(expected, 4);
    },
  );
});

describe('simulateVision', () => {
  test('leaves colors alone in typical vision and at severity 0', () => {
    expect(toHex(simulateVision('#b2392b', 'normal'))).toBe('#b2392b');
    expect(toHex(simulateVision('#b2392b', 'protanopia', 0))).toBe('#b2392b');
  });

  test('applies the Machado et al. matrix to linear-light RGB', () => {
    // The same result as the hand-written helper in recharts' test/helper/a11y/color.ts
    expect(toHex(simulateVision('#b2392b', 'protanopia'))).toBe('#5c5329');
  });

  test('still needs to linearize before calling culori', () => {
    /*
     * culori applies the matrix to gamma-encoded sRGB. If this test fails, culori has started
     * linearizing on its own, and simulateVision must stop doing it, or it would do it twice.
     */
    expect(formatHex(filterDeficiencyProt(1)(parseColor('#b2392b')))).toBe('#4e452a');
  });

  test('keeps every simulated color inside the sRGB gamut', () => {
    const simulated = simulateVision('#ff0000', 'tritanopia');
    for (const channel of [simulated.r, simulated.g, simulated.b]) {
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(1);
    }
  });
});
