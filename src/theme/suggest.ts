import { clampChroma, converter, formatHex } from 'culori';
import { parseColor } from './color.js';

const toOklch = converter('oklch');

/** How far, in OKLCH lightness (0 to 1), one search step moves. */
const STEP = 0.002;

/**
 * The color closest in lightness to `color` that `passes`, keeping its hue and as much of its chroma as the
 * sRGB gamut allows. It tries lighter and darker one step at a time and returns the first that passes,
 * or `null` when no lightness works, for example when the hue itself is the problem.
 *
 * The search moves along OKLCH lightness, so the hue stays the same and only lightness (and, at the gamut
 * edge, chroma) changes.
 * @see {@link https://www.w3.org/TR/css-color-4/#ok-lab}
 */
export function nearestPassingColor(
  color: string,
  passes: (hex: string) => boolean,
): string | null {
  const start = toOklch(parseColor(color));
  for (let delta = STEP; delta <= 1; delta += STEP) {
    for (const l of [start.l - delta, start.l + delta]) {
      if (l < 0 || l > 1) {
        continue;
      }
      const candidate = formatHex(clampChroma({ ...start, l }, 'oklch'));
      if (passes(candidate)) {
        return candidate;
      }
    }
  }
  return null;
}
