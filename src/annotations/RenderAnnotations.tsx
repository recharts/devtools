/**
 * @fileOverview Renders all annotations in the chart.
 * Uses the Blanket to overlay the chart to capture mouse/touch events.
 *
 * It is likely that if you write your own Annotations component, you will want to
 * follow the same pattern as this one. You may be able to reuse some of the hooks
 * and components from the annotations/ folder.
 */
import React, { ReactNode, useCallback } from 'react';
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
 * Renders a preview of the annotation being added, following the mouse cursor.
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
  const baseAnnotation = {
    type,
    id: -1, // Temporary ID for follower
    positionType: snapMode === 'none' ? 'pixel' : 'data',
    style: baseStyle,
    label: undefined,
  } as const;

  if (firstClickPosition == null) {
    return renderAnnotation({
      ...baseAnnotation,
      pointA: position,
    });
  }

  return renderAnnotation({
    ...baseAnnotation,
    pointA: firstClickPosition,
    pointB: position,
  });
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

  const handleBlanketClick = useCallback(
    (e: React.MouseEvent) => {
      const snapped = snap(e);
      if (snapped) {
        onChartClick(snapped);
      }
    },
    [onChartClick, snap],
  );

  const handleBlanketMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const snapped = snap(e);
      if (snapped) {
        onChartMouseDown(snapped);
      }
    },
    [onChartMouseDown, snap],
  );

  const handleBlanketMouseUp = useCallback(
    (e: React.MouseEvent) => {
      const snapped = snap(e);
      if (snapped) {
        onChartMouseUp(snapped);
      }
    },
    [onChartMouseUp, snap],
  );

  const handleBlanketMouseMove = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const snapped = snap(e);
      if (snapped) {
        onChartMouseMove(snapped);
      }
    },
    [onChartMouseMove],
  );

  return (
    <ZIndexLayer zIndex={DefaultZIndexes.label - 1}>
      {/* Render the blanket for capturing events when adding annotations */}
      {isAdding && (
        <Blanket
          pointerEvents="auto"
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
    </ZIndexLayer>
  );
}
