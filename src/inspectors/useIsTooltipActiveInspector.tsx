import React from 'react';
import { useIsTooltipActive } from 'recharts';
import { InspectorDef } from '../types.js';
import { useEventDispatch } from '../components/useEventDispatch.js';
import { PrimitiveInspector } from './generic/PrimitiveInspector.js';

export const useIsTooltipActiveInspector: InspectorDef = {
  Inspector: () => {
    const tooltipActive = useIsTooltipActive();
    useEventDispatch(tooltipActive);
    return <PrimitiveInspector value={tooltipActive} />;
  },
};
