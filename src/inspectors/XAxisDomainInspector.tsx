import React from 'react';
import { useXAxisDomain } from 'recharts';
import { ArrayInspector } from './generic/ArrayInspector';
import { InspectorDef } from '../types';
import { useEventDispatch } from '../components/useEventDispatch';

const Inspector = () => {
    const xAxisDomain = useXAxisDomain();
    useEventDispatch(xAxisDomain);
    return <ArrayInspector arr={xAxisDomain} />;
};

export const XAxisDomainInspector: InspectorDef = {
    Inspector,
};
