import React from 'react';
import { useChartHeight, useChartWidth, usePlotArea } from 'recharts';
import { SvgDimensionShower } from './utils/SvgDimensionShower.js';
import { InspectorDef } from '../types.js';
import { ObjectInspector } from './generic/ObjectInspector.js';
import { useEventDispatch } from '../components/useEventDispatch.js';

const Overlay = () => {
    const plotArea = usePlotArea();
    const width = useChartWidth();
    const height = useChartHeight();
    if (plotArea == null || width == null || height == null) {
        return null;
    }
    return (
        <>
            <SvgDimensionShower width={width} height={plotArea.y} labels={{ background: 'y', vertical: 'usePlotArea.y' }} />
            <SvgDimensionShower
                width={plotArea.x}
                height={height}
                labels={{ background: 'x', horizontal: 'usePlotArea.x' }}
            />
            <SvgDimensionShower
                x={plotArea.x}
                y={plotArea.y}
                width={plotArea.width}
                height={plotArea.height}
                labels={{
                    background: 'Plot area',
                    horizontal: 'usePlotArea.width',
                    vertical: 'usePlotArea.height',
                }}
            />
        </>
    );
};

const Inspector = () => {
    const plotArea = usePlotArea();
    useEventDispatch(plotArea);
    return <ObjectInspector obj={plotArea} />;
};

export const PlotAreaInspector: InspectorDef = {
    Overlay,
    Inspector,
};
