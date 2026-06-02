import type { RiskZone } from "../data/riskZones";
import type { GeoPoint } from "../types";

export function pathIntersectsZone(path: GeoPoint[], polygon: GeoPoint[]): boolean {
  return path.some((point) => isPointInPolygon(point, polygon));
}

export function pathNearZone(path: GeoPoint[], polygon: GeoPoint[], thresholdMeters = 250): boolean {
  const centroid = polygonCentroid(polygon);
  return path.some((point) => haversineMeters(point, centroid) < thresholdMeters + 400);
}

export function findCrossedZones(path: GeoPoint[], zones: RiskZone[]): RiskZone[] {
  return zones.filter((zone) => pathIntersectsZone(path, zone.polygon) || pathNearZone(path, zone.polygon));
}

export function buildSafeWaypoints(path: GeoPoint[], zones: RiskZone[]): GeoPoint[] {
  const crossed = findCrossedZones(path, zones).filter((z) => z.riskLevel === "critical" || z.riskLevel === "high");
  if (crossed.length === 0) return [];

  return crossed.map((zone) => offsetOutsideZone(path, zone)).filter((point, index, arr) => {
    return arr.findIndex((p) => haversineMeters(p, point) < 80) === index;
  });
}

/** Ponto dentro da zona (centroide) — útil para forçar passagem na rota convencional na demo GS */
export function zoneInteriorPoint(zone: RiskZone): GeoPoint {
  return polygonCentroid(zone.polygon);
}

/** Waypoint de desvio para OSRM contornar a zona */
export function detourWaypointForZone(path: GeoPoint[], zone: RiskZone): GeoPoint {
  return offsetOutsideZone(path, zone);
}

function offsetOutsideZone(path: GeoPoint[], zone: RiskZone): GeoPoint {
  const centroid = polygonCentroid(zone.polygon);
  const midPath = path[Math.floor(path.length / 2)] ?? path[0];
  const dLat = midPath[0] - centroid[0];
  const dLng = midPath[1] - centroid[1];
  const factor = zone.riskLevel === "critical" ? 0.028 : 0.016;
  const len = Math.hypot(dLat, dLng) || 1;
  return [centroid[0] + (dLat / len) * factor, centroid[1] + (dLng / len) * factor];
}

function polygonCentroid(polygon: GeoPoint[]): GeoPoint {
  const lat = polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length;
  const lng = polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length;
  return [lat, lng];
}

function isPointInPolygon(point: GeoPoint, polygon: GeoPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i];
    const xj = polygon[j];
    const intersect =
      xi[1] > point[1] !== xj[1] > point[1] &&
      point[0] < ((xj[0] - xi[0]) * (point[1] - xi[1])) / (xj[1] - xi[1]) + xi[0];
    if (intersect) inside = !inside;
  }
  return inside;
}

function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const r = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function toRad(v: number): number {
  return (v * Math.PI) / 180;
}
