/**
 * @fileOverview Renders all annotations in the chart.
 * Uses the Blanket to overlay the chart to capture mouse/touch events.
 *
 * It is likely that if you write your own Annotations component, you will want to
 * follow the same pattern as this one. You may be able to reuse some of the hooks
 * and components from the annotations/ folder.
 */
import React, { ReactNode, useCallback, useRef } from 'react';
import type { Annotation, AnnotationType, SnapMode } from './types.js';
import { Blanket } from './Blanket.js';
import { HorizontalLine } from './HorizontalLine.js';
import { VerticalLine } from './VerticalLine.js';
import { CircleAnnotation } from './CircleAnnotation.js';
import { RectangleAnnotation } from './RectangleAnnotation.js';
import { LabelAnnotation } from './LabelAnnotation.js';
import { FreeformLine } from './FreeformLine.js';
import { Crosshair } from './Crosshair.js';
import { getAnnotationColor } from './annotationColors.js';
import { SnapResult, useSnap } from './useSnap.js';
import { DefaultZIndexes, ZIndexLayer } from 'recharts';

import {
  DEFAULT_CIRCLE_RADIUS,
  DEFAULT_RECT_WIDTH,
  DEFAULT_RECT_HEIGHT,
  DRAG_THRESHOLD,
  applyAnchorOffset,
  isDragInteraction,
} from './annotationInteractionUtils.js';

interface RenderAnnotationsProps {
  annotations: Annotation[];
  isAdding: AnnotationType | null;
  followerPosition: SnapResult | null;
  firstClickPosition: SnapResult | null;
  snapMode: SnapMode;
  onChartClick: (snap: SnapResult) => void;
  onChartMouseDown: (snap: SnapResult) => void;
  onChartMouseUp: (snap: SnapResult) => void;
  onChartMouseMove: (snap: SnapResult) => void;
  onChartMouseLeave: () => void;
}

function renderAnnotation(annotation: Annotation): React.ReactNode {
  switch (annotation.type) {
    case 'horizontalLine':
      return <HorizontalLine key={annotation.id} annotation={annotation} />;
    case 'verticalLine':
      return <VerticalLine key={annotation.id} annotation={annotation} />;
    case 'circle':
      return <CircleAnnotation key={annotation.id} annotation={annotation} />;
    case 'rectangle':
      return <RectangleAnnotation key={annotation.id} annotation={annotation} />;
    case 'label':
      return <LabelAnnotation key={annotation.id} annotation={annotation} />;
    case 'freeformLine':
      return <FreeformLine key={annotation.id} annotation={annotation} />;
    case 'crosshair':
      return <Crosshair key={annotation.id} annotation={annotation} />;
    default:
      return null;
  }
}

/**
 * Builds a synthetic SnapResult at the given pixel coordinates, with no snapping applied.
 * Used for constructing default-sized follower previews before the user sets the first click point.
 */
function syntheticPoint(x: number, y: number): SnapResult {
  return { interactionCoordinate: { x, y }, snappedCoordinate: undefined, dataPoint: undefined };
}

/**
 * A small crosshair drawn at the anchor point (circle center / rectangle top-left corner).
 * Gives the user a visible reference for where the annotation origin is, since the real
 * cursor is hidden and tracks pointB (the edge) instead.
 */
function FakeCursor({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g pointerEvents="none">
      <line x1={x - 6} y1={y} x2={x + 6} y2={y} stroke={color} strokeWidth={1.5} />
      <line x1={x} y1={y - 6} x2={x} y2={y + 6} stroke={color} strokeWidth={1.5} />
    </g>
  );
}

/**
 * Renders a preview of the annotation being added, following the mouse cursor.
 *
 * For circle and rectangle (pixel mode), the real cursor acts as pointB so the
 * pre-click geometry matches the post-click geometry exactly.
 * For other two-point annotations (freeformLine), a synthetic stub is used before the first click.
 */
function renderFollowerAnnotation(
  type: AnnotationType,
  snapMode: SnapMode,
  position: SnapResult,
  annotationCount: number,
  firstClickPosition?: SnapResult | null,
): ReactNode {
  const color = getAnnotationColor(annotationCount);
  const baseStyle = {
    color,
    strokeWidth: 2,
    strokeDasharray: '4',
    fill: color,
    opacity: 0.6,
    fillOpacity: 0.1,
    pointerEvents: 'none' as const,
  };
  const baseAnnotation: Omit<Annotation, 'pointA' | 'pointB'> = {
    type,
    id: -1, // Temporary ID for follower
    positionType: snapMode === 'none' ? 'pixel' : 'data',
    style: baseStyle,
    label: type === 'label' ? { value: 'Label' } : undefined,
  };

  const px = position.interactionCoordinate.x;
  const py = position.interactionCoordinate.y;

  // After the first click, render from the fixed anchor to the current cursor position.
  if (firstClickPosition != null) {
    return renderAnnotation({ ...baseAnnotation, pointA: firstClickPosition, pointB: position });
  }

  // Before the first click: show a default-sized preview.
  if (type === 'circle') {
    // Real cursor = pointB (edge); anchor = offset left so radius = DEFAULT_CIRCLE_RADIUS.
    return renderAnnotation({
      ...baseAnnotation,
      pointA: syntheticPoint(px - DEFAULT_CIRCLE_RADIUS, py),
      pointB: position,
    });
  }
  if (type === 'rectangle') {
    // Real cursor = bottom-right corner (pointB); anchor = offset to top-left.
    return renderAnnotation({
      ...baseAnnotation,
      pointA: syntheticPoint(px - DEFAULT_RECT_WIDTH, py - DEFAULT_RECT_HEIGHT),
      pointB: position,
    });
  }
  if (type === 'freeformLine') {
    // Default short angled stub so the line direction is hinted at.
    return renderAnnotation({
      ...baseAnnotation,
      pointA: position,
      pointB: syntheticPoint(px + 30, py - 15),
    });
  }

  // Single-click annotations (horizontalLine, verticalLine, crosshair, label).
  return renderAnnotation({ ...baseAnnotation, pointA: position });
}

