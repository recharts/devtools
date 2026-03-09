import { useCallback, useState } from 'react';
import type { Annotation, AnnotationStyle, AnnotationType, SnapMode } from './types.js';
import { DEFAULT_ANNOTATION_STYLE, getAnnotationColor } from './annotationColors.js';
import { SnapResult } from './useSnap.js';
import { getDistance } from './getDistance.js';
import {
  DEFAULT_CIRCLE_RADIUS,
  DEFAULT_RECT_HEIGHT,
  DEFAULT_RECT_WIDTH,
} from './annotationInteractionUtils';

export interface UseAnnotationsManagerProps {
  onAnnotationAdd?: (annotation: Annotation) => void;
  onAnnotationDelete?: (id: number) => void;
  onAnnotationUpdate?: (annotation: Annotation) => void;
}

export interface UseAnnotationsManagerReturn {
  annotations: Annotation[];
  isAdding: AnnotationType | null;
  followerPosition: SnapResult | null;
  firstClickPosition: SnapResult | null;
  selectedAnnotationId: number | null;
  snapMode: SnapMode;

  // Actions
  startAddingAnnotation: (type: AnnotationType) => void;
  cancelAddingAnnotation: () => void;
  deleteAnnotation: (id: number) => void;
  updateAnnotation: (annotation: Annotation) => void;
  selectAnnotation: (id: number | null) => void;
  setSnapMode: (newSnapMode: SnapMode) => void;

  // Mouse event handlers for the chart
  onChartClick: (snap: SnapResult) => void;
  onChartMouseDown: (snap: SnapResult) => void;
  onChartMouseUp: (snap: SnapResult) => void;
  onChartMouseMove: (snap: SnapResult) => void;
  onChartMouseLeave: () => void;
}

function annotationFactory(
  type: AnnotationType,
  color: string,
  snapMode: SnapMode,
  pointA: SnapResult,
  pointB?: SnapResult,
): Annotation {
  const baseStyle: AnnotationStyle = {
    ...DEFAULT_ANNOTATION_STYLE,
    color,
    fill: color,
    fillOpacity: 0.1,
  };

  return {
    type,
    id: Date.now(),
    positionType: snapMode === 'none' ? 'pixel' : 'data',
    style: baseStyle,
    pointA,
    pointB,
    label: type === 'label' ? { value: 'Label' } : undefined,
  };
}

/**
 * Hook for managing annotation state and interactions.
 *
 * This hook provides state management for annotations including:
 * - Adding, editing, and deleting annotations
 * - Tracking mouse position for annotation placement
 * - Selection state for editing
 */
