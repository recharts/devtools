import React from 'react';
import { useActiveTooltipCoordinate } from 'recharts';
import { InspectorDef } from '../types.js';
import { useEventDispatch } from '../components/useEventDispatch.js';
import { ObjectInspector } from './generic/ObjectInspector.js';

export const useActiveTooltipCoordinateInspector: InspectorDef = {
  Inspector: () => {
    const tooltipCoordinate = useActiveTooltipCoordinate();
    useEventDispatch(tooltipCoordinate);
    return <ObjectInspector obj={tooltipCoordinate} />;
  },
};
