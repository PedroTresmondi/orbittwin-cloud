import { RISK_ZONES } from "../data/riskZones";
import { ROUTE_AVOIDED_BLOCKS, ROUTE_CRITICAL_SEGMENTS } from "../data";
import type { RiskZone } from "../data/riskZones";
import type { GeoPoint, GeocodeResult, RouteResult, RouteSource, TravelProfile } from "../types";
import { GS_SHOWCASE_ZONE_ID } from "../data/gsDetourDemo";
import { buildSafeWaypoints, detourWaypointForZone, findCrossedZones, zoneInteriorPoint } from "../utils/riskGeometry";
import { calculateDistanceKm, calculateTravelTimeMinutes } from "./riskModel";
import { buildRecommendationConfidence } from "./riskService";

const OSRM_ENDPOINT = "https://router.project-osrm.org/route/v1/driving";

type OsrmRouteResponse = {
  code: string;
  routes?: Array<{
    duration: number;
    distance: number;
    geometry?: { coordinates: Array<[number, number]> };
  }>;
};

export async function getRoute(origin: GeocodeResult, destination: GeocodeResult): Promise<RouteResult> {
  const originPoint: GeoPoint = [origin.lat, origin.lng];
  const destPoint: GeoPoint = [destination.lat, destination.lng];

  try {
    const osrm = await fetchOsrmRoute([originPoint, destPoint]);
    return buildRouteResult(osrm.path, "osrm", osrm.durationSeconds, osrm.distanceMeters);
  } catch {
    const path = buildFallbackPath(originPoint, destPoint);
    return buildRouteResult(path, "fallback");
  }
}

/**
 * Demo GS: rota convencional atravessa zona crítica (Marginal Tietê); rota segura contorna via waypoints OSRM.
 */
export async function getGsDetourRoutes(
  origin: GeocodeResult,
  destination: GeocodeResult,
  riskZones: RiskZone[],
): Promise<{ conventional: RouteResult; safe: RouteResult; usedFallback: boolean; showcaseZoneName: string }> {
  const showcaseZone =
    riskZones.find((z) => z.id === GS_SHOWCASE_ZONE_ID) ??
    riskZones.find((z) => z.riskLevel === "critical") ??
    riskZones[0];

  const originPoint: GeoPoint = [origin.lat, origin.lng];
  const destPoint: GeoPoint = [destination.lat, destination.lng];

  let conventional = await getRoute(origin, destination);
  let convPath = conventional.path;

  const crossesShowcase = (path: GeoPoint[]) =>
    findCrossedZones(path, riskZones).some((z) => z.id === showcaseZone.id);

  if (!crossesShowcase(convPath)) {
    const anchor = zoneInteriorPoint(showcaseZone);
    try {
      const via = await fetchOsrmRoute([originPoint, anchor, destPoint]);
      convPath = via.path;
      conventional = buildRouteResult(via.path, "osrm", via.durationSeconds, via.distanceMeters);
    } catch {
      convPath = [originPoint, anchor, destPoint];
      conventional = buildRouteResult(convPath, "fallback");
    }
  }

  const conventionalWithPath: RouteResult = { ...conventional, path: convPath };

  let waypoints = buildSafeWaypoints(convPath, riskZones);
  if (waypoints.length === 0) {
    waypoints = [detourWaypointForZone(convPath, showcaseZone)];
  }

  const viaPoints = [originPoint, ...waypoints, destPoint];

  try {
    const osrm = await fetchOsrmRoute(viaPoints);
    let safePath = osrm.path;
    let durationSeconds = osrm.durationSeconds;
    let distanceMeters = osrm.distanceMeters;
    if (crossesShowcase(safePath) && waypoints.length < 3) {
      waypoints.push(detourWaypointForZone(safePath, showcaseZone));
      const retry = await fetchOsrmRoute([originPoint, ...waypoints, destPoint]);
      safePath = retry.path;
      durationSeconds = retry.durationSeconds;
      distanceMeters = retry.distanceMeters;
    }
    return {
      conventional: conventionalWithPath,
      safe: buildRouteResult(safePath, "osrm", durationSeconds, distanceMeters),
      usedFallback: false,
      showcaseZoneName: showcaseZone.name,
    };
  } catch {
    try {
      const osrmLegs = await fetchOsrmRouteByLegs(viaPoints);
      return {
        conventional: conventionalWithPath,
        safe: buildRouteResult(osrmLegs.path, "osrm", osrmLegs.durationSeconds, osrmLegs.distanceMeters),
        usedFallback: false,
        showcaseZoneName: showcaseZone.name,
      };
    } catch {
      const fallbackSafe = buildDetourFallbackPath(originPoint, destPoint, showcaseZone, convPath);
      return {
        conventional: conventionalWithPath,
        safe: buildRouteResult(fallbackSafe, "fallback"),
        usedFallback: true,
        showcaseZoneName: showcaseZone.name,
      };
    }
  }
}

function buildDetourFallbackPath(
  origin: GeoPoint,
  destination: GeoPoint,
  zone: RiskZone,
  conventionalPath: GeoPoint[],
): GeoPoint[] {
  const detour = detourWaypointForZone(conventionalPath, zone);
  return [origin, detour, destination];
}

