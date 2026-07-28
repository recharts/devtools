import React from 'react';
import { usePolarChartLayout } from 'recharts';
import { InspectorDef } from '../types.js';
import { useEventDispatch } from '../components/useEventDispatch.js';
import { PrimitiveInspector } from './generic/PrimitiveInspector.js';

export const usePolarChartLayoutInspector: InspectorDef = {
  Inspector: () => {
    const polarChartLayout = usePolarChartLayout();
    useEventDispatch(polarChartLayout);
    return <PrimitiveInspector value={polarChartLayout} />;
  },
};
