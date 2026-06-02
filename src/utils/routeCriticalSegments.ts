import type { RiskZone } from "../data/riskZones";
import type { GeoPoint } from "../types";
import type { RouteCriticalSegment } from "../types/routeHazard";
import { pointTouchesAnyZone } from "./riskGeometry";

/** Divide a rota convencional em trechos normais e críticos (cruzam ou encostam em zonas). */
export function buildCriticalRouteSegments(path: GeoPoint[], zones: RiskZone[]): RouteCriticalSegment[] {
  if (path.length < 2 || zones.length === 0) return [];

  const segments: RouteCriticalSegment[] = [];
  let buffer: GeoPoint[] = [];
  let activeZone: RiskZone | undefined;

  const flush = () => {
    if (buffer.length >= 2 && activeZone) {
      segments.push({
        points: [...buffer],
        zoneId: activeZone.id,
        zoneName: activeZone.name,
      });
    }
    buffer = [];
    activeZone = undefined;
  };

  for (let i = 0; i < path.length; i += 1) {
    const point = path[i];
    const zone = pointTouchesAnyZone(point, zones);

    if (zone) {
      if (!activeZone || activeZone.id !== zone.id) {
        flush();
        activeZone = zone;
        if (i > 0 && buffer.length === 0) {
          buffer.push(path[i - 1]);
        }
      }
      buffer.push(point);
    } else if (buffer.length > 0) {
      buffer.push(point);
      flush();
    }
  }

  flush();
  return segments;
}
