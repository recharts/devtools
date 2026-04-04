import React, { useEffect, useState } from 'react';
import { useAnimationProgress } from 'recharts';
import type { AnimationHandle, AnimationStatus } from 'recharts';

const statusLabels: Record<AnimationStatus, string> = {
  idle: '⏸ Idle',
  pending: '⏳ Pending',
  active: '▶ Active',
  complete: '✓ Complete',
};

function SliderRow({
  label,
  progress,
  status,
  onChange,
  onRewind,
  onFastForward,
}: {
  label: string;
  progress: number;
  status: AnimationStatus;
  onChange: (value: number) => void;
  onRewind: () => void;
  onFastForward: () => void;
}) {
  const inputId = `animation-progress-${label}`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ minWidth: 80, fontSize: '0.85em', opacity: 0.8 }}>{statusLabels[status]}</span>
      <label htmlFor={inputId} style={{ minWidth: 160, fontSize: '0.85em' }}>
        {label}
      </label>
      <button type="button" onClick={onRewind} title="Rewind to start" style={{ fontSize: '0.85em' }}>
        ⏪
      </button>
      <input
        type="range"
        id={inputId}
        min={0}
        max={1}
        step={0.001}
        value={progress}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, minWidth: 120 }}
      />
      <span style={{ minWidth: 36, fontSize: '0.85em', textAlign: 'right' }}>{Math.round(progress * 100)}%</span>
      <button type="button" onClick={onFastForward} title="Fast-forward to end" style={{ fontSize: '0.85em' }}>
        ⏩
      </button>
    </div>
  );
}

/**
 * Displays animation progress sliders for all animations inside an
 * `AnimationProgressProvider` from recharts. Each animation gets its own slider
 * showing status (pending / active / complete) and allowing manual scrubbing.
 *
 * Must be rendered inside an `AnimationProgressProvider`.
 */
export function AnimationProgressControls() {
  const animations = useAnimationProgress();

  if (!animations) {
    return <p style={{ fontSize: '0.85em', opacity: 0.7 }}>No animation provider found.</p>;
  }

  return <AnimationProgressControlsInner animations={animations} />;
}

function AnimationProgressControlsInner({ animations }: { animations: Map<string, AnimationHandle> }) {
  const [progressMap, setProgressMap] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    setProgressMap(prev => {
      const next = new Map<string, number>();
      for (const [id] of animations) {
        next.set(id, prev.get(id) ?? 0);
      }
      return next;
    });
  }, [animations]);

  if (animations.size === 0) {
    return <p style={{ fontSize: '0.85em', opacity: 0.7 }}>No animations registered.</p>;
  }

  const handleProgress = (animationId: string, value: number) => {
    const handle = animations.get(animationId);
    if (handle) {
      handle.setProgress(value);
      setProgressMap(prev => new Map(prev).set(animationId, value));
    }
  };

  const handleComplete = (animationId: string) => {
    const handle = animations.get(animationId);
    if (handle) {
      handle.complete();
      setProgressMap(prev => new Map(prev).set(animationId, 1));
    }
  };

  const handleAllProgress = (value: number) => {
    const next = new Map(progressMap);
    for (const [id, handle] of animations) {
      if (handle.isAnimating()) {
        handle.setProgress(value);
      }
      next.set(id, value);
    }
    setProgressMap(next);
  };

  const handleCompleteAll = () => {
    const next = new Map(progressMap);
    for (const [id, handle] of animations) {
      if (handle.isAnimating()) {
        handle.complete();
      }
      next.set(id, 1);
    }
    setProgressMap(next);
  };

  const allProgressValues = Array.from(progressMap.values());
  const averageProgress =
    allProgressValues.length > 0 ? allProgressValues.reduce((sum, p) => sum + p, 0) / allProgressValues.length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' }}>
      <strong style={{ fontSize: '0.9em' }}>Animation Progress</strong>
      {animations.size > 1 && (
        <SliderRow
          label="All animations"
          progress={averageProgress}
          status="active"
          onChange={handleAllProgress}
          onRewind={() => handleAllProgress(0)}
          onFastForward={handleCompleteAll}
        />
      )}
      {Array.from(animations).map(([id, handle]) => (
        <SliderRow
          key={id}
          label={id}
          progress={progressMap.get(id) ?? 0}
          status={handle.status}
          onChange={value => handleProgress(id, value)}
          onRewind={() => handleProgress(id, 0)}
          onFastForward={() => handleComplete(id)}
        />
      ))}
    </div>
  );
}
