import React from 'react';
import { useActiveTooltipDataPoints } from 'recharts';
import { ArrayInspector } from './generic/ArrayInspector.js';
import { InspectorDef } from '../types.js';
import { useEventDispatch } from '../components/useEventDispatch.js';

const Inspector = () => {
    const dataPoints = useActiveTooltipDataPoints();
    useEventDispatch(dataPoints);
    return <ArrayInspector arr={dataPoints} expandByDefault />;
};

export const UseActiveTooltipDataPointsInspector: InspectorDef = {
    Inspector,
};
