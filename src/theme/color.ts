/**
 * Thin wrappers over culori, so that every measurement in this module goes through one
 * well-tested library instead of hand-written color math.
 * @see {@link https://culorijs.org/api/}
 */
import {
  blend,
  clampRgb,
  converter,
  differenceCiede2000,
  filterDeficiencyDeuter,
  filterDeficiencyProt,
  filterDeficiencyTrit,
  formatHex,
  parse,
  wcagContrast,
  type Color,
  type Rgb,
} from 'culori';

/**
 * How a reader sees colors: typical color vision, or one of the three dichromacies
 * that Machado, Oliveira and Fernandes (2009) model.
 */
export type Vision = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export const VISIONS: ReadonlyArray<Vision> = [
  'normal',
  'protanopia',
  'deuteranopia',
  'tritanopia',
];

/** Any CSS color string that culori parses, or a culori color object. */
export type ColorInput = string | Color;

const toRgb = converter('rgb');
const toLrgb = converter('lrgb');
const ciede2000 = differenceCiede2000();

/**
 * Parses a color into sRGB.
 * @throws when the color cannot be parsed. `light-dark()` and CSS variables are not colors on their own;
 * resolve them to the light or the dark value first.
 */
export function parseColor(color: ColorInput): Rgb {
  const parsed = typeof color === 'string' ? parse(color) : color;
  if (parsed === undefined) {
    throw new Error(`Cannot parse color "${String(color)}"`);
  }
  return toRgb(parsed);
}

/** Formats a color as `#rrggbb`, dropping alpha. */
export function toHex(color: ColorInput): string {
  return formatHex(parseColor(color));
}

/**
 * The color a reader sees when `color` is painted at `opacity` over an opaque `background`.
 * Alpha already present in `color` multiplies with `opacity`.
 * This is simple alpha compositing in sRGB, which is what browsers do for SVG `fill-opacity`.
 * @see {@link https://www.w3.org/TR/compositing-1/#simplealphacompositing}
 */
export function composite(color: ColorInput, opacity: number, background: ColorInput): Rgb {
  const foreground = parseColor(color);
  const alpha = (foreground.alpha ?? 1) * opacity;
  const backdrop = { ...parseColor(background), alpha: 1 };
  return toRgb(blend([backdrop, { ...foreground, alpha }], 'normal', 'rgb'));
}

/**
 * WCAG 2 contrast ratio, from 1 to 21. The order of the two colors does not matter.
 * @see {@link https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio}
 */
export function contrastRatio(a: ColorInput, b: ColorInput): number {
  return wcagContrast(parseColor(a), parseColor(b));
}

/**
 * CIEDE2000 color difference (ΔE00). Larger means easier to tell apart.
 * @see {@link https://hajim.rochester.edu/ece/sites/gsharma/ciede2000/}
 */
export function colorDifference(a: ColorInput, b: ColorInput): number {
  return ciede2000(parseColor(a), parseColor(b));
}

const FILTERS = {
  protanopia: filterDeficiencyProt,
  deuteranopia: filterDeficiencyDeuter,
  tritanopia: filterDeficiencyTrit,
} as const;

/**
 * Approximates how a reader with a color vision deficiency sees `color`.
 *
 * The matrices are culori's, from Machado, Oliveira and Fernandes (2009). culori multiplies them with
 * gamma-encoded sRGB, but the model describes light reaching the cones, which adds up linearly. The R
 * `colorspace` package, which culori took the matrices from, fixed the same issue in version 2.1-0.
 * So this function hands culori's filter linear-light channels and re-encodes the result.
 * @see {@link https://doi.org/10.1109/TVCG.2009.113}
 * @see {@link https://www.zeileis.org/news/simulate_cvd/}
 *
 * @param severity from 0 (typical vision) to 1 (dichromacy, the default). Values in between approximate
 * anomalous trichromacy. culori rounds them to the nearest 0.1, the steps that Machado et al. published.
 */
export function simulateVision(color: ColorInput, vision: Vision, severity = 1): Rgb {
  const rgb = parseColor(color);
  if (vision === 'normal') {
    return rgb;
  }
  const linear = toLrgb(rgb);
  // Labelled as 'rgb' on purpose: culori's filter then applies the matrix to these channels as they are.
  const filtered = FILTERS[vision](severity)({
    mode: 'rgb',
    r: linear.r,
    g: linear.g,
    b: linear.b,
  });
  return clampRgb(toRgb({ mode: 'lrgb', r: filtered.r, g: filtered.g, b: filtered.b }));
}
