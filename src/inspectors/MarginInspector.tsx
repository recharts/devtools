import React from 'react';
import { useChartHeight, useChartWidth, useMargin } from 'recharts';
import { SvgDimensionShower } from './utils/SvgDimensionShower.js';
import { InspectorDef } from '../types.js';
import { ObjectInspector } from './generic/ObjectInspector.js';

const Overlay = () => {
    const margin = useMargin();
    const height = useChartHeight();
    const width = useChartWidth();
    if (margin == null || width == null || height == null) {
        return null;
    }
    return (
        <>
            <SvgDimensionShower
                width={margin.left}
                height={height}
                labels={{
                    background: 'Left',
                    horizontal: 'useMargin.left',
                }}
            />
            <SvgDimensionShower
                width={margin.right}
                x={width - margin.right}
                height={height}
                labels={{
                    background: 'Right',
                    horizontal: 'useMargin.right',
                }}
            />
            <SvgDimensionShower
                width={width}
                height={margin.top}
                labels={{
                    background: 'Top',
                    vertical: 'useMargin.top',
                }}
            />
            <SvgDimensionShower
                width={width}
                height={margin.bottom}
                y={height - margin.bottom}
                labels={{
                    background: 'Bottom',
                    vertical: 'useMargin.bottom',
                }}
            />
        </>
    );
};

const Inspector = () => {
    const margin = useMargin();
    return <ObjectInspector obj={margin} />;
};

export const MarginInspector: InspectorDef = {
    Overlay,
    Inspector,
};
