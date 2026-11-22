/**
 * Integration tests that render annotations inside a real Recharts chart and drive them with
 * mouse events on the Blanket, so that useSnap reads real scales from Recharts.
 *
 * The no-axes chart is the first example from the recharts.github.io "Getting started" page:
 * it renders no <XAxis> or <YAxis>, so Recharts provides implicit axes with forward scales and
 * data-snap scales, but no rendered ticks (and therefore no tick-snap scales).
 *
 * jsdom has no layout: getBoundingClientRect() returns zeroes, so the relative coordinate that
 * getRelativeCoordinate computes equals the event's clientX/clientY.
 */
import React, { useEffect } from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { Line, LineChart, XAxis, YAxis } from 'recharts';
import { RenderAnnotations } from '../../src/annotations/RenderAnnotations.js';
import { useAnnotationsManager } from '../../src/annotations/useAnnotationsManager.js';
import { RechartsAnnotations } from '../../src/components/RechartsAnnotations.js';
import { RECHARTS_ANNOTATIONS_PORTAL_ID } from '../../src/constants.js';
import type { Annotation, AnnotationType, SnapMode } from '../../src/annotations/types.js';

const data = [
  { name: 'Page A', uv: 400 },
  { name: 'Page B', uv: 300 },
  { name: 'Page C', uv: 320 },
  { name: 'Page D', uv: 200 },
  { name: 'Page E', uv: 278 },
  { name: 'Page F', uv: 189 },
];

const SINGLE_CLICK_TYPES: AnnotationType[] = [
  'horizontalLine',
  'verticalLine',
  'crosshair',
  'label',
];
const TWO_POINT_TYPES: AnnotationType[] = ['circle', 'rectangle', 'freeformLine'];

function Harness({
  type,
  snapMode,
  onAdd,
}: {
  type: AnnotationType;
  snapMode: SnapMode;
  onAdd: (a: Annotation) => void;
}) {
  const m = useAnnotationsManager({ onAnnotationAdd: onAdd });
  const { setSnapMode, startAddingAnnotation } = m;
  useEffect(() => {
    setSnapMode(snapMode);
    startAddingAnnotation(type);
  }, [setSnapMode, startAddingAnnotation, snapMode, type]);
  return (
    <RenderAnnotations
      annotations={m.annotations}
      isAdding={m.isAdding}
      followerPosition={m.followerPosition}
      firstClickPosition={m.firstClickPosition}
      snapMode={m.snapMode}
      onChartClick={m.onChartClick}
      onChartMouseDown={m.onChartMouseDown}
      onChartMouseUp={m.onChartMouseUp}
      onChartMouseMove={m.onChartMouseMove}
      onChartMouseLeave={m.onChartMouseLeave}
    />
  );
}

function Chart({ withAxes, children }: { withAxes: boolean; children: React.ReactNode }) {
  return (
    <LineChart width={600} height={370} data={data}>
      {withAxes && <XAxis dataKey="name" />}
      {withAxes && <YAxis />}
      <Line dataKey="uv" isAnimationActive={false} />
      {children}
    </LineChart>
  );
}

function getBlanket(container: HTMLElement): Element {
  const blanket = Array.from(container.querySelectorAll('rect')).find(
    (r) => (r as SVGRectElement).style.pointerEvents === 'auto',
  );
  if (!blanket) throw new Error('Blanket not found');
  return blanket;
}

function renderAndAdd(type: AnnotationType, snapMode: SnapMode, withAxes: boolean): Annotation {
  const added: Annotation[] = [];
  const { container } = render(
    <Chart withAxes={withAxes}>
      <Harness type={type} snapMode={snapMode} onAdd={(a) => added.push(a)} />
    </Chart>,
  );
  const blanket = getBlanket(container);

  // The follower preview must follow the mouse too.
  fireEvent.mouseMove(blanket, { clientX: 150, clientY: 90 });

  if (TWO_POINT_TYPES.includes(type)) {
    // Click + drag
    fireEvent.mouseDown(blanket, { clientX: 150, clientY: 90 });
    fireEvent.mouseMove(blanket, { clientX: 400, clientY: 250 });
    fireEvent.mouseUp(blanket, { clientX: 400, clientY: 250 });
  } else {
    fireEvent.click(blanket, { clientX: 150, clientY: 90 });
  }
  expect(added).toHaveLength(1);
  return added[0]!;
}

