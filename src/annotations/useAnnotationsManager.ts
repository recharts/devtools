import { useState, useCallback } from 'react';
import type { Annotation, AnnotationType, AnnotationStyle } from './types.js';
import { getAnnotationColor, DEFAULT_ANNOTATION_STYLE } from './annotationColors.js';

export interface UseAnnotationsManagerProps {
  onAnnotationAdd?: (annotation: Annotation) => void;
  onAnnotationDelete?: (id: number) => void;
  onAnnotationUpdate?: (annotation: Annotation) => void;
}

export interface UseAnnotationsManagerReturn {
  annotations: Annotation[];
  isAdding: AnnotationType | null;
  followerPosition: { x: number; y: number } | null;
  firstClickPosition: { x: number; y: number } | null;
  selectedAnnotationId: number | null;
  snapToData: boolean;

  // Actions
  startAddingAnnotation: (type: AnnotationType) => void;
  cancelAddingAnnotation: () => void;
  deleteAnnotation: (id: number) => void;
  updateAnnotation: (annotation: Annotation) => void;
  selectAnnotation: (id: number | null) => void;
  setSnapToData: (enabled: boolean) => void;

  // Mouse event handlers for the chart
  onChartClick: (x: number, y: number) => void;
  onChartMouseDown: (x: number, y: number) => void;
  onChartMouseUp: (x: number, y: number) => void;
  onChartMouseMove: (x: number, y: number) => void;
  onChartMouseLeave: () => void;
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
  const [followerPosition, setFollowerPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<number | null>(null);
  const [snapToData, setSnapToData] = useState<boolean>(false);
  // Track click positions for multi-click annotations (rectangle, freeform line)
  const [firstClickPosition, setFirstClickPosition] = useState<{ x: number; y: number } | null>(
    null,
  );

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
    (type: AnnotationType, x: number, y: number, x2?: number, y2?: number): Annotation => {
      const color = getAnnotationColor(annotations.length);
      const baseStyle: AnnotationStyle = {
        ...DEFAULT_ANNOTATION_STYLE,
        color,
        fill: color,
        fillOpacity: 0.1,
      };

      const base = {
        id: Date.now(),
        positionType: 'pixel' as const,
        style: baseStyle,
      };

      switch (type) {
        case 'horizontalLine':
          return { ...base, type: 'horizontalLine', y };
        case 'verticalLine':
          return { ...base, type: 'verticalLine', x };
        case 'circle':
          // If x2/y2 provided, calculate radius from distance
          const r =
            x2 !== undefined && y2 !== undefined
              ? Math.sqrt(Math.pow(x2 - x, 2) + Math.pow(y2 - y, 2))
              : 10;
          return { ...base, type: 'circle', x, y, r };
        case 'rectangle':
          return {
            ...base,
            type: 'rectangle',
            x1: x,
            y1: y,
            x2: x2 ?? x + 50,
            y2: y2 ?? y + 50,
          };
        case 'label':
          return { ...base, type: 'label', x, y, text: 'Label' };
        case 'freeformLine':
          return {
            ...base,
            type: 'freeformLine',
            x1: x,
            y1: y,
            x2: x2 ?? x + 50,
            y2: y2 ?? y + 50,
          };
        case 'crosshair':
          return { ...base, type: 'crosshair', x, y };
        default:
          throw new Error(`Unknown annotation type: ${type}`);
      }
    },
    [annotations.length],
  );

  const onChartMouseDown = useCallback(
    (x: number, y: number) => {
      if (!isAdding) return;

      // For rectangle and freeform line, MouseDown sets the first point (anchor)
      if (isAdding === 'rectangle' || isAdding === 'freeformLine' || isAdding === 'circle') {
        if (!firstClickPosition) {
          setFirstClickPosition({ x, y });
        }
      }
    },
    [isAdding, firstClickPosition],
  );

  const onChartMouseUp = useCallback(
    (x: number, y: number) => {
      if (!isAdding) return;

      // For rectangle and freeform line, MouseUp can complete the annotation
      // if it's a drag (distance > threshold) OR if it's the second click of a click-click flow
      if (isAdding === 'rectangle' || isAdding === 'freeformLine' || isAdding === 'circle') {
        if (firstClickPosition) {
          const dist = Math.sqrt(
            Math.pow(x - firstClickPosition.x, 2) + Math.pow(y - firstClickPosition.y, 2),
          );

          // Threshold to distinguish between a simple click (to set anchor) and a drag/second click
          if (dist > 3) {
            const newAnnotation = createAnnotation(
              isAdding,
              firstClickPosition.x,
              firstClickPosition.y,
              x,
              y,
            );
            setAnnotations((prev) => [...prev, newAnnotation]);
            props?.onAnnotationAdd?.(newAnnotation);
            setIsAdding(null);
            setFirstClickPosition(null);
            setFollowerPosition(null);
          }
        }
      }
    },
    [isAdding, firstClickPosition, createAnnotation, props],
  );

  const onChartClick = useCallback(
    (x: number, y: number) => {
      if (!isAdding) return;

      // Two-point annotations are now handled by MouseDown/MouseUp
      if (isAdding === 'rectangle' || isAdding === 'freeformLine' || isAdding === 'circle') {
        return;
      }

      // For other annotation types, single click creates the annotation
      const newAnnotation = createAnnotation(isAdding, x, y);
      setAnnotations((prev) => [...prev, newAnnotation]);
      props?.onAnnotationAdd?.(newAnnotation);
      setIsAdding(null);
      setFollowerPosition(null);
    },
    [isAdding, createAnnotation, props],
  );

  const onChartMouseMove = useCallback(
    (x: number, y: number) => {
      if (isAdding) {
        setFollowerPosition({ x, y });
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
    snapToData,
    startAddingAnnotation,
    cancelAddingAnnotation,
    deleteAnnotation,
    updateAnnotation,
    selectAnnotation,
    setSnapToData,
    onChartClick,
    onChartMouseDown,
    onChartMouseUp,
    onChartMouseMove,
    onChartMouseLeave,
  };
};
