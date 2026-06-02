import { OPERATIONAL_PLACES, ROUTE_AVOIDED_BLOCKS, ROUTE_CRITICAL_SEGMENTS } from "../data";
import type { GeoPoint, OperationalPlace, Region, RegionKey, RouteData, RouteEngineResult, RouteInputs } from "../types";
import {
  buildRecommendationConfidence,
  calculateDistanceKm,
  calculateRouteExposure,
  calculateTravelTimeMinutes,
} from "./riskModel";

type OsrmRouteResponse = {
  code: string;
  routes?: Array<{
    duration: number;
    distance: number;
    geometry?: {
      type: "LineString";
      coordinates: Array<[number, number]>;
    };
  }>;
};

const OSRM_ENDPOINT = "https://router.project-osrm.org/route/v1/driving";

export async function calculateSafeRoute(
  regionKey: RegionKey,
  region: Region,
  currentRoute: RouteData,
  inputs: RouteInputs,
): Promise<RouteEngineResult> {
  const origin = findPlace(inputs.originId) ?? findPlace(currentRoute.originPlaceId);
  const destination = findPlace(inputs.destinationId) ?? findPlace(currentRoute.destinationPlaceId);

  if (!origin || !destination) {
    return {
      route: currentRoute,
      usedFallback: true,
      error: "Origem ou destino operacional não encontrado.",
    };
  }

  const fallbackRoute = buildRouteFromPaths({
    regionKey,
    region,
    currentRoute,
    origin,
    destination,
    conventionalPath: [origin.coords, ...currentRoute.map.conventionalPath.slice(1, -1), destination.coords],
    safePath: [origin.coords, ...currentRoute.map.safePath.slice(1, -1), destination.coords],
    source: "fallback",
    profile: inputs.profile,
  });

  try {
    const [conventionalPath, safePath] = await Promise.all([
      fetchOsrmPath([origin.coords, destination.coords]),
      fetchOsrmPath([origin.coords, ...selectSafeWaypoints(currentRoute), destination.coords]),
    ]);

    return {
      route: buildRouteFromPaths({
        regionKey,
        region,
        currentRoute,
        origin,
        destination,
        conventionalPath,
        safePath,
        source: "osrm",
        profile: inputs.profile,
      }),
      usedFallback: false,
    };
  } catch (error) {
    return {
      route: fallbackRoute,
      usedFallback: true,
      error: error instanceof Error ? error.message : "Serviço externo de rotas indisponível.",
    };
  }
}

function buildRouteFromPaths({
  regionKey,
  region,
  currentRoute,
  origin,
  destination,
  conventionalPath,
  safePath,
  source,
  profile,
}: {
  regionKey: RegionKey;
  region: Region;
  currentRoute: RouteData;
  origin: OperationalPlace;
  destination: OperationalPlace;
  conventionalPath: GeoPoint[];
  safePath: GeoPoint[];
  source: RouteData["source"];
  profile: RouteInputs["profile"];
}): RouteData {
  const conventionalDistanceKm = calculateDistanceKm(conventionalPath);
  const safeDistanceKm = calculateDistanceKm(safePath);
  const conventionalExposure = calculateRouteExposure(
    conventionalPath,
    currentRoute.map.riskArea,
    currentRoute.map.blocks,
    region,
    profile,
  );
  const safeExposure = calculateRouteExposure(safePath, currentRoute.map.riskArea, currentRoute.map.blocks, region, profile);
  const conventionalRisk = normalizeConventionalRisk(region.risk, conventionalExposure.score);
  const safeRisk = normalizeSafeRisk(region.risk, safeExposure.score, conventionalRisk);
  const conventionalTime = calculateTravelTimeMinutes(conventionalDistanceKm, profile, currentRoute.conventionalTime);
  const safeTime = Math.max(
    calculateTravelTimeMinutes(safeDistanceKm, profile, currentRoute.safeTime),
    conventionalTime + (profile === "emergency" ? 1 : 2),
  );
  const nextRoute: RouteData = {
    ...currentRoute,
    originPlaceId: origin.id,
    destinationPlaceId: destination.id,
    origin: origin.name,
    destination: destination.name,
    conventionalTime,
    safeTime,
    conventionalRisk,
    safeRisk,
    conventionalDistanceKm,
    safeDistanceKm,
    source,
    criticalSegments: selectRouteItems(ROUTE_CRITICAL_SEGMENTS[regionKey], conventionalExposure.nearBlocks + 2),
    avoidedBlocks: selectRouteItems(ROUTE_AVOIDED_BLOCKS[regionKey], safeExposure.nearBlocks + 2),
    recommendation: buildDecisionText(region, conventionalRisk, safeRisk),
    map: {
      ...currentRoute.map,
      center: getMidpoint(origin.coords, destination.coords),
      originCoords: origin.coords,
      destinationCoords: destination.coords,
      conventionalPath,
      safePath,
    },
  };

  return {
    ...nextRoute,
    confidence: buildRecommendationConfidence(nextRoute),
  };
}

