import {
  applyAnchorOffset,
  isDragInteraction,
  DEFAULT_CIRCLE_RADIUS,
  DEFAULT_RECT_WIDTH,
  DEFAULT_RECT_HEIGHT,
  DRAG_THRESHOLD,
} from '../../src/annotations/annotationInteractionUtils.js';
import type { SnapResult } from '../../src/annotations/useSnap.js';

function makePixelSnap(x: number, y: number): SnapResult {
  return { interactionCoordinate: { x, y }, snappedCoordinate: undefined, dataPoint: undefined };
}

function makeDataSnap(x: number, y: number): SnapResult {
  return {
    interactionCoordinate: { x, y },
    snappedCoordinate: { x, y },
    dataPoint: { x: 'Jan', y: 100 },
  };
}

// ─── applyAnchorOffset ───────────────────────────────────────────────────────

describe('applyAnchorOffset', () => {
  describe('circle in pixel mode', () => {
    it(`offsets x by -${DEFAULT_CIRCLE_RADIUS}`, () => {
      const result = applyAnchorOffset(makePixelSnap(100, 80), 'circle', 'none');
      expect(result.interactionCoordinate).toEqual({ x: 100 - DEFAULT_CIRCLE_RADIUS, y: 80 });
    });

    it('clears snappedCoordinate and dataPoint', () => {
      const base = makeDataSnap(100, 80);
      const result = applyAnchorOffset(base, 'circle', 'none');
      expect(result.snappedCoordinate).toBeUndefined();
      expect(result.dataPoint).toBeUndefined();
    });
  });

  describe('rectangle in pixel mode', () => {
    it(`offsets x by -${DEFAULT_RECT_WIDTH} and y by -${DEFAULT_RECT_HEIGHT}`, () => {
      const result = applyAnchorOffset(makePixelSnap(100, 80), 'rectangle', 'none');
      expect(result.interactionCoordinate).toEqual({
        x: 100 - DEFAULT_RECT_WIDTH,
        y: 80 - DEFAULT_RECT_HEIGHT,
      });
    });

    it('clears snappedCoordinate and dataPoint', () => {
      const base = makeDataSnap(100, 80);
      const result = applyAnchorOffset(base, 'rectangle', 'none');
      expect(result.snappedCoordinate).toBeUndefined();
      expect(result.dataPoint).toBeUndefined();
    });
  });

  describe('types that are not offset', () => {
    it.each(['horizontalLine', 'verticalLine', 'crosshair', 'label', 'freeformLine'] as const)(
      '%s returns snap unchanged in pixel mode',
      type => {
        const snap = makePixelSnap(100, 80);
        expect(applyAnchorOffset(snap, type, 'none')).toBe(snap);
      },
    );
  });

  describe('data snap modes — no offset applied', () => {
    it.each(['data', 'tick'] as const)(
      'circle in %s snap mode returns snap unchanged',
      snapMode => {
        const snap = makeDataSnap(100, 80);
        expect(applyAnchorOffset(snap, 'circle', snapMode)).toBe(snap);
      },
    );

    it.each(['data', 'tick'] as const)(
      'rectangle in %s snap mode returns snap unchanged',
      snapMode => {
        const snap = makeDataSnap(100, 80);
        expect(applyAnchorOffset(snap, 'rectangle', snapMode)).toBe(snap);
      },
    );
  });

  it('offset anchor + real cursor distance equals the default radius (circle)', () => {
    const realCursor = { x: 100, y: 80 };
    const offsetSnap = applyAnchorOffset(makePixelSnap(realCursor.x, realCursor.y), 'circle', 'none');
    const anchor = offsetSnap.interactionCoordinate;
    const dist = Math.sqrt(
      (realCursor.x - anchor.x) ** 2 + (realCursor.y - anchor.y) ** 2,
    );
    expect(dist).toBe(DEFAULT_CIRCLE_RADIUS);
  });

  it('offset anchor + real cursor spans the default rect size (rectangle)', () => {
    const realCursor = { x: 100, y: 80 };
    const offsetSnap = applyAnchorOffset(makePixelSnap(realCursor.x, realCursor.y), 'rectangle', 'none');
    const anchor = offsetSnap.interactionCoordinate;
    expect(Math.abs(realCursor.x - anchor.x)).toBe(DEFAULT_RECT_WIDTH);
    expect(Math.abs(realCursor.y - anchor.y)).toBe(DEFAULT_RECT_HEIGHT);
  });
});

// ─── isDragInteraction ───────────────────────────────────────────────────────

describe('isDragInteraction', () => {
  it('returns false for zero movement', () => {
    expect(isDragInteraction({ x: 100, y: 80 }, { x: 100, y: 80 })).toBe(false);
  });

  it(`returns false for movement exactly at the threshold (${DRAG_THRESHOLD}px)`, () => {
    expect(isDragInteraction({ x: 0, y: 0 }, { x: DRAG_THRESHOLD, y: 0 })).toBe(false);
  });

  it('returns false for movement just below the threshold', () => {
    expect(isDragInteraction({ x: 0, y: 0 }, { x: DRAG_THRESHOLD - 0.1, y: 0 })).toBe(false);
  });

  it('returns true for movement just above the threshold', () => {
    expect(isDragInteraction({ x: 0, y: 0 }, { x: DRAG_THRESHOLD + 0.1, y: 0 })).toBe(true);
  });

  it('returns true for a substantial drag', () => {
    expect(isDragInteraction({ x: 0, y: 0 }, { x: 50, y: 30 })).toBe(true);
  });

  it('measures Euclidean distance (diagonal movement)', () => {
    // 3-4-5 right triangle: dist = 5 = DRAG_THRESHOLD → false
    expect(isDragInteraction({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(false);
    // Slightly more → true
    expect(isDragInteraction({ x: 0, y: 0 }, { x: 3.1, y: 4 })).toBe(true);
  });
});
