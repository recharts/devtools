/**
 * @fileoverview renders UI form for managing annotations in a chart.
 *
 * This is basic UI for demonstration purposes.
 * In your own application, this UI is probably going to look completely different.
 * Feel free to reuse what you see here but chances are you'll want to build your own anyway.
 *
 * Allows:
 *
 * - Adding, editing, and deleting annotations.
 * - Supported annotations: Crosshairs, Labels, Shapes (lines, rectangles, circles).
 * - Configuring annotation styles: color, strokeWidth, strokeDasharray, fill, opacity.
 * - Positioning annotations using coordinates. Allows both absolute pixel values and data values.
 * - Adding labels to annotations with customizable text and styles and position.
 *
 * This controller is meant to be rendered outside the chart area, typically in a sidebar or modal,
 * in an HTML context (not SVG).
 */
import React, { useId, useState } from 'react';
import type { Annotation, AnnotationType, AnnotationStyle, SnapMode } from './types.js';

const ANNOTATION_TYPES: { type: AnnotationType; label: string }[] = [
  { type: 'horizontalLine', label: 'Horizontal Line' },
  { type: 'verticalLine', label: 'Vertical Line' },
  { type: 'circle', label: 'Circle' },
  { type: 'rectangle', label: 'Rectangle' },
  { type: 'label', label: 'Label' },
  { type: 'freeformLine', label: 'Freeform Line' },
  { type: 'crosshair', label: 'Crosshair' },
];

interface AnnotationsControllerProps {
  annotations: Annotation[];
  isAdding: AnnotationType | null;
  selectedAnnotationId: number | null;
  snapMode: SnapMode;
  onStartAdding: (type: AnnotationType) => void;
  onCancelAdding: () => void;
  onDeleteAnnotation: (id: number) => void;
  onUpdateAnnotation: (annotation: Annotation) => void;
  onSelectAnnotation: (id: number | null) => void;
  onSnapModeChange: (newSnapMode: SnapMode) => void;
}

const buttonStyle: React.CSSProperties = {
  padding: '4px 8px',
  fontSize: '11px',
  cursor: 'pointer',
  border: '1px solid #ccc',
  borderRadius: '3px',
  background: '#fff',
};

const activeButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: '#e0e0e0',
  borderColor: '#999',
};

const inputStyle: React.CSSProperties = {
  width: '50px',
  fontSize: '11px',
  padding: '2px 4px',
  border: '1px solid #ccc',
  borderRadius: '2px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  minWidth: '40px',
  display: 'inline-flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '1ex',
  marginRight: '2ex',
};

function SnapModeRadioGroup({
  snapMode,
  onSnapModeChange,
}: {
  snapMode: SnapMode;
  onSnapModeChange: (newSnapMode: SnapMode) => void;
}) {
  const name = useId();

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>Snap to Data:</div>
      <label style={labelStyle}>
        <input
          type="radio"
          name={name}
          value="none"
          checked={snapMode === 'none'}
          onChange={() => onSnapModeChange('none')}
        />
        No snapping
      </label>
      <label style={labelStyle}>
        <input
          type="radio"
          name={name}
          value="data"
          checked={snapMode === 'data'}
          onChange={() => onSnapModeChange('data')}
        />
        Snap to data points
      </label>
      <label style={labelStyle}>
        <input
          type="radio"
          name={name}
          value="tick"
          checked={snapMode === 'tick'}
          onChange={() => onSnapModeChange('tick')}
        />
        Snap to axis ticks
      </label>
    </div>
  );
}

/**
 * Renders controls for adding, editing, and removing annotations.
 *
 * This component renders HTML elements and is meant to be rendered via portal
 * outside the SVG chart context.
 */