async function fetchOsrmPath(points: GeoPoint[]): Promise<GeoPoint[]> {
  const coordinates = points.map(([lat, lng]) => `${lng},${lat}`).join(";");
  const response = await fetch(`${OSRM_ENDPOINT}/${coordinates}?overview=full&geometries=geojson&steps=false`, {
    signal: AbortSignal.timeout(4500),
  });

  if (!response.ok) {
    throw new Error(`OSRM respondeu com status ${response.status}.`);
  }

  const payload = (await response.json()) as OsrmRouteResponse;
  const route = payload.routes?.[0];
  const coordinatesList = route?.geometry?.coordinates;

  if (payload.code !== "Ok" || !coordinatesList || coordinatesList.length < 2) {
    throw new Error("OSRM não retornou geometria válida para a rota.");
  }

  return coordinatesList.map(([lng, lat]) => [lat, lng]);
}

function selectSafeWaypoints(route: RouteData): GeoPoint[] {
  const points = route.map.safePath.slice(1, -1);

  if (points.length <= 2) return points;

  return [points[Math.floor(points.length / 3)], points[Math.floor((points.length * 2) / 3)]];
}

function selectRouteItems(items: string[], count: number): string[] {
  return items.slice(0, Math.max(2, Math.min(items.length, count)));
}

function buildDecisionText(region: Region, conventionalRisk: number, safeRisk: number): string {
  const reduction = Math.max(conventionalRisk - safeRisk, 0);

  if (region.risk === "critical" || conventionalRisk >= 82) {
    return `Priorizar rota segura. Redução estimada de ${reduction} pontos de exposição operacional.`;
  }

  if (region.risk === "high" || conventionalRisk >= 64) {
    return `Recomendar rota OrbitTwin para deslocamentos essenciais. Redução estimada de ${reduction} pontos.`;
  }

  return `Manter rota OrbitTwin como contingência ativa. Redução estimada de ${reduction} pontos.`;
}

function normalizeConventionalRisk(risk: Region["risk"], exposureScore: number): number {
  const riskFloor: Record<Region["risk"], number> = {
    low: 32,
    medium: 52,
    high: 72,
    critical: 84,
  };

  return Math.min(Math.max(exposureScore, riskFloor[risk]), 98);
}

function normalizeSafeRisk(risk: Region["risk"], exposureScore: number, conventionalRisk: number): number {
  const safeCeiling: Record<Region["risk"], number> = {
    low: 24,
    medium: 32,
    high: 40,
    critical: 46,
  };
  const targetReduction: Record<Region["risk"], number> = {
    low: 12,
    medium: 22,
    high: 30,
    critical: 38,
  };

  const targetRisk = conventionalRisk - targetReduction[risk];
  return Math.max(8, Math.min(exposureScore, safeCeiling[risk], targetRisk));
}

function findPlace(id: string): OperationalPlace | undefined {
  return OPERATIONAL_PLACES.find((place) => place.id === id);
}

function getMidpoint(origin: GeoPoint, destination: GeoPoint): GeoPoint {
  return [(origin[0] + destination[0]) / 2, (origin[1] + destination[1]) / 2];
}
