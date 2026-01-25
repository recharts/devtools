/**
 * This annotation allows drawing a horizontal line on a chart.
 *
 * It accepts either pixel coordinates or data values for positioning.
 *
 * In case it receives pixel coordinates, it uses a line SVG element.
 * If data values are provided, it uses a ReferenceLine component.
 */
import React from 'react';
import { ReferenceLine } from 'recharts';
import type { HorizontalLineAnnotation } from './types.js';

interface HorizontalLineProps {
  annotation: HorizontalLineAnnotation;
}

export function HorizontalLine({ annotation }: HorizontalLineProps) {
  const { y, positionType, style, xAxisId = 0, yAxisId = 0, label } = annotation;
  const { color = '#ccc', strokeWidth = 1, strokeDasharray, opacity = 1 } = style;

  if (positionType === 'data') {
    // Use ReferenceLine for data-based positioning
    return (
      <ReferenceLine
        y={y}
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
  // Note: y must be a number for pixel positioning
  const yPixel = typeof y === 'number' ? y : parseFloat(String(y));
  if (Number.isNaN(yPixel)) {
    return null;
  }

  return (
    <g>
      <line
        x1={0}
        y1={yPixel}
        x2="100%"
        y2={yPixel}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        opacity={opacity}
        pointerEvents="none"
      />
      {label && (
        <text
          x={5}
          y={yPixel - 5}
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
