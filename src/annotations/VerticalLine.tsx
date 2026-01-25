/**
 * This annotation allows drawing a vertical line on a chart.
 *
 * It accepts either pixel coordinates or data values for positioning.
 *
 * In case it receives pixel coordinates, it uses a line SVG element.
 * If data values are provided, it uses a ReferenceLine component.
 */
import React from 'react';
import { ReferenceLine } from 'recharts';
import type { VerticalLineAnnotation } from './types.js';

interface VerticalLineProps {
  annotation: VerticalLineAnnotation;
}

export function VerticalLine({ annotation }: VerticalLineProps) {
  const { x, positionType, style, xAxisId = 0, yAxisId = 0, label } = annotation;
  const { color = '#ccc', strokeWidth = 1, strokeDasharray, opacity = 1 } = style;

  if (positionType === 'data') {
    // Use ReferenceLine for data-based positioning
    return (
      <ReferenceLine
        x={x}
        xAxisId={xAxisId}
        yAxisId={yAxisId}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeOpacity={opacity}
        label={label?.text}
      />
    );
  }

  // For pixel-based positioning, use raw SVG line
  // Note: x must be a number for pixel positioning
  const xPixel = typeof x === 'number' ? x : parseFloat(String(x));
  if (Number.isNaN(xPixel)) {
    return null;
  }

  return (
    <g>
      <line
        x1={xPixel}
        y1={0}
        x2={xPixel}
        y2="100%"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        opacity={opacity}
        pointerEvents="none"
      />
      {label && (
        <text
          x={xPixel + 5}
          y={15}
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
