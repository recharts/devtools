import React from 'react';
import { createPortal } from 'react-dom';
import { RECHARTS_DEVTOOLS_PORTAL_ID } from '../constants.js';
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

type InspectorKey = keyof typeof INSPECTORS;

function useSelectedInspector() {
    const [selectedInspectorId, setSelectedInspectorId] = useSessionStorageState<InspectorKey>('useChartWidth | useChartHeight');
    const selectedInspector = INSPECTORS[selectedInspectorId];
    if (!selectedInspector) {
        setSelectedInspectorId('useChartWidth | useChartHeight');
    }
    return { selectedInspectorId, setSelectedInspectorId, selectedInspector };
}

export const RechartsDevtools = () => {
    const contextId = useRechartsDevtoolsContext();
    const portalId = contextId ?? RECHARTS_DEVTOOLS_PORTAL_ID;
    const [container, setContainer] = React.useState<HTMLElement | null>(null);

    React.useEffect(() => {
        setContainer(document.getElementById(portalId));
    }, [portalId]);

    const { selectedInspectorId, setSelectedInspectorId, selectedInspector } = useSelectedInspector();
    const [isOverlayEnabled, setIsOverlayEnabled] = useSessionStorageState(false);

    if (!container || !selectedInspector) {
        return null;
    }

    const { Inspector, Overlay } = selectedInspector

    return (
        <>
            {Overlay && isOverlayEnabled && <Overlay />}
            {createPortal(
                <div className="recharts-devtools" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                    <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #ccc' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', gap: '8px' }}>
                            <label>Inspect Hook:</label>
                            <select
                                value={selectedInspectorId}
                                onChange={(e) => setSelectedInspectorId(e.target.value as InspectorKey)}
                                style={{ padding: '4px' }}
                            >
                                {Object.keys(INSPECTORS).map((key) => (
                                    <option key={key} value={key}>{key}</option>
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
        </>
    );
};
