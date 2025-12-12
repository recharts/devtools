import React from 'react';
import { useActiveTooltipLabel } from 'recharts';
import { PrimitiveInspector } from './generic/PrimitiveInspector';
import { InspectorDef } from '../types';
import { useEventDispatch } from '../components/useEventDispatch';

const Inspector = () => {
    const activeLabel = useActiveTooltipLabel();
    useEventDispatch(activeLabel);
    return <PrimitiveInspector value={activeLabel} />;
};

export const ActiveTooltipLabelInspector: InspectorDef = {
    Inspector,
};
