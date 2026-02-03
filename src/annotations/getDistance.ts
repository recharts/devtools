import { SnapResult } from './useSnap';

export function getDistance(a: SnapResult, b: SnapResult): number {
  return Math.sqrt(
    Math.pow(a.interactionCoordinate.x - b.interactionCoordinate.x, 2) +
      Math.pow(a.interactionCoordinate.y - b.interactionCoordinate.y, 2),
  );
}