afterEach(() => {
  cleanup();
});

describe('annotations in a chart without XAxis/YAxis', () => {
  describe.each([...SINGLE_CLICK_TYPES, ...TWO_POINT_TYPES])('%s', (type) => {
    it("snap mode 'none' places the annotation at the clicked pixel position", () => {
      const annotation = renderAndAdd(type, 'none', false);
      expect(annotation.positionType).toBe('pixel');
      expect(annotation.pointA.interactionCoordinate).not.toEqual({ x: 0, y: 0 });
      if (TWO_POINT_TYPES.includes(type)) {
        expect(annotation.pointB?.interactionCoordinate).toEqual({ x: 400, y: 250 });
      } else {
        expect(annotation.pointA.interactionCoordinate).toEqual({ x: 150, y: 90 });
      }
    });

    it("snap mode 'data' snaps to data points", () => {
      const annotation = renderAndAdd(type, 'data', false);
      expect(annotation.positionType).toBe('data');
      expect(annotation.pointA.dataPoint).toBeDefined();
      expect(annotation.pointA.snappedCoordinate).toBeDefined();
      expect(annotation.pointA.interactionCoordinate).toEqual({ x: 150, y: 90 });
    });

    it("snap mode 'tick' falls back to unsnapped pixel positioning", () => {
      const annotation = renderAndAdd(type, 'tick', false);
      expect(annotation.positionType).toBe('pixel');
      expect(annotation.pointA.interactionCoordinate).toEqual({ x: 150, y: 90 });
      expect(annotation.pointA.snappedCoordinate).toBeUndefined();
      expect(annotation.pointA.dataPoint).toBeUndefined();
    });
  });
});

describe('annotations in a chart with XAxis/YAxis', () => {
  describe.each([...SINGLE_CLICK_TYPES, ...TWO_POINT_TYPES])('%s', (type) => {
    it("snap mode 'none' uses pixel positioning", () => {
      const annotation = renderAndAdd(type, 'none', true);
      expect(annotation.positionType).toBe('pixel');
      expect(annotation.pointA.dataPoint).toBeUndefined();
    });

    it.each(['data', 'tick'] as const)("snap mode '%s' snaps to data values", (snapMode) => {
      const annotation = renderAndAdd(type, snapMode, true);
      expect(annotation.positionType).toBe('data');
      expect(annotation.pointA.dataPoint).toBeDefined();
      expect(annotation.pointA.snappedCoordinate).toBeDefined();
      if (TWO_POINT_TYPES.includes(type) && type !== 'circle') {
        expect(annotation.pointB?.dataPoint).toBeDefined();
      }
    });
  });
});

describe('snap mode controller', () => {
  function renderWithController(withAxes: boolean) {
    const portal = document.createElement('div');
    portal.id = RECHARTS_ANNOTATIONS_PORTAL_ID;
    document.body.appendChild(portal);
    render(
      <Chart withAxes={withAxes}>
        <RechartsAnnotations />
      </Chart>,
    );
    const tickRadio = portal.querySelector('input[value="tick"]') as HTMLInputElement | null;
    if (!tickRadio) throw new Error('tick radio not found');
    return { portal, tickRadio };
  }

  afterEach(() => {
    document.getElementById(RECHARTS_ANNOTATIONS_PORTAL_ID)?.remove();
  });

  it('disables "Snap to axis ticks" when the chart renders no axes', () => {
    const { tickRadio } = renderWithController(false);
    expect(tickRadio.disabled).toBe(true);
  });

  it('enables "Snap to axis ticks" when the chart renders axes', () => {
    const { tickRadio } = renderWithController(true);
    expect(tickRadio.disabled).toBe(false);
  });
});
