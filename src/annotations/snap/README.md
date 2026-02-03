Snap annotations snap to the nearest data point, or axis tick, on the chart.
They use data coordinates and are bound to data points.
These annotations are limited to the plot area of the chart.

Snap coordinates use Recharts components that accept data coordinates:

- `<ReferenceArea>`, `<ReferenceDot>`, `<ReferenceLine>`

Or alternatively you can call the `useAxisScale` hook to convert data coordinates to pixel coordinates, and then use SVG elements or Recharts shapes that accept pixel coordinates.
