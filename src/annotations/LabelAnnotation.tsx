/**
 * This annotation allows drawing a text label on a chart.
 *
 * It accepts either pixel coordinates or data values for positioning.
 *
 * Position can be provided either as a keyword (see Label.position prop),
 * or pixel coordinates, or data coordinates.
 *
 * In case it receives pixel coordinates, it passes them directly as position={{x, y}} to the Label component.
 * If data values are provided, it resolves them to pixel coordinates and then passes them as position={{x, y}} to the Label component again.
 *
 * TODO: Recharts Label component doesn't have direct support for data-based coordinates.
 * When positionType='data', we would need access to axis scales to convert data values to pixels.
 * This requires being inside a chart context with access to selectAxisScale.
 * For now, data-based positioning falls back to pixel positioning with a warning.
 */
import React from 'react';
import { Label } from 'recharts';
import type { LabelAnnotation as LabelAnnotationType } from './types.js';

interface LabelAnnotationProps {
  annotation: LabelAnnotationType;
}

export function LabelAnnotation({ annotation }: LabelAnnotationProps) {
  const { x, y, text, positionType, style, label } = annotation;
  const { color = '#333', opacity = 1, pointerEvents } = style;
  const fontSize = label?.style?.fontSize ?? 12;
  const fontWeight = label?.style?.fontWeight ?? 'normal';

  if (positionType === 'data') {
    // TODO: Recharts Label component doesn't directly support data coordinates.
    // We would need to use useAppSelector(selectAxisScale) to convert data to pixels,
    // but that requires being inside a Recharts chart context with Redux state access.
    // For now, log a warning and fall back to treating the values as pixels.
    // We will add this in Recharts 3.8
    console.warn(
      'LabelAnnotation: data-based positioning is not fully supported. ' +
        'Values will be treated as pixel coordinates. ' +
        'To properly support data coordinates, access to axis scales is required.',
    );
  }

  // For both pixel and data positioning (with the caveat above), use Label component
  const xPixel = typeof x === 'number' ? x : parseFloat(String(x));
  const yPixel = typeof y === 'number' ? y : parseFloat(String(y));

  if (Number.isNaN(xPixel) || Number.isNaN(yPixel)) {
    return null;
  }

  return (
    <Label
      value={text}
      position={{ x: xPixel, y: yPixel }}
      fill={label?.style?.fill ?? color}
      fontSize={fontSize}
      fontWeight={fontWeight}
      opacity={opacity}
      style={{ pointerEvents }}
    />
  );
}
