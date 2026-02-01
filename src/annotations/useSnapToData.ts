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
import { useCallback } from 'react';
import {
  useXAxisInverseDataSnapScale,
  useXAxisScale,
  useYAxisInverseDataSnapScale,
  useYAxisScale,
} from 'recharts';

export interface SnapToDataOptions {
  /** Whether snap-to-data is enabled */
  enabled: boolean;
  /** Axis IDs to use for snapping (defaults to 0) */
  xAxisId?: string | number;
  yAxisId?: string | number;
}

export interface SnapResult {
  /** The snapped X coordinate in pixels */
  x: number;
  /** The snapped Y coordinate in pixels */
  y: number;
  /** The data value for the X coordinate (if snapped) */
  dataX?: unknown;
  /** The data value for the Y coordinate (if snapped) */
  dataY?: unknown;
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
export function useSnapToData(options: SnapToDataOptions) {
  const { enabled, xAxisId = 0, yAxisId = 0 } = options;

  // Get scale functions for converting data -> pixels
  const xScale = useXAxisScale(xAxisId);
  const yScale = useYAxisScale(yAxisId);

  // Get inverse scale functions for converting pixels -> data
  const xInverseSnapScale = useXAxisInverseDataSnapScale(xAxisId);
  const yInverseSnapScale = useYAxisInverseDataSnapScale(yAxisId);

  return useCallback(
    (pixelX: number, pixelY: number): SnapResult => {
      if (!enabled || !xScale || !yScale || !xInverseSnapScale || !yInverseSnapScale) {
        // Return original coordinates if snapping is disabled or when this is used outside of a chart context
        return { x: pixelX, y: pixelY };
      }

      return {
        x: xScale(xInverseSnapScale(pixelX)),
        y: yScale(yInverseSnapScale(pixelY)),
      };
    },
    [enabled, xScale, yScale, xInverseSnapScale, yInverseSnapScale],
  );
}
