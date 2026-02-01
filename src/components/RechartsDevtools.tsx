import React from 'react';
import { createPortal } from 'react-dom';
import { RECHARTS_ANNOTATIONS_PORTAL_ID, RECHARTS_DEVTOOLS_PORTAL_ID } from '../constants.js';
import { ChartDimensionInspector } from '../inspectors/ChartDimensionInspector.js';
import { MarginInspector } from '../inspectors/MarginInspector.js';
import { OffsetInspector } from '../inspectors/OffsetInspector.js';
import { PlotAreaInspector } from '../inspectors/PlotAreaInspector.js';
import { UseActiveTooltipDataPointsInspector } from '../inspectors/UseActiveTooltipDataPointsInspector.js';
import { XAxisDomainInspector } from '../inspectors/XAxisDomainInspector.js';
import { YAxisDomainInspector } from '../inspectors/YAxisDomainInspector.js';
import { ActiveTooltipLabelInspector } from '../inspectors/ActiveTooltipLabelInspector.js';
import { InspectorDef } from '../types.js';
import { useSessionStorageState } from '../hooks/useSessionStorageState.js';
import { useRechartsDevtoolsContext } from '../context/RechartsDevtoolsContext.js';
import { AnnotationsController, RenderAnnotations, useAnnotationsManager } from '../annotations';

const INSPECTORS: Record<string, InspectorDef> = {
  'useChartWidth | useChartHeight': ChartDimensionInspector,
  useMargin: MarginInspector,
  useOffset: OffsetInspector,
  usePlotArea: PlotAreaInspector,
  useActiveTooltipDataPoints: UseActiveTooltipDataPointsInspector,
  useXAxisDomain: XAxisDomainInspector,
  useYAxisDomain: YAxisDomainInspector,
  useActiveTooltipLabel: ActiveTooltipLabelInspector,
};

export type InspectorKey = keyof typeof INSPECTORS;

const isValidInspectorKey = (key: string | null): key is InspectorKey => {
  return key != null && key in INSPECTORS;
};

function useSelectedInspector() {
  const [selectedInspectorId, setSelectedInspectorId] = useSessionStorageState<InspectorKey>(
    'selectedRechartsDevtoolsInspector',
    'useChartWidth | useChartHeight',
  );
  const selectedInspector = INSPECTORS[selectedInspectorId];
  if (!selectedInspector) {
    setSelectedInspectorId('useChartWidth | useChartHeight');
  }
  return { selectedInspectorId, setSelectedInspectorId, selectedInspector };
}

export const RechartsDevtools = () => {
  const contextId = useRechartsDevtoolsContext();
  const portalId = contextId ?? RECHARTS_DEVTOOLS_PORTAL_ID;
  const annotationsPortalId = contextId
    ? `${contextId}-annotations`
    : RECHARTS_ANNOTATIONS_PORTAL_ID;
  const { selectedInspectorId, setSelectedInspectorId, selectedInspector } = useSelectedInspector();
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const [annotationsContainer, setAnnotationsContainer] = React.useState<HTMLElement | null>(null);

  // Annotations state management
  const annotationsManager = useAnnotationsManager();

  React.useEffect(() => {
    const el = document.getElementById(portalId);
    setContainer(el);
    if (el) {
      const initialTab = el.getAttribute('data-initial-tab');
      if (isValidInspectorKey(initialTab)) {
        setSelectedInspectorId(initialTab);
      }
    }
  }, [portalId, setSelectedInspectorId]);

  React.useEffect(() => {
    const el = document.getElementById(annotationsPortalId);
    setAnnotationsContainer(el);
  }, [annotationsPortalId]);

  const [isOverlayEnabled, setIsOverlayEnabled] = useSessionStorageState(
    'rechartsDevtoolsOverlayEnabled',
    false,
  );

  const { Inspector, Overlay } = selectedInspector ?? {};

  return (
    <>
      {/* Render inspector overlay if enabled */}
      {Overlay && isOverlayEnabled && <Overlay />}

      {/* Render annotations overlay in the chart */}
      <RenderAnnotations
        annotations={annotationsManager.annotations}
        isAdding={annotationsManager.isAdding}
        followerPosition={annotationsManager.followerPosition}
        firstClickPosition={annotationsManager.firstClickPosition}
        snapToData={annotationsManager.snapToData}
        onChartClick={annotationsManager.onChartClick}
        onChartMouseDown={annotationsManager.onChartMouseDown}
        onChartMouseUp={annotationsManager.onChartMouseUp}
        onChartMouseMove={annotationsManager.onChartMouseMove}
        onChartMouseLeave={annotationsManager.onChartMouseLeave}
      />

      {/* Render devtools UI via portal */}
      {container &&
        selectedInspector &&
        createPortal(
          <div className="recharts-devtools" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            <div
              style={{
                marginBottom: '10px',
                paddingBottom: '10px',
                borderBottom: '1px solid #ccc',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', gap: '8px' }}
              >
                <label>Inspect Hook:</label>
                <select
                  value={selectedInspectorId}
                  onChange={(e) => setSelectedInspectorId(e.target.value as InspectorKey)}
                  style={{ padding: '4px' }}
                >
                  {Object.keys(INSPECTORS).map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
                {Overlay && (
                  <div style={{ marginTop: '4px' }}>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isOverlayEnabled}
                        onChange={(e) => setIsOverlayEnabled(e.target.checked)}
                        style={{ marginRight: '4px' }}
                      />
                      Show Overlay on chart
                    </label>
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '10px 0' }}>
              <Inspector />
            </div>
          </div>,
          container,
        )}

      {/* Render annotations controller UI via portal */}
      {annotationsContainer &&
        createPortal(
          <div
            className="recharts-annotations"
            style={{ fontFamily: 'monospace', fontSize: '12px' }}
          >
            <AnnotationsController
              annotations={annotationsManager.annotations}
              isAdding={annotationsManager.isAdding}
              selectedAnnotationId={annotationsManager.selectedAnnotationId}
              snapToData={annotationsManager.snapToData}
              onStartAdding={annotationsManager.startAddingAnnotation}
              onCancelAdding={annotationsManager.cancelAddingAnnotation}
              onDeleteAnnotation={annotationsManager.deleteAnnotation}
              onUpdateAnnotation={annotationsManager.updateAnnotation}
              onSelectAnnotation={annotationsManager.selectAnnotation}
              onSnapToDataChange={annotationsManager.setSnapToData}
            />
          </div>,
          annotationsContainer,
        )}
    </>
  );
};
