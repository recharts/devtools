import React from 'react';
import { useXAxisDomain } from 'recharts';
import { ArrayInspector } from './generic/ArrayInspector.js';
import { InspectorDef } from '../types.js';
import { useEventDispatch } from '../components/useEventDispatch.js';

const Inspector = () => {
    const xAxisDomain = useXAxisDomain();
    useEventDispatch(xAxisDomain);
    return <ArrayInspector arr={xAxisDomain} />;
};

export const XAxisDomainInspector: InspectorDef = {
    Inspector,
};
