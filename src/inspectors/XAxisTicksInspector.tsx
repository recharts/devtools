import React from 'react';
import { useXAxisTicks } from 'recharts';
import { ArrayInspector } from './generic/ArrayInspector.js';
import { InspectorDef } from '../types.js';
import { useEventDispatch } from '../components/useEventDispatch.js';

const Inspector = () => {
  const xAxisTicks = useXAxisTicks();
  useEventDispatch(xAxisTicks);
  return <ArrayInspector arr={xAxisTicks} />;
};

export const XAxisTicksInspector: InspectorDef = {
  Inspector,
};
