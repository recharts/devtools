import React from 'react';
import { useCartesianChartLayout } from 'recharts';
import { InspectorDef } from '../types.js';
import { useEventDispatch } from '../components/useEventDispatch.js';
import { PrimitiveInspector } from './generic/PrimitiveInspector.js';

export const useCartesianChartLayoutInspector: InspectorDef = {
  Inspector: () => {
    const cartesianChartLayout = useCartesianChartLayout();
    useEventDispatch(cartesianChartLayout);
    return <PrimitiveInspector value={cartesianChartLayout} />;
  },
};
