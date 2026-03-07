export { between, random } from './random.js';
export { generateMockData } from './generateMockData.js';
export { generateMockMarketData } from './generateMockMarketData.js';
export { RechartsDevtools } from './components/RechartsDevtools.js';
export { RechartsAnnotations } from './components/RechartsAnnotations.js';
export {
  RechartsDevtoolsPortal,
  RechartsAnnotationsPortal,
  RechartsDevtoolsContext,
} from './context/RechartsDevtoolsContext.js';
export { RECHARTS_DEVTOOLS_PORTAL_ID, RECHARTS_ANNOTATIONS_PORTAL_ID } from './constants.js';

// Re-export annotation types and utilities for advanced usage
export type {
  Annotation,
  AnnotationType,
  AnnotationStyle,
} from './annotations/types.js';
export { useAnnotationsManager } from './annotations/useAnnotationsManager.js';

export { useWhyDidYouRender } from './hooks/useWhyDidYouRender.js';
