import React from 'react';
import { useActiveTooltipLabel } from 'recharts';
import { PrimitiveInspector } from './generic/PrimitiveInspector';
import { InspectorDef } from '../types';

const Inspector = () => {
    const activeLabel = useActiveTooltipLabel();
    return <PrimitiveInspector value={activeLabel} />;
};

export const ActiveTooltipLabelInspector: InspectorDef = {
    Inspector,
};