export function AnnotationsController({
  annotations,
  isAdding,
  selectedAnnotationId,
  snapMode,
  onStartAdding,
  onCancelAdding,
  onDeleteAnnotation,
  onUpdateAnnotation,
  onSelectAnnotation,
  onSnapModeChange,
}: AnnotationsControllerProps) {
  const [expandedAnnotationId, setExpandedAnnotationId] = useState<number | null>(null);

  const handleStyleChange = (
    annotation: Annotation,
    styleKey: keyof AnnotationStyle,
    value: string | number,
  ) => {
    onUpdateAnnotation({
      ...annotation,
      style: {
        ...annotation.style,
        [styleKey]: value,
      },
    });
  };

  const handlePositionChange = (annotation: Annotation, field: string, value: string) => {
    const numValue = parseFloat(value);
    if (!Number.isNaN(numValue)) {
      onUpdateAnnotation({
        ...annotation,
        [field]: numValue,
      } as Annotation);
    }
  };

  const toggleExpanded = (id: number) => {
    setExpandedAnnotationId((prev) => (prev === id ? null : id));
  };

  return (
    <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
      {/* Add annotation buttons */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>Add Annotation:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {ANNOTATION_TYPES.map(({ type, label }) => (
            <button
              key={type}
              type="button"
              onClick={() => (isAdding === type ? onCancelAdding() : onStartAdding(type))}
              style={isAdding === type ? activeButtonStyle : buttonStyle}
            >
              {isAdding === type ? `Cancel ${label}` : label}
            </button>
          ))}
        </div>
        {isAdding && (
          <div style={{ marginTop: '6px', fontSize: '11px', color: '#666' }}>
            Click on the chart to place the annotation
            {(isAdding === 'rectangle' || isAdding === 'freeformLine' || isAdding === 'circle') &&
              ' (click twice or drag to define dimensions)'}
          </div>
        )}
      </div>

      <SnapModeRadioGroup snapMode={snapMode} onSnapModeChange={onSnapModeChange} />

      {/* Annotations list */}
      <div>
        <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>
          Annotations ({annotations.length}):
        </div>
        {annotations.length === 0 ? (
          <div style={{ fontSize: '11px', color: '#666' }}>No annotations yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {annotations.map((annotation) => (
              <div
                key={annotation.id}
                style={{
                  padding: '8px',
                  border:
                    selectedAnnotationId === annotation.id ? '2px solid #007bff' : '1px solid #ddd',
                  borderRadius: '4px',
                  background: '#fafafa',
                }}
              >
                {/* Annotation header */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}
                >
                  <input
                    type="color"
                    value={annotation.style.color ?? '#ff0000'}
                    onChange={(e) => handleStyleChange(annotation, 'color', e.target.value)}
                    style={{
                      width: '20px',
                      height: '20px',
                      padding: 0,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    title="Change color"
                  />
                  <span style={{ fontWeight: 'bold', fontSize: '11px', flex: 1 }}>
                    {ANNOTATION_TYPES.find((t) => t.type === annotation.type)?.label ??
                      annotation.type}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(annotation.id)}
                    style={buttonStyle}
                  >
                    {expandedAnnotationId === annotation.id ? '▼' : '▶'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onSelectAnnotation(
                        selectedAnnotationId === annotation.id ? null : annotation.id,
                      )
                    }
                    style={selectedAnnotationId === annotation.id ? activeButtonStyle : buttonStyle}
                  >
                    {selectedAnnotationId === annotation.id ? 'Deselect' : 'Select'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteAnnotation(annotation.id)}
                    style={{ ...buttonStyle, color: '#d00' }}
                  >
                    Delete
                  </button>
                </div>

                {/* Expanded annotation details */}
                {expandedAnnotationId === annotation.id && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #ddd' }}>
                    {/* Position fields based on annotation type */}
                    <div
                      style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}
                    >
                      {(annotation.type === 'verticalLine' ||
                        annotation.type === 'circle' ||
                        annotation.type === 'label' ||
                        annotation.type === 'crosshair') && (
                        <label style={labelStyle}>
                          X:
                          <input
                            type="number"
                            value={
                              typeof annotation.x === 'number'
                                ? annotation.x.toFixed(1)
                                : annotation.x
                            }
                            onChange={(e) => handlePositionChange(annotation, 'x', e.target.value)}
                            style={inputStyle}
                          />
                        </label>
                      )}
                      {(annotation.type === 'horizontalLine' ||
                        annotation.type === 'circle' ||
                        annotation.type === 'label' ||
                        annotation.type === 'crosshair') && (
                        <label style={labelStyle}>
                          Y:
                          <input
                            type="number"
                            value={
                              typeof annotation.y === 'number'
                                ? annotation.y.toFixed(1)
                                : annotation.y
                            }
                            onChange={(e) => handlePositionChange(annotation, 'y', e.target.value)}
                            style={inputStyle}
                          />
                        </label>
                      )}
                      {(annotation.type === 'rectangle' || annotation.type === 'freeformLine') && (
                        <>
                          <label style={labelStyle}>
                            X1:
                            <input
                              type="number"
                              value={
                                typeof annotation.x1 === 'number'
                                  ? annotation.x1.toFixed(1)
                                  : annotation.x1
                              }
                              onChange={(e) =>
                                handlePositionChange(annotation, 'x1', e.target.value)
                              }
                              style={inputStyle}
                            />
                          </label>
                          <label style={labelStyle}>
                            Y1:
                            <input
                              type="number"
                              value={
                                typeof annotation.y1 === 'number'
                                  ? annotation.y1.toFixed(1)
                                  : annotation.y1
                              }
                              onChange={(e) =>
                                handlePositionChange(annotation, 'y1', e.target.value)
                              }
                              style={inputStyle}
                            />
                          </label>
                          <label style={labelStyle}>
                            X2:
                            <input
                              type="number"
                              value={
                                typeof annotation.x2 === 'number'
                                  ? annotation.x2.toFixed(1)
                                  : annotation.x2
                              }
                              onChange={(e) =>
                                handlePositionChange(annotation, 'x2', e.target.value)
                              }
                              style={inputStyle}
                            />
                          </label>
                          <label style={labelStyle}>
                            Y2:
                            <input
                              type="number"
                              value={
                                typeof annotation.y2 === 'number'
                                  ? annotation.y2.toFixed(1)
                                  : annotation.y2
                              }
                              onChange={(e) =>
                                handlePositionChange(annotation, 'y2', e.target.value)
                              }
                              style={inputStyle}
                            />
                          </label>
                        </>
                      )}
                      {annotation.type === 'circle' && (
                        <label style={labelStyle}>
                          Radius:
                          <input
                            type="number"
                            value={annotation.r}
                            onChange={(e) => handlePositionChange(annotation, 'r', e.target.value)}
                            style={inputStyle}
                          />
                        </label>
                      )}
                    </div>

                    {/* Style fields */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <label style={labelStyle}>
                        Stroke:
                        <input
                          type="number"
                          value={annotation.style.strokeWidth ?? 2}
                          onChange={(e) =>
                            handleStyleChange(annotation, 'strokeWidth', parseFloat(e.target.value))
                          }
                          style={inputStyle}
                          min={0}
                          step={0.5}
                        />
                      </label>
                      <label style={labelStyle}>
                        Opacity:
                        <input
                          type="number"
                          value={annotation.style.opacity ?? 1}
                          onChange={(e) =>
                            handleStyleChange(annotation, 'opacity', parseFloat(e.target.value))
                          }
                          style={inputStyle}
                          min={0}
                          max={1}
                          step={0.1}
                        />
                      </label>
                      <label style={labelStyle}>
                        Dash:
                        <input
                          type="text"
                          value={annotation.style.strokeDasharray ?? ''}
                          onChange={(e) =>
                            handleStyleChange(annotation, 'strokeDasharray', e.target.value)
                          }
                          style={{ ...inputStyle, width: '60px' }}
                          placeholder="e.g. 4 2"
                        />
                      </label>
                      {(annotation.type === 'rectangle' || annotation.type === 'circle') && (
                        <>
                          <label style={labelStyle}>
                            Fill:
                            <input
                              type="color"
                              value={annotation.style.fill ?? '#cccccc'}
                              onChange={(e) =>
                                handleStyleChange(annotation, 'fill', e.target.value)
                              }
                              style={{
                                width: '20px',
                                height: '20px',
                                padding: 0,
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            />
                          </label>
                          <label style={labelStyle}>
                            Fill Opacity:
                            <input
                              type="number"
                              value={annotation.style.fillOpacity ?? 0.1}
                              onChange={(e) =>
                                handleStyleChange(
                                  annotation,
                                  'fillOpacity',
                                  parseFloat(e.target.value),
                                )
                              }
                              style={inputStyle}
                              min={0}
                              max={1}
                              step={0.1}
                            />
                          </label>
                        </>
                      )}
                    </div>

                    {/* Label for label annotation */}
                    {'text' in annotation && (
                      <div style={{ marginTop: '8px' }}>
                        <label style={labelStyle}>
                          Text:
                          <input
                            type="text"
                            value={String(annotation.label?.value ?? '')}
                            onChange={(e) =>
                              onUpdateAnnotation({
                                ...annotation,
                                label: { ...annotation.label, value: e.target.value },
                              })
                            }
                            style={{ ...inputStyle, width: '150px' }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