/**
 * Component that renders all annotations and handles mouse events for adding new annotations.
 *
 * This component should be rendered inside a Recharts chart as a child,
 * typically as the last child so it appears on top of other chart elements.
 */
export function RenderAnnotations({
  annotations,
  isAdding,
  followerPosition,
  firstClickPosition,
  snapMode,
  onChartClick,
  onChartMouseDown,
  onChartMouseUp,
  onChartMouseMove,
  onChartMouseLeave,
}: RenderAnnotationsProps) {
  const snap = useSnap(snapMode);

  // Circle and rectangle use a fake cursor in pixel mode: the real cursor is hidden and
  // the anchor crosshair is drawn at pointA (offset from the actual mouse position).
  const useFakeCursor = isAdding === 'circle' || isAdding === 'rectangle';

  // Tracks the real (non-offset) cursor position at the last mouseDown for circle/rectangle.
  // Used to distinguish a click (tiny movement → two-click flow) from a drag (large movement
  // → complete on mouseUp), because the offset anchor makes the naive dist > threshold check
  // always true even for a stationary click.
  const mouseDownRealPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleBlanketClick = useCallback(
    (e: React.MouseEvent<SVGGraphicsElement>) => {
      const snapped = snap(e);
      if (snapped) {
        onChartClick(applyAnchorOffset(snapped, isAdding, snapMode));
      }
    },
    [onChartClick, snap],
  );

  const handleBlanketMouseDown = useCallback(
    (e: React.MouseEvent<SVGGraphicsElement>) => {
      const snapped = snap(e);
      if (snapped) {
        if (useFakeCursor) {
          // Remember real cursor position so mouseUp can detect drag vs click.
          mouseDownRealPosRef.current = snapped.interactionCoordinate;
        }
        // For circle/rectangle in pixel mode, record the anchor at the offset position
        // (not the real cursor) so the initial size matches the pre-click preview exactly.
        onChartMouseDown(applyAnchorOffset(snapped, isAdding, snapMode));
      }
    },
    [onChartMouseDown, snap, isAdding, snapMode, useFakeCursor],
  );

  const handleBlanketMouseUp = useCallback(
    (e: React.MouseEvent<SVGGraphicsElement>) => {
      const snapped = snap(e);
      if (snapped) {
        // For circle/rectangle in pixel mode, decide whether this mouseUp should confirm
        // the annotation or just set the anchor for the two-click workflow.
        if (useFakeCursor && !firstClickPosition && mouseDownRealPosRef.current) {
          // This is the FIRST click (anchor not yet recorded).
          // Only confirm via drag — a stationary click just sets the anchor so the user
          // can move the mouse and click again to choose the final size.
          const moved = isDragInteraction(
            mouseDownRealPosRef.current,
            snapped.interactionCoordinate,
          );
          mouseDownRealPosRef.current = null;
          if (!moved) return;
        } else {
          mouseDownRealPosRef.current = null;
        }
        onChartMouseUp(snapped);
      }
    },
    [onChartMouseUp, snap, useFakeCursor, firstClickPosition],
  );

  const handleBlanketMouseMove = useCallback(
    (e: React.MouseEvent<SVGGraphicsElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const snapped = snap(e);
      if (snapped) {
        onChartMouseMove(snapped);
      }
    },
    [onChartMouseMove, snap],
  );

  // Compute the anchor position for the fake cursor crosshair.
  let fakeCursorPos: { x: number; y: number } | null = null;
  if (useFakeCursor && followerPosition) {
    if (firstClickPosition) {
      fakeCursorPos = firstClickPosition.interactionCoordinate;
    } else {
      const { x, y } = followerPosition.interactionCoordinate;
      fakeCursorPos =
        isAdding === 'circle'
          ? { x: x - DEFAULT_CIRCLE_RADIUS, y }
          : { x: x - DEFAULT_RECT_WIDTH, y: y - DEFAULT_RECT_HEIGHT };
    }
  }

  const followerColor = getAnnotationColor(annotations.length);

  return (
    <ZIndexLayer zIndex={DefaultZIndexes.label - 1}>
      {/* Render the blanket for capturing events when adding annotations */}
      {isAdding && (
        <Blanket
          pointerEvents="auto"
          cursor={useFakeCursor ? 'none' : undefined}
          onClick={handleBlanketClick}
          onMouseDown={handleBlanketMouseDown}
          onMouseUp={handleBlanketMouseUp}
          onMouseMove={handleBlanketMouseMove}
          onMouseLeave={onChartMouseLeave}
          onMouseEnter={handleBlanketMouseMove}
        />
      )}

      {/*
       * Render all existing annotations.
       * Disable pointerEvents while adding so that we don't steal mouse events from the Blanket.
       */}
      <g style={{ pointerEvents: isAdding ? 'none' : undefined }}>
        {annotations.map(renderAnnotation)}
      </g>

      {/* Render the follower annotation preview with snapped Coordinates */}
      {isAdding &&
        followerPosition &&
        renderFollowerAnnotation(
          isAdding,
          snapMode,
          followerPosition,
          annotations.length,
          firstClickPosition,
        )}

      {/* Fake cursor crosshair at the annotation anchor point (circle/rectangle pixel mode only) */}
      {fakeCursorPos && (
        <FakeCursor x={fakeCursorPos.x} y={fakeCursorPos.y} color={followerColor} />
      )}
    </ZIndexLayer>
  );
}
