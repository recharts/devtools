/**
 * This annotation allows drawing a circle on a chart.
 *
 * It accepts either pixel coordinates or data values for positioning.
 *
 * In case it receives pixel coordinates, it uses a Dot component.
 * If data values are provided, it uses a ReferenceDot component.
 */
import React from 'react';
import { ReferenceDot, Dot } from 'recharts';
import type { CircleAnnotation as CircleAnnotationType } from './types.js';

interface CircleAnnotationProps {
  annotation: CircleAnnotationType;
}

export function CircleAnnotation({ annotation }: CircleAnnotationProps) {
  const { x, y, r, positionType, style, xAxisId = 0, yAxisId = 0, label } = annotation;
  const { color = '#ccc', strokeWidth = 1, fill = '#fff', opacity = 1, fillOpacity = 0.1, pointerEvents } = style;

  if (positionType === 'data') {
    // Use ReferenceDot for data-based positioning
    return (
      <ReferenceDot
        x={x}
        y={y}
        r={r}
        xAxisId={xAxisId}
        yAxisId={yAxisId}
        stroke={color}
        strokeWidth={strokeWidth}
        fill={fill}
        fillOpacity={fillOpacity}
        style={{ pointerEvents }}
        label={label?.text}
      />
    );
  }

  // For pixel-based positioning, use Dot component
  const xPixel = typeof x === 'number' ? x : parseFloat(String(x));
  const yPixel = typeof y === 'number' ? y : parseFloat(String(y));
  if (Number.isNaN(xPixel) || Number.isNaN(yPixel)) {
    return null;
  }

  return (
    <g style={{ pointerEvents }}>
      <Dot
        cx={xPixel}
        cy={yPixel}
        r={r}
        stroke={color}
        strokeWidth={strokeWidth}
        fill={fill}
        fillOpacity={fillOpacity}
      />
      {label && (
        <text
          x={xPixel + r + 5}
          y={yPixel + 4}
          fill={label.style?.fill ?? color}
          fontSize={label.style?.fontSize ?? 10}
          fontWeight={label.style?.fontWeight ?? 'normal'}
          pointerEvents="none"
        >
          {label.text}
        </text>
      )}
    </g>
  );
}
