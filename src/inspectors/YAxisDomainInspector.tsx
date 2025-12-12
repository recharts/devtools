import React from 'react';
import { useYAxisDomain } from 'recharts';
import { ArrayInspector } from './generic/ArrayInspector';
import { InspectorDef } from '../types';
import { useEventDispatch } from '../components/useEventDispatch';

const Inspector = () => {
    const yAxisDomain = useYAxisDomain();
    useEventDispatch(yAxisDomain);
    return <ArrayInspector arr={yAxisDomain} />;
};

export const YAxisDomainInspector: InspectorDef = {
    Inspector,
};
