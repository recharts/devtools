/**
 * RechartsAnnotations component for adding interactive annotations to charts.
 *
 * This component follows the same pattern as RechartsDevtools:
 * - Renders SVG overlays directly in the chart context
 * - Uses a portal to render the UI controls in an external container
 *
 * Usage:
 * ```tsx
 * <AreaChart data={data}>
 *   <XAxis dataKey="name" />
 *   <YAxis />
 *   <Area dataKey="value" />
 *   <RechartsAnnotations />
 * </AreaChart>
 * ```
 */
import React from 'react';
import { createPortal } from 'react-dom';
import { RECHARTS_ANNOTATIONS_PORTAL_ID } from '../constants.js';
import { useRechartsDevtoolsContext } from '../context/RechartsDevtoolsContext.js';
import { AnnotationsController, RenderAnnotations, useAnnotationsManager } from '../annotations';

export const RechartsAnnotations = () => {
  const contextId = useRechartsDevtoolsContext();
  // Use annotations-specific portal ID, falling back to global constant
  const portalId = contextId ? `${contextId}-annotations` : RECHARTS_ANNOTATIONS_PORTAL_ID;
  const [container, setContainer] = React.useState<HTMLElement | null>(null);

  const annotationsManager = useAnnotationsManager();

  React.useEffect(() => {
    const el = document.getElementById(portalId);
    setContainer(el);
  }, [portalId]);

  return (
    <>
      {/* Render annotations overlay in the chart SVG context */}
      <RenderAnnotations
        annotations={annotationsManager.annotations}
        isAdding={annotationsManager.isAdding}
        followerPosition={annotationsManager.followerPosition}
        firstClickPosition={annotationsManager.firstClickPosition}
        onChartClick={annotationsManager.onChartClick}
        onChartMouseDown={annotationsManager.onChartMouseDown}
        onChartMouseUp={annotationsManager.onChartMouseUp}
        onChartMouseMove={annotationsManager.onChartMouseMove}
        onChartMouseLeave={annotationsManager.onChartMouseLeave}
      />

      {/* Render annotations controller UI via portal */}
      {container &&
        createPortal(
          <div
            className="recharts-annotations"
            style={{ fontFamily: 'monospace', fontSize: '12px' }}
          >
            <AnnotationsController
              annotations={annotationsManager.annotations}
              isAdding={annotationsManager.isAdding}
              selectedAnnotationId={annotationsManager.selectedAnnotationId}
              onStartAdding={annotationsManager.startAddingAnnotation}
              onCancelAdding={annotationsManager.cancelAddingAnnotation}
              onDeleteAnnotation={annotationsManager.deleteAnnotation}
              onUpdateAnnotation={annotationsManager.updateAnnotation}
              onSelectAnnotation={annotationsManager.selectAnnotation}
            />
          </div>,
          container,
        )}
    </>
  );
};
