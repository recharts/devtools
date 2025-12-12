import React from 'react';
import { useChartHeight, useChartWidth, useOffset } from 'recharts';
import { SvgDimensionShower } from './utils/SvgDimensionShower';
import { InspectorDef } from '../types';
import { ObjectInspector } from './generic/ObjectInspector';
import { useEventDispatch } from '../components/useEventDispatch';

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
