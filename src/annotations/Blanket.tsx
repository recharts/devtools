import React from 'react';

export interface BlanketProps {
  onClick?: (e: React.MouseEvent<SVGGraphicsElement>) => void;
  onMouseMove?: (e: React.MouseEvent<SVGGraphicsElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<SVGGraphicsElement>) => void;
  onMouseDown?: (e: React.MouseEvent<SVGGraphicsElement>) => void;
  onMouseUp?: (e: React.MouseEvent<SVGGraphicsElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<SVGGraphicsElement>) => void;
  pointerEvents?: 'none' | 'auto';
  /**
   * Optional fill color. Defaults to transparent.
   * Can be set to a semi-transparent color to darken the background
   * when in annotation editing mode.
   */
  fill?: string;
}

/**
 * This component is used to create an invisible layer over the chart
 * that can capture mouse events like clicks and movements.
 *
 * It renders a transparent rectangle that spans the entire chart area.
 *
 * Its purpose is to keep the API simple; we could achieve the same effect
 * by attaching event listeners directly to the chart container, but this
 * would complicate the API and usage and pollute the examples with multiple event handlers
 * that are not relevant to the core concepts being demonstrated.
 *
 * Instead, we render a transparent SVG rectangle that has pointerEvents disabled by default,
 * and only enable them when the user is in the state where they are either adding, editing, or removing annotations.
 */
export const Blanket = React.memo(function Blanket({
  onClick,
  onMouseMove,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  onMouseEnter,
  pointerEvents = 'none',
  fill = 'transparent',
}: BlanketProps) {
  return (
    <>
      <rect
        x={0}
        y={0}
        width="100%"
        height="100%"
        fill={fill}
        style={{ pointerEvents }}
        onClick={onClick}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseEnter={onMouseEnter}
      />
    </>
  );
});
