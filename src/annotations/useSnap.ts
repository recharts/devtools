/**
 * Hook for snapping pixel coordinates to the nearest data point.
 *
 * This uses the Recharts scale hooks to convert between pixel and data coordinates,
 * enabling "magnetic" annotation placement that snaps to actual data points.
 *
 * Each snap mode reads only the scales it needs: 'none' needs no scales, 'data' needs the
 * data-snap inverse scales and 'tick' needs the tick-snap inverse scales (both plus the forward
 * scales). When the scales a mode needs are unavailable (e.g. 'tick' on a chart without a
 * rendered <XAxis>/<YAxis>, which has no rendered ticks) or the snapped point falls outside the
 * axis, the hook returns the real interaction coordinate, unsnapped, with `snappedCoordinate`
 * and `dataPoint` undefined. Annotations then fall back to pixel positioning.
 */
import React, { useCallback, MouseEvent } from 'react';
import {
  Coordinate,
  getRelativeCoordinate,
  useXAxisInverseScale,
  useYAxisInverseScale,
  useXAxisInverseDataSnapScale,
  useYAxisInverseDataSnapScale,
  useXAxisInverseTickSnapScale,
  useYAxisInverseTickSnapScale,
  useXAxisScale,
  useYAxisScale,
} from 'recharts';
import { SnapMode } from './types.js';

type InverseScale = (pixel: number) => unknown;
type ForwardScale = (value: unknown) => number | undefined;

/**
 * Snaps one axis: pixel -> data value -> snapped pixel.
 *
 * `fallbackInverse` is tried when the snap scale gives a value the forward scale cannot map.
 * This happens with data snapping on a category axis that has no `dataKey` (e.g. an implicit
 * axis on a chart without <XAxis>): Recharts then offers the graphical items' values
 * (e.g. the Line's `uv` values) as snap candidates, while the axis domain is the row indexes.
 * The general inverse scale of a category axis returns the nearest category, which is a
 * data point too.
 */
function snapAxis(
  pixel: number,
  inverse: InverseScale,
  forward: ForwardScale,
  fallbackInverse: InverseScale | undefined,
): { value: unknown; pixel: number } | undefined {
  for (const candidateInverse of [inverse, fallbackInverse]) {
    if (candidateInverse == null) continue;
    const value = candidateInverse(pixel);
    const snappedPixel = forward(value);
    if (snappedPixel != null) {
      return { value, pixel: snappedPixel };
    }
  }
  return undefined;
}

export interface SnapResult {
  // Where the user interacted (pixel coordinates) relative to chart area
  interactionCoordinate: Coordinate;
  // The coordinate snapped to the nearest data or tick point (pixel coordinates) or undefined if no snapping
  snappedCoordinate: Coordinate | undefined;
  // The data point corresponding to the snapped coordinate (data values) or undefined if no snapping
  dataPoint:
    | {
        x: unknown;
        y: unknown;
      }
    | undefined;
}

/**
 * Hook that provides a function to snap a mouse event to the nearest data point or axis tick.
 *
 * When snapping is enabled ('data' or 'tick'), this will:
 * 1. Convert pixel coordinates to data values using the inverse snap scale
 * 2. Convert the snapped data values back to pixel coordinates for display
 *
 * If snapping is disabled or not possible, the result carries only the real interaction coordinate.
 *
 * @example
 * ```tsx
 * const snap = useSnap('data');
 *
 * const handleMouseMove = (e: React.MouseEvent<SVGGraphicsElement>) => {
 *   const { interactionCoordinate, snappedCoordinate } = snap(e);
 *   setPosition(snappedCoordinate ?? interactionCoordinate);
 * };
 * ```
 */
export function useSnap(
  snapMode: SnapMode,
): (e: MouseEvent<SVGGraphicsElement>) => SnapResult | undefined {
  // Get inverse scale functions for converting pixels -> data
  const xInverseScale = useXAxisInverseScale();
  const yInverseScale = useYAxisInverseScale();
  const xInverseDataSnapScale = useXAxisInverseDataSnapScale();
  const yInverseDataSnapScale = useYAxisInverseDataSnapScale();
  const xInverseTickSnapScale = useXAxisInverseTickSnapScale();
  const yInverseTickSnapScale = useYAxisInverseTickSnapScale();
  // And forward scales for data -> pixels
  const scaleX = useXAxisScale();
  const scaleY = useYAxisScale();

  return useCallback(
    (e: React.MouseEvent<SVGGraphicsElement>): SnapResult => {
      /*
       * Here we get pixel coordinates relative to the chart area (accounting for transforms)
       * These are exact mouse interaction coordinates.
       * Next, we need to "snap" these to the nearest data point if snapMode is enabled.
       */
      const relative = getRelativeCoordinate(e);
      const interactionCoordinate: Coordinate = { x: relative.relativeX, y: relative.relativeY };
      const unsnapped: SnapResult = {
        interactionCoordinate,
        snappedCoordinate: undefined,
        dataPoint: undefined,
      };

      if (snapMode === 'none') {
        return unsnapped;
      }

      /*
       * Each snap mode needs only its own inverse scales plus the forward scales.
       * Any of them can be missing: for example, charts without a rendered <XAxis>/<YAxis>
       * have no rendered ticks, so the tick-snap scales are undefined.
       * In that case we keep the real (unsnapped) interaction coordinate.
       */
      const xInverse = snapMode === 'data' ? xInverseDataSnapScale : xInverseTickSnapScale;
      const yInverse = snapMode === 'data' ? yInverseDataSnapScale : yInverseTickSnapScale;
      if (xInverse == null || yInverse == null || scaleX == null || scaleY == null) {
        return unsnapped;
      }

      /*
       * Converts the snapped data point back to pixel coordinates.
       * Some components will read the snapped data point to display values, while others will use the snapped pixel coordinates for positioning.
       * We return here both the snapped data point (for display) and the snapped pixel coordinates (for positioning) for convenience.
       * If you are using ReferenceLine/ReferenceDot, you can skip this step and use the snappedDataPoint directly.
       */
      const snappedX = snapAxis(
        interactionCoordinate.x,
        xInverse,
        scaleX,
        snapMode === 'data' ? xInverseScale : undefined,
      );
      const snappedY = snapAxis(
        interactionCoordinate.y,
        yInverse,
        scaleY,
        snapMode === 'data' ? yInverseScale : undefined,
      );

      if (snappedX == null || snappedY == null) {
        // If the snapped data point is outside the chart area, just return the original interaction coordinates
        return unsnapped;
      }

      return {
        interactionCoordinate,
        snappedCoordinate: { x: snappedX.pixel, y: snappedY.pixel },
        dataPoint: { x: snappedX.value, y: snappedY.value },
      };
    },
    [
      snapMode,
      xInverseScale,
      yInverseScale,
      xInverseDataSnapScale,
      yInverseDataSnapScale,
      xInverseTickSnapScale,
      yInverseTickSnapScale,
      scaleX,
      scaleY,
    ],
  );
}
