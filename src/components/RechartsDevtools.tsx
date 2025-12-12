import React from 'react';
import { createPortal } from 'react-dom';
import { useChartWidth } from 'recharts';
import { RECHARTS_DEVTOOLS_PORTAL_ID } from '../constants';
import { PrimitiveInspector } from '../inspectors/PrimitiveInspector';

export const ChartDimensionInspector = () => {
    const chartWidth = useChartWidth();
    return (
        <div>
            useChartWidth: <PrimitiveInspector value={chartWidth} />
        </div>
    );
};

export const RechartsDevtools = () => {
    const container = document.getElementById(RECHARTS_DEVTOOLS_PORTAL_ID);

    if (!container) {
        return null;
    }

    return createPortal(
        <div className="recharts-devtools">
            <ChartDimensionInspector />
        </div>,
        container,
    );
};
