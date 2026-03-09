/**
 * Tests for useAnnotationsManager covering:
 *   - All 7 annotation types
 *   - All 3 snap modes (none/data/tick)
 *   - Both interaction modes for two-point annotations (click+drag, two-click)
 *
 * The hook operates on plain SnapResult values; it does not care about the DOM.
 * In production, RenderAnnotations pre-processes mouse events before calling
 * the hook handlers — in particular it applies applyAnchorOffset() to the
 * firstClickPosition for circle and rectangle.  These tests therefore pass
 * already-offset anchors to onChartMouseDown (marked as such in comments) to
 * replicate what RenderAnnotations would supply.
 */
import { renderHook, act } from '@testing-library/react';
import { useAnnotationsManager } from '../../src/annotations/useAnnotationsManager.js';
import type { SnapResult } from '../../src/annotations/useSnap.js';
import type { AnnotationType, SnapMode } from '../../src/annotations/types.js';
import {
  DEFAULT_CIRCLE_RADIUS,
  DEFAULT_RECT_WIDTH,
  DEFAULT_RECT_HEIGHT,
  applyAnchorOffset,
} from '../../src/annotations/annotationInteractionUtils.js';

// ─── Snap result factories ────────────────────────────────────────────────────

function pixelSnap(x: number, y: number): SnapResult {
  return { interactionCoordinate: { x, y }, snappedCoordinate: undefined, dataPoint: undefined };
}

function dataSnap(x: number, y: number): SnapResult {
  return {
    interactionCoordinate: { x, y },
    snappedCoordinate: { x, y },
    dataPoint: { x: 'category-A', y: 42 },
  };
}

function tickSnap(x: number, y: number): SnapResult {
  return {
    interactionCoordinate: { x, y },
    snappedCoordinate: { x, y },
    dataPoint: { x: 10, y: 20 },
  };
}

// ─── Test configuration ───────────────────────────────────────────────────────

const SINGLE_CLICK_TYPES: AnnotationType[] = [
  'horizontalLine',
  'verticalLine',
  'crosshair',
  'label',
];

const TWO_POINT_TYPES: AnnotationType[] = ['circle', 'rectangle', 'freeformLine'];

