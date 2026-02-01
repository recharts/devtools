// Types
export type {
  Annotation,
  AnnotationType,
  AnnotationStyle,
  BaseAnnotation,
  LabelConfig,
  PositionType,
  HorizontalLineAnnotation,
  VerticalLineAnnotation,
  CircleAnnotation as CircleAnnotationType,
  RectangleAnnotation as RectangleAnnotationType,
  LabelAnnotation as LabelAnnotationType,
  FreeformLineAnnotation,
  CrosshairAnnotation,
} from './types.js';

// Colors and utilities
export {
  ANNOTATION_COLORS,
  getAnnotationColor,
  DEFAULT_ANNOTATION_STYLE,
} from './annotationColors.js';

// Hooks
export { useAnnotationsManager } from './useAnnotationsManager.js';
export type {
  UseAnnotationsManagerProps,
  UseAnnotationsManagerReturn,
} from './useAnnotationsManager.js';
export { useSnapToData } from './useSnapToData.js';
export type { SnapToDataOptions, SnapResult } from './useSnapToData.js';

// Components - SVG annotations (render inside chart)
export { Blanket } from './Blanket.js';
export type { BlanketProps } from './Blanket.js';
export { HorizontalLine } from './HorizontalLine.js';
export { VerticalLine } from './VerticalLine.js';
export { CircleAnnotation } from './CircleAnnotation.js';
export { RectangleAnnotation } from './RectangleAnnotation.js';
export { LabelAnnotation } from './LabelAnnotation.js';
export { FreeformLine } from './FreeformLine.js';
export { Crosshair } from './Crosshair.js';
export { RenderAnnotations } from './RenderAnnotations.js';

// Components - HTML controls (render via portal)
export { AnnotationsController } from './AnnotationsController.js';
