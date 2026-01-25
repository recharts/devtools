/**
 * Renders all annotations in the chart.
 * Uses the Blanket to overlay the chart to capture mouse/touch events.
 */
import React from 'react';
import type { Annotation, AnnotationType } from './types.js';
import { Blanket } from './Blanket.js';
import { HorizontalLine } from './HorizontalLine.js';
import { VerticalLine } from './VerticalLine.js';
import { CircleAnnotation } from './CircleAnnotation.js';
import { RectangleAnnotation } from './RectangleAnnotation.js';
import { LabelAnnotation } from './LabelAnnotation.js';
import { FreeformLine } from './FreeformLine.js';
import { Crosshair } from './Crosshair.js';
import { getAnnotationColor } from './annotationColors.js';

interface RenderAnnotationsProps {
  annotations: Annotation[];
  isAdding: AnnotationType | null;
  followerPosition: { x: number; y: number } | null;
  firstClickPosition?: { x: number; y: number } | null;
  onChartClick: (x: number, y: number) => void;
  onChartMouseDown: (x: number, y: number) => void;
  onChartMouseUp: (x: number, y: number) => void;
  onChartMouseMove: (x: number, y: number) => void;
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
  position: { x: number; y: number },
  annotationCount: number,
  firstClickPosition?: { x: number; y: number } | null,
): React.ReactNode {
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
    id: -1, // Temporary ID for follower
    positionType: 'pixel' as const,
    style: baseStyle,
  };

  switch (type) {
    case 'horizontalLine':
      return (
        <HorizontalLine annotation={{ ...baseAnnotation, type: 'horizontalLine', y: position.y }} />
      );
    case 'verticalLine':
      return (
        <VerticalLine annotation={{ ...baseAnnotation, type: 'verticalLine', x: position.x }} />
      );
    case 'circle':
      if (firstClickPosition) {
        const r = Math.sqrt(
          Math.pow(position.x - firstClickPosition.x, 2) +
            Math.pow(position.y - firstClickPosition.y, 2),
        );
        return (
          <CircleAnnotation
            annotation={{
              ...baseAnnotation,
              type: 'circle',
              x: firstClickPosition.x,
              y: firstClickPosition.y,
              r,
            }}
          />
        );
      }
      return (
        <CircleAnnotation
          annotation={{ ...baseAnnotation, type: 'circle', x: position.x, y: position.y, r: 10 }}
        />
      );
    case 'rectangle':
      if (firstClickPosition) {
        return (
          <RectangleAnnotation
            annotation={{
              ...baseAnnotation,
              type: 'rectangle',
              x1: firstClickPosition.x,
              y1: firstClickPosition.y,
              x2: position.x,
              y2: position.y,
            }}
          />
        );
      }
      // Before first click, show a small preview rectangle at cursor
      return (
        <RectangleAnnotation
          annotation={{
            ...baseAnnotation,
            type: 'rectangle',
            x1: position.x,
            y1: position.y,
            x2: position.x + 50,
            y2: position.y + 50,
          }}
        />
      );
    case 'label':
      return (
        <LabelAnnotation
          annotation={{
            ...baseAnnotation,
            type: 'label',
            x: position.x,
            y: position.y,
            text: 'Label',
          }}
        />
      );
    case 'freeformLine':
      if (firstClickPosition) {
        return (
          <FreeformLine
            annotation={{
              ...baseAnnotation,
              type: 'freeformLine',
              x1: firstClickPosition.x,
              y1: firstClickPosition.y,
              x2: position.x,
              y2: position.y,
            }}
          />
        );
      }
      // Before first click, show a small preview line at cursor
      return (
        <FreeformLine
          annotation={{
            ...baseAnnotation,
            type: 'freeformLine',
            x1: position.x - 25,
            y1: position.y - 25,
            x2: position.x + 25,
            y2: position.y + 25,
          }}
        />
      );
    case 'crosshair':
      return (
        <Crosshair
          annotation={{ ...baseAnnotation, type: 'crosshair', x: position.x, y: position.y }}
        />
      );
    default:
      return null;
  }
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
  onChartClick,
  onChartMouseDown,
  onChartMouseUp,
  onChartMouseMove,
  onChartMouseLeave,
}: RenderAnnotationsProps) {
  const handleBlanketClick = React.useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      onChartClick(e.clientX - rect.left, e.clientY - rect.top);
    },
    [onChartClick],
  );

  const handleBlanketMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      onChartMouseDown(e.clientX - rect.left, e.clientY - rect.top);
    },
    [onChartMouseDown],
  );

  const handleBlanketMouseUp = React.useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      onChartMouseUp(e.clientX - rect.left, e.clientY - rect.top);
    },
    [onChartMouseUp],
  );

  const handleBlanketMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      onChartMouseMove(e.clientX - rect.left, e.clientY - rect.top);
    },
    [onChartMouseMove],
  );

  return (
    <>
      {/* Render the blanket for capturing events when adding annotations */}
      {isAdding && (
        <Blanket
          pointerEvents="auto"
          onClick={handleBlanketClick}
          onMouseDown={handleBlanketMouseDown}
          onMouseUp={handleBlanketMouseUp}
          onMouseMove={handleBlanketMouseMove}
          onMouseLeave={onChartMouseLeave}
        />
      )}

      {/*
       * Render all existing annotations.
       * Disable pointerEvents while adding so that we don't steal mouse events from the Blanket.
       */}
      <g style={{ pointerEvents: isAdding ? 'none' : undefined }}>
        {annotations.map(renderAnnotation)}
      </g>

      {/* Render the follower annotation preview */}
      {isAdding &&
        followerPosition &&
        renderFollowerAnnotation(
          isAdding,
          followerPosition,
          annotations.length,
          firstClickPosition,
        )}
    </>
  );
}
