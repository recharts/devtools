/**
 * This annotation allows drawing a rectangle on a chart.
 *
 * It accepts either pixel coordinates or data values for positioning.
 *
 * In case it receives pixel coordinates, it uses a Rectangle component.
 * If data values are provided, it uses a ReferenceArea component.
 */
import React from 'react';
import { ReferenceArea, Rectangle } from 'recharts';
import type { RectangleAnnotation as RectangleAnnotationType } from './types.js';

interface RectangleAnnotationProps {
  annotation: RectangleAnnotationType;
}

export function RectangleAnnotation({ annotation }: RectangleAnnotationProps) {
  const { x1, x2, y1, y2, positionType, style, xAxisId = 0, yAxisId = 0, label } = annotation;
  const { color = '#ccc', strokeWidth = 1, fill = '#ccc', opacity = 0.5, fillOpacity = 0.1, pointerEvents } = style;

  if (positionType === 'data') {
    // Use ReferenceArea for data-based positioning
    return (
      <ReferenceArea
        x1={x1}
        x2={x2}
        y1={y1}
        y2={y2}
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

  // For pixel-based positioning, use Rectangle component
  const x1Pixel = typeof x1 === 'number' ? x1 : parseFloat(String(x1));
  const x2Pixel = typeof x2 === 'number' ? x2 : parseFloat(String(x2));
  const y1Pixel = typeof y1 === 'number' ? y1 : parseFloat(String(y1));
  const y2Pixel = typeof y2 === 'number' ? y2 : parseFloat(String(y2));

  if (
    Number.isNaN(x1Pixel) ||
    Number.isNaN(x2Pixel) ||
    Number.isNaN(y1Pixel) ||
    Number.isNaN(y2Pixel)
  ) {
    console.log('RectangleAnnotation: Invalid pixel coordinates', { x1, x2, y1, y2 });
    return null;
  }

  const x = Math.min(x1Pixel, x2Pixel);
  const y = Math.min(y1Pixel, y2Pixel);
  const width = Math.abs(x2Pixel - x1Pixel);
  const height = Math.abs(y2Pixel - y1Pixel);

  return (
    <g style={{ pointerEvents }}>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        stroke={color}
        strokeWidth={strokeWidth}
        fill={fill}
        fillOpacity={fillOpacity}
      />
      {label && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          fill={label.style?.fill ?? color}
          fontSize={label.style?.fontSize ?? 10}
          fontWeight={label.style?.fontWeight ?? 'normal'}
          textAnchor="middle"
          dominantBaseline="middle"
          pointerEvents="none"
        >
          {label.text}
        </text>
      )}
    </g>
  );
}
