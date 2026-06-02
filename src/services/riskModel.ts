import { RISK_SCORE } from "../data";
import type { GeoPoint, Region, RouteData, RouteExposure, TravelProfile } from "../types";

const PROFILE_RISK_MULTIPLIER: Record<TravelProfile, number> = {
  emergency: 1.16,
  public_transport: 1.08,
  utility: 1,
  pedestrian: 1.24,
};

const PROFILE_TIME_MULTIPLIER: Record<TravelProfile, number> = {
  emergency: 0.82,
  public_transport: 1.18,
  utility: 1,
  pedestrian: 2.8,
};

export function calculateDistanceKm(path: GeoPoint[]): number {
  if (path.length < 2) return 0;

  let meters = 0;
  for (let index = 1; index < path.length; index += 1) {
    meters += haversineMeters(path[index - 1], path[index]);
  }

  return round(meters / 1000, 1);
}

export function calculateTravelTimeMinutes(distanceKm: number, profile: TravelProfile, fallbackMinutes: number): number {
  if (distanceKm <= 0) return fallbackMinutes;

  const baseSpeedKmh = profile === "pedestrian" ? 5 : profile === "public_transport" ? 24 : profile === "emergency" ? 42 : 34;
  return Math.max(5, Math.round((distanceKm / baseSpeedKmh) * 60 * PROFILE_TIME_MULTIPLIER[profile]));
}

export function calculateRouteExposure(
  path: GeoPoint[],
  riskArea: GeoPoint[],
  blocks: GeoPoint[],
  region: Region,
  profile: TravelProfile,
): RouteExposure {
  const pointsInsideRiskArea = path.filter((point) => isPointInPolygon(point, riskArea)).length;
  const minBlockDistanceMeters = getMinBlockDistance(path, blocks);
  const nearBlocks = blocks.filter((block) => getMinDistanceToPath(block, path) <= 180).length;
  const areaExposure = path.length > 0 ? (pointsInsideRiskArea / path.length) * 42 : 0;
  const blockExposure = nearBlocks * 12;
  const proximityExposure =
    minBlockDistanceMeters === null ? 0 : minBlockDistanceMeters < 90 ? 18 : minBlockDistanceMeters < 180 ? 10 : 4;
  const regionalBase = RISK_SCORE[region.risk] * 0.38;
  const score = clamp(Math.round((regionalBase + areaExposure + blockExposure + proximityExposure) * PROFILE_RISK_MULTIPLIER[profile]), 8, 98);

  return {
    score,
    pointsInsideRiskArea,
    nearBlocks,
    minBlockDistanceMeters: minBlockDistanceMeters === null ? null : Math.round(minBlockDistanceMeters),
  };
}

export function buildRecommendationConfidence(route: RouteData): number {
  const riskReduction = route.conventionalRisk - route.safeRisk;
  const timePenalty = Math.max(route.safeTime - route.conventionalTime, 0);
  const distancePenalty = Math.max(route.safeDistanceKm - route.conventionalDistanceKm, 0);

  return clamp(Math.round(62 + riskReduction * 0.62 - timePenalty * 0.9 - distancePenalty * 1.1), 35, 96);
}

function haversineMeters(from: GeoPoint, to: GeoPoint): number {
  const radius = 6371000;
  const fromLat = toRadians(from[0]);
  const toLat = toRadians(to[0]);
  const deltaLat = toRadians(to[0] - from[0]);
  const deltaLng = toRadians(to[1] - from[1]);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getMinBlockDistance(path: GeoPoint[], blocks: GeoPoint[]): number | null {
  if (path.length === 0 || blocks.length === 0) return null;

  return Math.min(...blocks.map((block) => getMinDistanceToPath(block, path)));
}

function getMinDistanceToPath(point: GeoPoint, path: GeoPoint[]): number {
  if (path.length === 1) return haversineMeters(point, path[0]);

  let min = Number.POSITIVE_INFINITY;
  for (let index = 1; index < path.length; index += 1) {
    min = Math.min(min, pointToSegmentMeters(point, path[index - 1], path[index]));
  }

  return min;
}

function pointToSegmentMeters(point: GeoPoint, segmentStart: GeoPoint, segmentEnd: GeoPoint): number {
  const referenceLat = toRadians(point[0]);
  const metersPerLat = 111320;
  const metersPerLng = Math.cos(referenceLat) * 111320;
  const px = point[1] * metersPerLng;
  const py = point[0] * metersPerLat;
  const ax = segmentStart[1] * metersPerLng;
  const ay = segmentStart[0] * metersPerLat;
  const bx = segmentEnd[1] * metersPerLng;
  const by = segmentEnd[0] * metersPerLat;
  const dx = bx - ax;
  const dy = by - ay;

  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);

  const t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy), 0, 1);
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function isPointInPolygon(point: GeoPoint, polygon: GeoPoint[]): boolean {
  let inside = false;

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const currentPoint = polygon[index];
    const previousPoint = polygon[previous];
    const intersects =
      currentPoint[1] > point[1] !== previousPoint[1] > point[1] &&
      point[0] <
        ((previousPoint[0] - currentPoint[0]) * (point[1] - currentPoint[1])) /
          (previousPoint[1] - currentPoint[1]) +
          currentPoint[0];

    if (intersects) inside = !inside;
  }

  return inside;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
