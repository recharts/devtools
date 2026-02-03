import { CSSProperties } from 'react';
import { SnapResult } from './useSnap';
import { LabelProps } from 'recharts';

/**
 * Common style properties for annotations.
 */
export interface AnnotationStyle {
  color?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  fill?: string;
  opacity?: number;
  fillOpacity?: number;
  pointerEvents?: CSSProperties['pointerEvents'];
}

/**
 * Position can be specified in pixels or data values.
 * When using data values, the annotation will use Recharts Reference* components.
 * When using pixel values, the annotation will use raw SVG elements.
 */
export type PositionType = 'pixel' | 'data';

/**
 * Horizontal line annotation.
 * Renders a horizontal line across the chart at a specific y position.
 */
export interface HorizontalLineAnnotation extends BaseAnnotation {
  type: 'horizontalLine';
  /** Y position in pixels (when positionType='pixel') or data value (when positionType='data') */
  y: number | string;
  /** Optional xAxisId when using data positioning */
  xAxisId?: string | number;
  /** Optional yAxisId when using data positioning */
  yAxisId?: string | number;
}

/**
 * Vertical line annotation.
 * Renders a vertical line across the chart at a specific x position.
 */
export interface VerticalLineAnnotation extends BaseAnnotation {
  type: 'verticalLine';
  /** X position in pixels (when positionType='pixel') or data value (when positionType='data') */
  x: number | string;
  /** Optional xAxisId when using data positioning */
  xAxisId?: string | number;
  /** Optional yAxisId when using data positioning */
  yAxisId?: string | number;
}

/**
 * Circle annotation.
 * Renders a circle/dot at a specific point on the chart.
 */
export interface CircleAnnotation extends BaseAnnotation {
  type: 'circle';
  /** X position in pixels or data value */
  x: number | string;
  /** Y position in pixels or data value */
  y: number | string;
  /** Radius in pixels */
  r: number;
  /** Optional xAxisId when using data positioning */
  xAxisId?: string | number;
  /** Optional yAxisId when using data positioning */
  yAxisId?: string | number;
}

/**
 * Rectangle annotation.
 * Renders a rectangular area on the chart.
 */
export interface RectangleAnnotation extends BaseAnnotation {
  type: 'rectangle';
  /** Starting X position in pixels or data value */
  x1: number | string;
  /** Ending X position in pixels or data value */
  x2: number | string;
  /** Starting Y position in pixels or data value */
  y1: number | string;
  /** Ending Y position in pixels or data value */
  y2: number | string;
  /** Optional xAxisId when using data positioning */
  xAxisId?: string | number;
  /** Optional yAxisId when using data positioning */
  yAxisId?: string | number;
}

/**
 * Label annotation.
 * Renders a text label at a specific position on the chart.
 */
export interface LabelAnnotation extends BaseAnnotation {
  type: 'label';
  /** X position in pixels or data value */
  x: number | string;
  /** Y position in pixels or data value */
  y: number | string;
  /** The text content of the label */
  text: string;
  /** Optional xAxisId when using data positioning */
  xAxisId?: string | number;
  /** Optional yAxisId when using data positioning */
  yAxisId?: string | number;
}

/**
 * Freeform line annotation.
 * Renders a line segment between two arbitrary points.
 */
export interface FreeformLineAnnotation extends BaseAnnotation {
  type: 'freeformLine';
  /** Starting X position in pixels or data value */
  x1: number | string;
  /** Starting Y position in pixels or data value */
  y1: number | string;
  /** Ending X position in pixels or data value */
  x2: number | string;
  /** Ending Y position in pixels or data value */
  y2: number | string;
  /** Optional xAxisId when using data positioning */
  xAxisId?: string | number;
  /** Optional yAxisId when using data positioning */
  yAxisId?: string | number;
}

/**
 * Crosshair annotation.
 * Renders both horizontal and vertical lines intersecting at a point.
 */
export interface CrosshairAnnotation extends BaseAnnotation {
  type: 'crosshair';
  /** X position in pixels or data value */
  x: number | string;
  /** Y position in pixels or data value */
  y: number | string;
  /** Optional xAxisId when using data positioning */
  xAxisId?: string | number;
  /** Optional yAxisId when using data positioning */
  yAxisId?: string | number;
}

/**
 * Union type of all annotation types.
 */
export type Annotation = {
  id: number;
  type:
    | 'horizontalLine'
    | 'verticalLine'
    | 'circle'
    | 'rectangle'
    | 'label'
    | 'freeformLine'
    | 'crosshair';
  positionType: PositionType;
  pointA: SnapResult;
  pointB?: SnapResult;
  label: LabelProps | undefined;
  style: AnnotationStyle;
};

/**
 * Type guard for annotation types.
 */
export type AnnotationType = Annotation['type'];

export type SnapMode = 'none' | 'data' | 'tick';
