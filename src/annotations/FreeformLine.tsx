/**
 * This annotation allows drawing a freeform line on a chart.
 *
 * It accepts either pixel coordinates or data values for positioning.
 *
 * In case it receives pixel coordinates, it uses a line SVG element.
 * If data values are provided, it uses a ReferenceLine component with the segment prop.
 */
import React from 'react';
import { ReferenceLine } from 'recharts';
import type { FreeformLineAnnotation as FreeformLineAnnotationType } from './types.js';

interface FreeformLineProps {
  annotation: FreeformLineAnnotationType;
}

export function FreeformLine({ annotation }: FreeformLineProps) {
  const { x1, y1, x2, y2, positionType, style, xAxisId = 0, yAxisId = 0, label } = annotation;
  const { color = '#ccc', strokeWidth = 1, strokeDasharray, opacity = 1 } = style;

  if (positionType === 'data') {
    // Use ReferenceLine with segment prop for data-based positioning
    return (
      <ReferenceLine
        segment={[
          { x: x1, y: y1 },
          { x: x2, y: y2 },
        ]}
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
  const x1Pixel = typeof x1 === 'number' ? x1 : parseFloat(String(x1));
  const y1Pixel = typeof y1 === 'number' ? y1 : parseFloat(String(y1));
  const x2Pixel = typeof x2 === 'number' ? x2 : parseFloat(String(x2));
  const y2Pixel = typeof y2 === 'number' ? y2 : parseFloat(String(y2));

  if (Number.isNaN(x1Pixel) || Number.isNaN(y1Pixel) || Number.isNaN(x2Pixel) || Number.isNaN(y2Pixel)) {
    return null;
  }

  return (
    <g>
      <line
        x1={x1Pixel}
        y1={y1Pixel}
        x2={x2Pixel}
        y2={y2Pixel}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        opacity={opacity}
        pointerEvents="none"
      />
      {label && (
        <text
          x={(x1Pixel + x2Pixel) / 2}
          y={(y1Pixel + y2Pixel) / 2 - 5}
          fill={label.style?.fill ?? color}
          fontSize={label.style?.fontSize ?? 10}
          fontWeight={label.style?.fontWeight ?? 'normal'}
          textAnchor="middle"
          pointerEvents="none"
        >
          {label.text}
        </text>
      )}
    </g>
  );
}
