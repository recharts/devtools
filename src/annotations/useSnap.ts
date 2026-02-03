/**
 * Hook for snapping pixel coordinates to the nearest data point.
 *
 * This uses the Recharts scale hooks to convert between pixel and data coordinates,
 * enabling "magnetic" annotation placement that snaps to actual data points.
 *
 * NOTE: This imports from 'recharts' using hooks that are not yet published.
 * TypeScript/ESLint errors are expected until recharts 3.8 is released.
 *
 * The hook detects this by checking if the inverse scale returns a value that differs
 * significantly from the pixel position when converted back. If the roundtrip produces
 * a very different value, it indicates snapping occurred and we use that. Otherwise,
 * we keep the original coordinate for smooth freeform positioning.
 */
import React, { useCallback, MouseEvent } from 'react';
import {
  Coordinate,
  getRelativeCoordinate,
  useXAxisInverseDataSnapScale,
  useYAxisInverseDataSnapScale,
  useXAxisInverseTickSnapScale,
  useYAxisInverseTickSnapScale,
  useXAxisScale,
  useYAxisScale,
} from 'recharts';
import { SnapMode } from './types';

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
 * Hook that provides a function to snap pixel coordinates to the nearest data point.
 *
 * When snap-to-data is enabled, this will:
 * 1. Convert pixel coordinates to data values using inverse scale
 * 2. Find the closest data point in the domain (categories)
 * 3. Convert back to pixel coordinates for display
 *
 * @example
 * ```tsx
 * const snapToData = useSnapToData({ enabled: true });
 *
 * const handleMouseMove = (x: number, y: number) => {
 *   const snapped = snapToData(x, y);
 *   setPosition({ x: snapped.x, y: snapped.y });
 * };
 * ```
 */
export function useSnap(snapMode: SnapMode): (e: MouseEvent) => SnapResult | undefined {
  // Get inverse scale functions for converting pixels -> data
  const xInverseDataSnapScale = useXAxisInverseDataSnapScale();
  const yInverseDataSnapScale = useYAxisInverseDataSnapScale();
  const xInverseTickSnapScape = useXAxisInverseTickSnapScale();
  const yInverseTickSnapScape = useYAxisInverseTickSnapScale();
  // And forward scales for data -> pixels
  const scaleX = useXAxisScale();
  const scaleY = useYAxisScale();

  return useCallback(
    (e: React.MouseEvent): SnapResult => {
      if (
        xInverseDataSnapScale == null ||
        yInverseDataSnapScale == null ||
        xInverseTickSnapScape == null ||
        yInverseTickSnapScape == null
      ) {
        /*
         * Scales not available yet (e.g., outside of chart context, or chart not fully initialized)
         * Just return zeroes to avoid errors
         */
        return {
          interactionCoordinate: { x: 0, y: 0 },
          snappedCoordinate: undefined,
          dataPoint: undefined,
        };
      }

      const interactionCoordinate = getRelativeCoordinate(e);
      let snappedDataPoint: { x: unknown; y: unknown } | undefined = undefined;
      if (snapMode === 'data') {
        {
          snappedDataPoint = {
            x: xInverseDataSnapScale(interactionCoordinate.relativeX),
            y: yInverseDataSnapScale(interactionCoordinate.relativeY),
          };
        }
      } else if (snapMode === 'tick') {
        {
          snappedDataPoint = {
            x: xInverseTickSnapScape(interactionCoordinate.relativeX),
            y: yInverseTickSnapScape(interactionCoordinate.relativeY),
          };
        }
      }

      if (snappedDataPoint == null) {
        return {
          interactionCoordinate: {
            x: interactionCoordinate.relativeX,
            y: interactionCoordinate.relativeY,
          },
          snappedCoordinate: undefined,
          dataPoint: undefined,
        };
      }

      // Convert snapped data point back to pixel coordinates
      const snappedX = scaleX(snappedDataPoint.x);
      const snappedY = scaleY(snappedDataPoint.y);

      return {
        interactionCoordinate: {
          x: interactionCoordinate.relativeX,
          y: interactionCoordinate.relativeY,
        },
        snappedCoordinate: { x: snappedX, y: snappedY },
        dataPoint: snappedDataPoint,
      };
    },
    [
      snapMode,
      xInverseDataSnapScale,
      yInverseDataSnapScale,
      xInverseTickSnapScape,
      yInverseTickSnapScape,
    ],
  );
}
