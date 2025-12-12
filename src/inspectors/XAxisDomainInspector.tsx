import React from 'react';
import { useXAxisDomain } from 'recharts';
import { ArrayInspector } from './generic/ArrayInspector';
import { InspectorDef } from '../types';

const Inspector = () => {
    const xAxisDomain = useXAxisDomain();
    return <ArrayInspector arr={xAxisDomain} />;
};

export const XAxisDomainInspector: InspectorDef = {
    Inspector,
};
