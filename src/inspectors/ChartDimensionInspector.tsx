import React from 'react';
import { useChartHeight, useChartWidth } from 'recharts';
import { InspectorDef } from '../types.js';
import { useEventDispatch } from '../components/useEventDispatch.js';

const Inspector = () => {
    const chartWidth = useChartWidth();
    const chartHeight = useChartHeight();

    useEventDispatch({ useChartWidth: chartWidth, useChartHeight: chartHeight });

    return (
        <div>
            <div>useChartWidth: {chartWidth}</div>
            <div>useChartHeight: {chartHeight}</div>
        </div>
    );
};

export const ChartDimensionInspector: InspectorDef = {
    Inspector,
};
