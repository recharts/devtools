import React from 'react';
import { useYAxisTicks } from 'recharts';
import { ArrayInspector } from './generic/ArrayInspector.js';
import { InspectorDef } from '../types.js';
import { useEventDispatch } from '../components/useEventDispatch.js';

const Inspector = () => {
  const yAxisTicks = useYAxisTicks();
  useEventDispatch(yAxisTicks);
  return <ArrayInspector arr={yAxisTicks} />;
};

export const YAxisTicksInspector: InspectorDef = {
  Inspector,
};
