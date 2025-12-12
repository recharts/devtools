import React from 'react';
import { useActiveTooltipDataPoints } from 'recharts';
import { ArrayInspector } from './generic/ArrayInspector';
import { InspectorDef } from '../types';
import { useEventDispatch } from '../components/useEventDispatch';

const Inspector = () => {
    const dataPoints = useActiveTooltipDataPoints();
    useEventDispatch(dataPoints);
    return <ArrayInspector arr={dataPoints} expandByDefault />;
};

export const UseActiveTooltipDataPointsInspector: InspectorDef = {
    Inspector,
};
