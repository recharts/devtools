import React from 'react';
import { useActiveTooltipDataPoints } from 'recharts';
import { ArrayInspector } from './generic/ArrayInspector';
import { InspectorDef } from '../types';

const Inspector = () => {
    const dataPoints = useActiveTooltipDataPoints();
    return <ArrayInspector arr={dataPoints} expandByDefault />;
};

export const UseActiveTooltipDataPointsInspector: InspectorDef = {
    Inspector,
};
