import React from 'react';
import { useChartHeight, useChartWidth, useOffset } from 'recharts';
import { SvgDimensionShower } from './utils/SvgDimensionShower.js';
import { InspectorDef } from '../types.js';
import { ObjectInspector } from './generic/ObjectInspector.js';
import { useEventDispatch } from '../components/useEventDispatch.js';

const Overlay = () => {
    const offset = useOffset();
    const height = useChartHeight();
    const width = useChartWidth();
    if (offset == null || width == null || height == null) {
        return null;
    }
    return (
        <>
            <SvgDimensionShower
                width={offset.left}
                height={height}
                labels={{
                    background: 'Left',
                    horizontal: 'useOffset.left',
                }}
            />
            <SvgDimensionShower
                width={offset.right}
                x={width - offset.right}
                height={height}
                labels={{
                    background: 'Right',
                    horizontal: 'useOffset.right',
                }}
            />
            <SvgDimensionShower
                width={width}
                height={offset.top}
                labels={{
                    background: 'Top',
                    vertical: 'useOffset.top',
                }}
            />
            <SvgDimensionShower
                width={width}
                height={offset.bottom}
                y={height - offset.bottom}
                labels={{
                    background: 'Bottom',
                    vertical: 'useOffset.bottom',
                }}
            />
        </>
    );
};

const Inspector = () => {
    const offset = useOffset();
    useEventDispatch(offset);
    return <ObjectInspector obj={offset} />;
};

export const OffsetInspector: InspectorDef = {
    Overlay,
    Inspector,
};