export async function getSafeRoute(
  origin: GeocodeResult,
  destination: GeocodeResult,
  riskZones: RiskZone[],
  profile: TravelProfile,
): Promise<{ conventional: RouteResult; safe: RouteResult; usedFallback: boolean }> {
  const conventional = await getRoute(origin, destination);
  const waypoints = buildSafeWaypoints(conventional.path, riskZones);

  if (waypoints.length === 0) {
    return {
      conventional,
      safe: cloneRouteResult(conventional),
      usedFallback: conventional.source === "fallback",
    };
  }

  const originPoint: GeoPoint = [origin.lat, origin.lng];
  const destPoint: GeoPoint = [destination.lat, destination.lng];
  const viaPoints = [originPoint, ...waypoints, destPoint];

  try {
    const osrm = await fetchOsrmRoute(viaPoints);
    return {
      conventional,
      safe: buildRouteResult(osrm.path, "osrm", osrm.durationSeconds, osrm.distanceMeters),
      usedFallback: false,
    };
  } catch {
    try {
      const osrmLegs = await fetchOsrmRouteByLegs(viaPoints);
      return {
        conventional,
        safe: buildRouteResult(osrmLegs.path, "osrm", osrmLegs.durationSeconds, osrmLegs.distanceMeters),
        usedFallback: false,
      };
    } catch {
      return {
        conventional,
        safe: cloneRouteResult(conventional),
        usedFallback: true,
      };
    }
  }
}

export async function fetchOsrmPath(points: GeoPoint[]): Promise<GeoPoint[]> {
  const route = await fetchOsrmRoute(points);
  return route.path;
}

async function fetchOsrmRoute(points: GeoPoint[]): Promise<{
  path: GeoPoint[];
  durationSeconds: number;
  distanceMeters: number;
}> {
  const coordinates = points.map(([lat, lng]) => `${lng},${lat}`).join(";");
  const response = await fetch(`${OSRM_ENDPOINT}/${coordinates}?overview=full&geometries=geojson&steps=false`, {
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) throw new Error(`OSRM status ${response.status}`);

  const payload = (await response.json()) as OsrmRouteResponse;
  const route = payload.routes?.[0];
  const coords = route?.geometry?.coordinates;
  if (payload.code !== "Ok" || !coords?.length) throw new Error("OSRM sem geometria");

  return {
    path: coords.map(([lng, lat]) => [lat, lng]),
    durationSeconds: route?.duration ?? 0,
    distanceMeters: route?.distance ?? 0,
  };
}

function buildRouteResult(
  path: GeoPoint[],
  source: RouteSource,
  durationSeconds?: number,
  distanceMeters?: number,
): RouteResult {
  const distanceKm =
    distanceMeters && distanceMeters > 0 ? Math.round((distanceMeters / 1000) * 10) / 10 : calculateDistanceKm(path);
  const durationMinutes =
    durationSeconds && durationSeconds > 0
      ? Math.max(5, Math.round(durationSeconds / 60))
      : Math.max(5, Math.round((distanceKm / 28) * 60));

  return {
    path,
    distanceKm,
    durationMinutes,
    source,
  };
}

function buildFallbackPath(origin: GeoPoint, destination: GeoPoint): GeoPoint[] {
  const mid: GeoPoint = [(origin[0] + destination[0]) / 2, (origin[1] + destination[1]) / 2];
  return [origin, mid, destination];
}

function cloneRouteResult(route: RouteResult): RouteResult {
  return {
    path: route.path.map((point) => [...point] as GeoPoint),
    distanceKm: route.distanceKm,
    durationMinutes: route.durationMinutes,
    source: route.source,
  };
}

async function fetchOsrmRouteByLegs(points: GeoPoint[]): Promise<{
  path: GeoPoint[];
  durationSeconds: number;
  distanceMeters: number;
}> {
  if (points.length < 2) throw new Error("OSRM legs: pontos insuficientes");

  let path: GeoPoint[] = [];
  let durationSeconds = 0;
  let distanceMeters = 0;

  for (let i = 0; i < points.length - 1; i += 1) {
    const leg = await fetchOsrmRoute([points[i], points[i + 1]]);
    if (path.length === 0) {
      path = [...leg.path];
    } else {
      path.push(...leg.path.slice(1));
    }
    durationSeconds += leg.durationSeconds;
    distanceMeters += leg.distanceMeters;
  }

  return { path, durationSeconds, distanceMeters };
}

export function getMidpoint(a: GeoPoint, b: GeoPoint): GeoPoint {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

export function buildBlocksFromZones(zones: RiskZone[]): GeoPoint[] {
  return zones
    .filter((z) => z.riskLevel === "critical" || z.riskLevel === "high")
    .map((z) => {
      const lat = z.polygon.reduce((s, p) => s + p[0], 0) / z.polygon.length;
      const lng = z.polygon.reduce((s, p) => s + p[1], 0) / z.polygon.length;
      return [lat, lng] as GeoPoint;
    });
}

export { RISK_ZONES, buildRecommendationConfidence, calculateTravelTimeMinutes };
