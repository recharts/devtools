import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { RECHARTS_DEVTOOLS_PORTAL_ID } from '../constants';
import { ChartDimensionInspector } from '../inspectors/ChartDimensionInspector';
import { MarginInspector } from '../inspectors/MarginInspector';
import { OffsetInspector } from '../inspectors/OffsetInspector';
import { PlotAreaInspector } from '../inspectors/PlotAreaInspector';
import { UseActiveTooltipDataPointsInspector } from '../inspectors/UseActiveTooltipDataPointsInspector';
import { XAxisDomainInspector } from '../inspectors/XAxisDomainInspector';
import { YAxisDomainInspector } from '../inspectors/YAxisDomainInspector';
import { ActiveTooltipLabelInspector } from '../inspectors/ActiveTooltipLabelInspector';
import { InspectorDef } from '../types';

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

export const RechartsDevtools = () => {
    const container = document.getElementById(RECHARTS_DEVTOOLS_PORTAL_ID);
    const [selectedInspector, setSelectedInspector] = useState<InspectorKey>('useChartWidth | useChartHeight');

    if (!container) {
        return null;
    }

    const { Inspector, Overlay } = INSPECTORS[selectedInspector];

    return (
        <>
            {Overlay && <Overlay />}
            {createPortal(
                <div className="recharts-devtools" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                    <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #ccc' }}>
                        <label style={{ marginRight: '8px' }}>Inspect Hook:</label>
                        <select
                            value={selectedInspector}
                            onChange={(e) => setSelectedInspector(e.target.value as InspectorKey)}
                            style={{ padding: '4px' }}
                        >
                            {Object.keys(INSPECTORS).map((key) => (
                                <option key={key} value={key}>{key}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ padding: '10px 0' }}>
                        <Inspector />
                        {Overlay && <div style={{ color: '#666', fontStyle: 'italic', marginTop: '10px' }}>Overlay active on chart</div>}
                    </div>
                </div>,
                container,
            )}
        </>
    );
};
