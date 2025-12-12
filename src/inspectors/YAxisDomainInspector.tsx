import React from 'react';
import { useYAxisDomain } from 'recharts';
import { ArrayInspector } from './generic/ArrayInspector';
import { InspectorDef } from '../types';

const Inspector = () => {
    const yAxisDomain = useYAxisDomain();
    return <ArrayInspector arr={yAxisDomain} />;
};

export const YAxisDomainInspector: InspectorDef = {
    Inspector,
};