export const useAnnotationsManager = (
  props?: UseAnnotationsManagerProps,
): UseAnnotationsManagerReturn => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isAdding, setIsAdding] = useState<AnnotationType | null>(null);
  const [followerPosition, setFollowerPosition] = useState<SnapResult | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<number | null>(null);
  const [snapMode, setSnapMode] = useState<SnapMode>('none');
  // Track click positions for multi-click annotations (rectangle, freeform line)
  const [firstClickPosition, setFirstClickPosition] = useState<SnapResult | null>(null);

  const startAddingAnnotation = useCallback((type: AnnotationType) => {
    setIsAdding(type);
    setFirstClickPosition(null);
    setFollowerPosition(null);
  }, []);

  const cancelAddingAnnotation = useCallback(() => {
    setIsAdding(null);
    setFirstClickPosition(null);
    setFollowerPosition(null);
  }, []);

  const deleteAnnotation = useCallback(
    (id: number) => {
      setAnnotations((prev) => prev.filter((a) => a.id !== id));
      props?.onAnnotationDelete?.(id);
      if (selectedAnnotationId === id) {
        setSelectedAnnotationId(null);
      }
    },
    [props, selectedAnnotationId],
  );

  const updateAnnotation = useCallback(
    (updatedAnnotation: Annotation) => {
      setAnnotations((prev) =>
        prev.map((a) => (a.id === updatedAnnotation.id ? updatedAnnotation : a)),
      );
      props?.onAnnotationUpdate?.(updatedAnnotation);
    },
    [props],
  );

  const selectAnnotation = useCallback((id: number | null) => {
    setSelectedAnnotationId(id);
  }, []);

  const createAnnotation = useCallback(
    (
      type: AnnotationType,
      snapMode: SnapMode,
      pointA: SnapResult,
      pointB?: SnapResult,
    ): Annotation => {
      const color = getAnnotationColor(annotations.length);
      return annotationFactory(type, color, snapMode, pointA, pointB);
    },
    [annotations.length],
  );

  const onChartMouseDown = useCallback(
    (snap: SnapResult) => {
      if (!isAdding) return;

      // For rectangle and freeform line, MouseDown sets the first point (anchor)
      if (isAdding === 'rectangle' || isAdding === 'freeformLine' || isAdding === 'circle') {
        if (!firstClickPosition) {
          setFirstClickPosition(snap);
        }
      }
    },
    [isAdding, firstClickPosition],
  );

  const onChartMouseUp = useCallback(
    (snap: SnapResult) => {
      if (!isAdding) return;

      // For rectangle and freeform line, MouseUp can complete the annotation
      // if it's a drag (distance > threshold) OR if it's the second click of a click-click flow
      if (isAdding === 'rectangle' || isAdding === 'freeformLine' || isAdding === 'circle') {
        if (firstClickPosition) {
          const dist = getDistance(firstClickPosition, snap);

          let expectedMinimumDistance: number = 3;

          switch (isAdding) {
            case 'circle': {
              expectedMinimumDistance += DEFAULT_CIRCLE_RADIUS;
              break;
            }
            case 'rectangle': {
              expectedMinimumDistance += getDistance(snap, {
                interactionCoordinate: {
                  x: snap.interactionCoordinate.x + DEFAULT_RECT_WIDTH,
                  y: snap.interactionCoordinate.y + DEFAULT_RECT_HEIGHT,
                },
                snappedCoordinate: undefined,
                dataPoint: undefined,
              });
              break;
            }
          }

          // Threshold to distinguish between a simple click (to set anchor) and a drag/second click
          if (dist > expectedMinimumDistance) {
            const newAnnotation = createAnnotation(isAdding, snapMode, firstClickPosition, snap);
            setAnnotations((prev) => [...prev, newAnnotation]);
            props?.onAnnotationAdd?.(newAnnotation);
            setIsAdding(null);
            setFirstClickPosition(null);
            setFollowerPosition(null);
          }
        }
      }
    },
    [isAdding, firstClickPosition, createAnnotation, props, snapMode],
  );

  const onChartClick = useCallback(
    (snap: SnapResult) => {
      if (!isAdding) return;

      // Two-point annotations are now handled by MouseDown/MouseUp
      if (isAdding === 'rectangle' || isAdding === 'freeformLine' || isAdding === 'circle') {
        return;
      }

      // For other annotation types, single click creates the annotation
      const newAnnotation = createAnnotation(isAdding, snapMode, snap);
      setAnnotations((prev) => [...prev, newAnnotation]);
      props?.onAnnotationAdd?.(newAnnotation);
      setIsAdding(null);
      setFollowerPosition(null);
    },
    [isAdding, createAnnotation, props, snapMode],
  );

  const onChartMouseMove = useCallback(
    (snap: SnapResult) => {
      if (isAdding) {
        setFollowerPosition(snap);
      }
    },
    [isAdding],
  );

  const onChartMouseLeave = useCallback(() => {
    setFollowerPosition(null);
  }, []);

  return {
    annotations,
    isAdding,
    followerPosition,
    firstClickPosition,
    selectedAnnotationId,
    snapMode,
    startAddingAnnotation,
    cancelAddingAnnotation,
    deleteAnnotation,
    updateAnnotation,
    selectAnnotation,
    setSnapMode,
    onChartClick,
    onChartMouseDown,
    onChartMouseUp,
    onChartMouseMove,
    onChartMouseLeave,
  };
};