const SNAP_CONFIGS = [
  { snapMode: 'none', expectedPositionType: 'pixel', makeSnap: pixelSnap },
  { snapMode: 'data', expectedPositionType: 'data', makeSnap: dataSnap },
  { snapMode: 'tick', expectedPositionType: 'data', makeSnap: tickSnap },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Start the hook, set the snap mode, begin adding the given annotation type. */
function setup(type: AnnotationType, snapMode: SnapMode) {
  const { result } = renderHook(() => useAnnotationsManager());
  act(() => {
    result.current.setSnapMode(snapMode);
    result.current.startAddingAnnotation(type);
  });
  return result;
}

/**
 * For circle and rectangle in pixel mode, RenderAnnotations applies applyAnchorOffset
 * before forwarding to onChartMouseDown.  This helper mirrors that transform.
 * In data/tick modes applyAnchorOffset is a no-op, so the result is just the snap itself.
 */
function anchorSnap(type: AnnotationType, snapMode: SnapMode, x: number, y: number): SnapResult {
  const base =
    snapMode === 'data' ? dataSnap(x, y) : snapMode === 'tick' ? tickSnap(x, y) : pixelSnap(x, y);
  return applyAnchorOffset(base, type, snapMode);
}

// ─── Single-click annotation tests ───────────────────────────────────────────

describe('single-click annotations', () => {
  describe.each(SINGLE_CLICK_TYPES)('%s', (type) => {
    describe.each(SNAP_CONFIGS)(
      'snap mode: $snapMode',
      ({ snapMode, expectedPositionType, makeSnap }) => {
        it('creates annotation on click and clears isAdding', () => {
          const result = setup(type, snapMode);
          act(() => {
            result.current.onChartClick(makeSnap(100, 80));
          });

          expect(result.current.annotations).toHaveLength(1);
          expect(result.current.annotations[0].type).toBe(type);
          expect(result.current.annotations[0].positionType).toBe(expectedPositionType);
          expect(result.current.isAdding).toBeNull();
        });

        it('stores the snap result as pointA', () => {
          const result = setup(type, snapMode);
          const snap = makeSnap(123, 456);
          act(() => {
            result.current.onChartClick(snap);
          });

          expect(result.current.annotations[0].pointA).toBe(snap);
        });

        it('follower tracks mouse move while adding', () => {
          const result = setup(type, snapMode);
          const snap = makeSnap(55, 66);
          act(() => {
            result.current.onChartMouseMove(snap);
          });

          expect(result.current.followerPosition).toBe(snap);
        });

        it('cancels adding without creating an annotation', () => {
          const result = setup(type, snapMode);
          act(() => {
            result.current.cancelAddingAnnotation();
          });

          expect(result.current.annotations).toHaveLength(0);
          expect(result.current.isAdding).toBeNull();
          expect(result.current.followerPosition).toBeNull();
        });

        it('mouseDown and mouseUp are no-ops for single-click types', () => {
          const result = setup(type, snapMode);
          act(() => {
            result.current.onChartMouseDown(makeSnap(100, 80));
            result.current.onChartMouseUp(makeSnap(100, 80));
          });

          // Still waiting for a click — not completed yet
          expect(result.current.annotations).toHaveLength(0);
          expect(result.current.isAdding).toBe(type);
        });
      },
    );
  });
});

// ─── Two-point annotation tests ───────────────────────────────────────────────

describe('two-point annotations', () => {
  describe.each(TWO_POINT_TYPES)('%s', (type) => {
    describe.each(SNAP_CONFIGS)(
      'snap mode: $snapMode',
      ({ snapMode, expectedPositionType, makeSnap }) => {
        // ── Click + drag ──────────────────────────────────────────────────────

        describe('click + drag interaction', () => {
          it('creates annotation when mouseUp is far from mouseDown', () => {
            const result = setup(type, snapMode);
            // For circle/rectangle in pixel mode RenderAnnotations offsets the anchor.
            const anchor = anchorSnap(type, snapMode, 100, 80);
            const far = makeSnap(200, 180); // real cursor position used as pointB

            act(() => {
              result.current.onChartMouseDown(anchor);
            });
            expect(result.current.firstClickPosition).toBe(anchor);

            act(() => {
              result.current.onChartMouseUp(far);
            });

            expect(result.current.annotations).toHaveLength(1);
            expect(result.current.annotations[0].type).toBe(type);
            expect(result.current.annotations[0].positionType).toBe(expectedPositionType);
            expect(result.current.annotations[0].pointA).toBe(anchor);
            expect(result.current.annotations[0].pointB).toBe(far);
            expect(result.current.isAdding).toBeNull();
            expect(result.current.firstClickPosition).toBeNull();
          });

          it('follower shows from anchor to current cursor after mouseDown', () => {
            const result = setup(type, snapMode);
            const anchor = anchorSnap(type, snapMode, 100, 80);
            const moving = makeSnap(150, 120);

            act(() => {
              result.current.onChartMouseDown(anchor);
            });
            act(() => {
              result.current.onChartMouseMove(moving);
            });

            expect(result.current.firstClickPosition).toBe(anchor);
            expect(result.current.followerPosition).toBe(moving);
          });
        });

        // ── Two-click ─────────────────────────────────────────────────────────

        describe('two-click interaction', () => {
          it('first click (mouseDown+mouseUp at same spot) does not confirm the annotation', () => {
            const result = setup(type, snapMode);
            const anchor = anchorSnap(type, snapMode, 100, 80);

            // Click 1: full mouseDown → mouseUp without moving
            act(() => {
              result.current.onChartMouseDown(anchor);
            });
            act(() => {
              result.current.onChartMouseUp(anchor);
            }); // dist = 0 ≤ threshold

            expect(result.current.annotations).toHaveLength(0);
            expect(result.current.isAdding).toBe(type);
            expect(result.current.firstClickPosition).toBe(anchor); // anchor is still locked
          });

          it('second click (mouseDown+mouseUp at new spot) confirms the annotation', () => {
            const result = setup(type, snapMode);
            const anchor = anchorSnap(type, snapMode, 100, 80);
            const far = makeSnap(200, 180);

            // Click 1: sets anchor
            act(() => {
              result.current.onChartMouseDown(anchor);
            });
            act(() => {
              result.current.onChartMouseUp(anchor);
            }); // stationary — no confirm

            // Move cursor
            act(() => {
              result.current.onChartMouseMove(far);
            });

            // Click 2: confirms at the new position
            act(() => {
              result.current.onChartMouseDown(far);
            }); // no-op, anchor unchanged
            expect(result.current.firstClickPosition).toBe(anchor);
            act(() => {
              result.current.onChartMouseUp(far);
            }); // dist > threshold → confirm

            expect(result.current.annotations).toHaveLength(1);
            expect(result.current.annotations[0].type).toBe(type);
            expect(result.current.annotations[0].positionType).toBe(expectedPositionType);
            expect(result.current.annotations[0].pointA).toBe(anchor);
            expect(result.current.annotations[0].pointB).toBe(far);
            expect(result.current.isAdding).toBeNull();
          });

          it('follower updates between first and second click', () => {
            const result = setup(type, snapMode);
            const anchor = anchorSnap(type, snapMode, 100, 80);
            const mid = makeSnap(150, 120);
            const far = makeSnap(200, 180);

            // Click 1
            act(() => {
              result.current.onChartMouseDown(anchor);
            });
            act(() => {
              result.current.onChartMouseUp(anchor);
            });

            // Mouse moves
            act(() => {
              result.current.onChartMouseMove(mid);
            });
            expect(result.current.followerPosition).toBe(mid);

            act(() => {
              result.current.onChartMouseMove(far);
            });
            expect(result.current.followerPosition).toBe(far);
          });
        });

        // ── Shared two-point behaviour ─────────────────────────────────────────

        it('click event is ignored (handled by mouseDown/mouseUp instead)', () => {
          const result = setup(type, snapMode);
          act(() => {
            result.current.onChartClick(makeSnap(100, 80));
          });

          expect(result.current.annotations).toHaveLength(0);
          expect(result.current.isAdding).toBe(type);
        });

        it('cancel clears anchor and stops adding', () => {
          const result = setup(type, snapMode);
          const anchor = anchorSnap(type, snapMode, 100, 80);
          act(() => {
            result.current.onChartMouseDown(anchor);
          });
          act(() => {
            result.current.cancelAddingAnnotation();
          });

          expect(result.current.isAdding).toBeNull();
          expect(result.current.firstClickPosition).toBeNull();
          expect(result.current.annotations).toHaveLength(0);
        });
      },
    );
  });

  // ── Circle-specific: anchor offset gives correct initial radius ─────────────

  describe('circle anchor offset (pixel mode)', () => {
    it(`initial radius equals ${DEFAULT_CIRCLE_RADIUS}px when anchor is at default offset`, () => {
      const result = setup('circle', 'none');
      // Simulate: real cursor at (100, 80). RenderAnnotations offsets the anchor.
      const realCursorX = 100;
      const realCursorY = 80;
      const anchor = anchorSnap('circle', 'none', realCursorX, realCursorY);

      act(() => {
        result.current.onChartMouseDown(anchor);
      });

      // we're still adding because mouseUp hasn't happened yet
      expect(result.current.isAdding).toBe('circle');

      const { x, y } = result.current.firstClickPosition?.interactionCoordinate ?? {};
      expect(x).toBe(realCursorX - DEFAULT_CIRCLE_RADIUS);
      expect(y).toBe(realCursorY);
    });
  });

  // ── Rectangle-specific: anchor offset gives correct initial size ────────────

  describe('rectangle anchor offset (pixel mode)', () => {
    it(`initial size is ${DEFAULT_RECT_WIDTH}×${DEFAULT_RECT_HEIGHT} when anchor is at default offset`, () => {
      const result = setup('rectangle', 'none');
      const realCursorX = 100;
      const realCursorY = 80;
      const anchor = anchorSnap('rectangle', 'none', realCursorX, realCursorY);

      act(() => {
        result.current.onChartMouseDown(anchor);
      });

      expect(result.current.isAdding).toBe('rectangle');

      const { x, y } = result.current.firstClickPosition?.interactionCoordinate ?? {};
      expect(x).toBe(realCursorX - DEFAULT_RECT_WIDTH);
      expect(y).toBe(realCursorY - DEFAULT_RECT_HEIGHT);
    });
  });
});

// ─── Snap-mode-aware confirmation threshold ───────────────────────────────────
//
// In pixel mode, circle/rectangle have an offset anchor (pointA is shifted away from
// the real cursor by DEFAULT_CIRCLE_RADIUS / DEFAULT_RECT dimensions), so the hook
// must use a larger minimum distance to avoid confirming on the first stationary click.
//
// In data/tick mode there is no offset, so the threshold should revert to the base
// value (3px) — allowing even a small drag to confirm the annotation.

describe('confirmation threshold is snap-mode-aware', () => {
  // Pixel mode: mouseUp at the real cursor position must NOT confirm.
  // anchor=(70,80), real cursor=(100,80), dist=30 which is < threshold(3+30=33).
  it('circle pixel mode: mouseUp at real-cursor position does not confirm (anchor-offset threshold)', () => {
    const result = setup('circle', 'none');
    const anchor = anchorSnap('circle', 'none', 100, 80); // → (70, 80)
    const realCursor = pixelSnap(100, 80); // dist from anchor = 30 < 33

    act(() => {
      result.current.onChartMouseDown(anchor);
    });
    act(() => {
      result.current.onChartMouseUp(realCursor);
    });

    expect(result.current.annotations).toHaveLength(0);
    expect(result.current.isAdding).toBe('circle');
    expect(result.current.firstClickPosition).toBe(anchor);
  });

  // Data mode: a small 4px drag must confirm (threshold is just 3px).
  // Without the fix the hook uses threshold=33 and 4 < 33 → no confirm (bug).
  it('circle data mode: 4px drag confirms (threshold is 3px)', () => {
    const result = setup('circle', 'data');
    const anchor = dataSnap(100, 80);
    const nearby = dataSnap(104, 80); // dist = 4 > 3

    act(() => {
      result.current.onChartMouseDown(anchor);
    });
    act(() => {
      result.current.onChartMouseUp(nearby);
    });

    expect(result.current.annotations).toHaveLength(1);
    expect(result.current.isAdding).toBeNull();
  });

  it('circle tick mode: 4px drag confirms (threshold is 3px)', () => {
    const result = setup('circle', 'tick');
    const anchor = tickSnap(100, 80);
    const nearby = tickSnap(104, 80);

    act(() => {
      result.current.onChartMouseDown(anchor);
    });
    act(() => {
      result.current.onChartMouseUp(nearby);
    });

    expect(result.current.annotations).toHaveLength(1);
    expect(result.current.isAdding).toBeNull();
  });

  // Rectangle pixel mode: anchor=(40,40), real cursor=(100,80).
  // dist(anchor, cursor)=sqrt(60²+40²)≈72.1, threshold=3+72.1≈75.1 → no confirm.
  it('rectangle pixel mode: mouseUp at real-cursor position does not confirm (anchor-offset threshold)', () => {
    const result = setup('rectangle', 'none');
    const anchor = anchorSnap('rectangle', 'none', 100, 80); // → (40, 40)
    const realCursor = pixelSnap(100, 80); // dist ≈ 72.1 < threshold ≈ 75.1

    act(() => {
      result.current.onChartMouseDown(anchor);
    });
    act(() => {
      result.current.onChartMouseUp(realCursor);
    });

    expect(result.current.annotations).toHaveLength(0);
    expect(result.current.isAdding).toBe('rectangle');
    expect(result.current.firstClickPosition).toBe(anchor);
  });

  it('rectangle data mode: 4px drag confirms (threshold is 3px)', () => {
    const result = setup('rectangle', 'data');
    const anchor = dataSnap(100, 80);
    const nearby = dataSnap(104, 80); // dist = 4 > 3

    act(() => {
      result.current.onChartMouseDown(anchor);
    });
    act(() => {
      result.current.onChartMouseUp(nearby);
    });

    expect(result.current.annotations).toHaveLength(1);
    expect(result.current.isAdding).toBeNull();
  });

  it('rectangle tick mode: 4px drag confirms (threshold is 3px)', () => {
    const result = setup('rectangle', 'tick');
    const anchor = tickSnap(100, 80);
    const nearby = tickSnap(104, 80);

    act(() => {
      result.current.onChartMouseDown(anchor);
    });
    act(() => {
      result.current.onChartMouseUp(nearby);
    });

    expect(result.current.annotations).toHaveLength(1);
    expect(result.current.isAdding).toBeNull();
  });
});

// ─── General state management ─────────────────────────────────────────────────

describe('general state management', () => {
  it('starts with empty annotations and no active state', () => {
    const { result } = renderHook(() => useAnnotationsManager());
    expect(result.current.annotations).toHaveLength(0);
    expect(result.current.isAdding).toBeNull();
    expect(result.current.followerPosition).toBeNull();
    expect(result.current.firstClickPosition).toBeNull();
  });

  it('follower clears on mouse leave', () => {
    const { result } = renderHook(() => useAnnotationsManager());
    act(() => {
      result.current.startAddingAnnotation('horizontalLine');
    });
    act(() => {
      result.current.onChartMouseMove(pixelSnap(50, 50));
    });
    act(() => {
      result.current.onChartMouseLeave();
    });
    expect(result.current.followerPosition).toBeNull();
  });

  it('multiple annotations can be added sequentially', () => {
    const { result } = renderHook(() => useAnnotationsManager());
    act(() => {
      result.current.startAddingAnnotation('horizontalLine');
    });
    act(() => {
      result.current.onChartClick(pixelSnap(100, 80));
    });
    act(() => {
      result.current.startAddingAnnotation('verticalLine');
    });
    act(() => {
      result.current.onChartClick(pixelSnap(200, 160));
    });
    expect(result.current.annotations).toHaveLength(2);
  });

  it('deleteAnnotation removes the correct annotation', () => {
    const { result } = renderHook(() => useAnnotationsManager());
    act(() => {
      result.current.startAddingAnnotation('horizontalLine');
    });
    act(() => {
      result.current.onChartClick(pixelSnap(100, 80));
    });
    const id = result.current.annotations[0].id;
    act(() => {
      result.current.deleteAnnotation(id);
    });
    expect(result.current.annotations).toHaveLength(0);
  });

  it('updateAnnotation replaces the annotation in place', () => {
    const { result } = renderHook(() => useAnnotationsManager());
    act(() => {
      result.current.startAddingAnnotation('horizontalLine');
    });
    act(() => {
      result.current.onChartClick(pixelSnap(100, 80));
    });
    const original = result.current.annotations[0];
    const updated = { ...original, style: { ...original.style, color: 'red' } };
    act(() => {
      result.current.updateAnnotation(updated);
    });

    expect(result.current.annotations[0].style.color).toBe('red');
    expect(result.current.annotations).toHaveLength(1);
  });
});
