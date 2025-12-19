import React from 'react';
import { useYAxisDomain } from 'recharts';
import { ArrayInspector } from './generic/ArrayInspector.js';
import { InspectorDef } from '../types.js';
import { useEventDispatch } from '../components/useEventDispatch.js';

const Inspector = () => {
    const yAxisDomain = useYAxisDomain();
    useEventDispatch(yAxisDomain);
    return <ArrayInspector arr={yAxisDomain} />;
};

export const YAxisDomainInspector: InspectorDef = {
    Inspector,
};
