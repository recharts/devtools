import React from 'react';
import { useActiveTooltipLabel } from 'recharts';
import { PrimitiveInspector } from './generic/PrimitiveInspector.js';
import { InspectorDef } from '../types.js';
import { useEventDispatch } from '../components/useEventDispatch.js';

const Inspector = () => {
    const activeLabel = useActiveTooltipLabel();
    useEventDispatch(activeLabel);
    return <PrimitiveInspector value={activeLabel} />;
};

export const ActiveTooltipLabelInspector: InspectorDef = {
    Inspector,
};
