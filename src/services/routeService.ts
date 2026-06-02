import { OPERATIONAL_PLACES, REGION_KEYS, createInitialState } from "../data";
import { RISK_ZONES } from "../data/riskZones";
import type { RegionKey } from "../types";
import type {
  GeocodeResult,
  OperationalEvent,
  PlannedRouteResult,
  RouteData,
  RouteInputs,
  SimulationReport,
  TravelProfile,
} from "../types";
import { findCrossedZones } from "../utils/riskGeometry";
import { buildCitizenRouteMessage, buildRecommendedActions } from "../utils/routeMessages";
import { getMidpoint, getSafeRoute, buildBlocksFromZones } from "./routeEngine";
import { compareRouteRisks, buildRecommendationConfidence } from "./riskService";
import { getWeatherForRoute } from "./weatherService";

export async function planSafeRoute(
  origin: GeocodeResult,
  destination: GeocodeResult,
  profile: TravelProfile,
): Promise<PlannedRouteResult> {
  const warnings: string[] = [];
  const regionKey = inferRegionKey(origin);
  const region = createInitialState().regions[regionKey];

  const [routes, weather] = await Promise.all([
    getSafeRoute(origin, destination, RISK_ZONES, profile),
    getWeatherForRoute([origin.lat, origin.lng], [destination.lat, destination.lng]),
  ]);

  if (routes.usedFallback || routes.conventional.source === "fallback") {
    warnings.push("Roteamento em modo de contingência local (OSRM indisponível ou sem resposta).");
  }
  if (weather.isSimulated) {
    warnings.push("Clima em modo simulado — Open-Meteo indisponível.");
  }

  const blocks = buildBlocksFromZones(RISK_ZONES);
  const profileFactor = profile === "pedestrian" || profile === "citizen" ? 1.35 : profile === "emergency" ? 0.9 : 1;
  const conventionalTime = Math.max(5, Math.round(routes.conventional.durationMinutes * profileFactor));
  const safeTime = Math.max(
    Math.round(routes.safe.durationMinutes * profileFactor),
    conventionalTime + (profile === "emergency" ? 1 : 2),
  );

  const risk = compareRouteRisks({
    conventionalPath: routes.conventional.path,
    safePath: routes.safe.path,
    zones: RISK_ZONES,
    blocks,
    profile,
    weather,
    region,
    safeExtraMinutes: Math.max(safeTime - conventionalTime, 0),
  });

  const crossed = findCrossedZones(routes.conventional.path, RISK_ZONES);
  const criticalSegments = crossed.map((z) => `${z.name} — ${z.description}`);
  const avoided = findCrossedZones(routes.conventional.path, RISK_ZONES)
    .filter((z) => !findCrossedZones(routes.safe.path, [z]).length)
    .map((z) => `Desvio: ${z.name}`);

  const route: RouteData = {
    originPlaceId: `geo-${origin.lat}`,
    destinationPlaceId: `geo-${destination.lat}`,
    origin: origin.label.split(",").slice(0, 2).join(","),
    destination: destination.label.split(",").slice(0, 2).join(","),
    conventionalTime,
    safeTime,
    conventionalRisk: risk.conventionalRiskScore,
    safeRisk: risk.safeRiskScore,
    conventionalDistanceKm: routes.conventional.distanceKm,
    safeDistanceKm: routes.safe.distanceKm,
    confidence: risk.confidence,
    source: routes.safe.source,
    criticalSegments: criticalSegments.length ? criticalSegments : ["Trecho direto sem nomeação de zona"],
    avoidedBlocks: avoided.length ? avoided : ["Trechos críticos evitados pelo desvio OrbitTwin"],
    recommendation: risk.recommendation,
    map: {
      center: getMidpoint([origin.lat, origin.lng], [destination.lat, destination.lng]),
      originCoords: [origin.lat, origin.lng],
      destinationCoords: [destination.lat, destination.lng],
      riskArea: RISK_ZONES.flatMap((z) => z.polygon),
      conventionalPath: routes.conventional.path,
      safePath: routes.safe.path,
      blocks,
    },
    conventionalAssessment: {
      riskScore: risk.conventionalRiskScore,
      riskLabel: `${risk.conventionalRiskLabel} (${risk.conventionalRiskScore}/100)`,
      confidence: risk.confidence,
      exposureReduction: 0,
      explanation: risk.explanation,
    },
    safeAssessment: {
      riskScore: risk.safeRiskScore,
      riskLabel: `${risk.safeRiskLabel} (${risk.safeRiskScore}/100)`,
      confidence: risk.confidence,
      exposureReduction: risk.exposureReduction,
      explanation: risk.explanation,
    },
  };

  return {
    route: { ...route, confidence: buildRecommendationConfidence(route) },
    weather,
    risk,
    usedFallback: routes.usedFallback || routes.conventional.source === "fallback",
    warnings,
  };
}

export function buildOperationalEvent(
  planned: PlannedRouteResult,
  origin: GeocodeResult,
  destination: GeocodeResult,
  profile: TravelProfile,
  timestamp: string,
  id: string,
): OperationalEvent {
  const { route, weather, risk } = planned;
  return {
    id,
    timestamp,
    region: createInitialState().regions[inferRegionKey(origin)].name,
    origin: route.origin,
    destination: route.destination,
    profile,
    source: route.source,
    conventionalRisk: route.conventionalRisk,
    safeRisk: route.safeRisk,
    conventionalTime: route.conventionalTime,
    safeTime: route.safeTime,
    conventionalDistanceKm: route.conventionalDistanceKm,
    safeDistanceKm: route.safeDistanceKm,
    exposureReduction: risk.exposureReduction,
    finalRecommendation: risk.recommendation,
    riskReduction: risk.exposureReduction,
    confidence: risk.confidence,
    weatherSource: weather.source,
    geocodeSource: origin.source === "nominatim" && destination.source === "nominatim" ? "Nominatim" : "fallback",
    plannerSnapshot: planned,
  };
}

export function buildSimulationReport(planned: PlannedRouteResult, profile: TravelProfile): SimulationReport {
  const { route, weather, risk } = planned;
  const regionName = RISK_ZONES.find((z) => risk.crossedZones.includes(z.name))?.name ?? "São Paulo";

  return {
    generatedAt: new Date().toLocaleString("pt-BR"),
    origin: route.origin,
    destination: route.destination,
    profile,
    region: regionName,
    recommendedRoute: "Rota OrbitTwin segura",
    conventionalRisk: route.conventionalRisk,
    safeRisk: route.safeRisk,
    conventionalTime: route.conventionalTime,
    safeTime: route.safeTime,
    timeDifferenceMinutes: Math.max(route.safeTime - route.conventionalTime, 0),
    riskReduction: risk.exposureReduction,
    exposureReductionPercent: risk.exposureReductionPercent,
    confidence: risk.confidence,
    source: route.source,
    citizenMessage: risk.recommendation,
    justifications: risk.explanation,
    recommendedActions: buildRecommendedActionsFromRisk(risk),
    weather,
    crossedZones: risk.crossedZones,
  };
}

function buildRecommendedActionsFromRisk(risk: PlannedRouteResult["risk"]): string[] {
  const actions = [...risk.explanation.slice(0, 2)];
  if (risk.conventionalRiskScore >= 70) {
    actions.push("Evite a rota convencional até nova atualização das condições climáticas.");
  }
  actions.push("Siga a rota OrbitTwin destacada em ciano no mapa.");
  return [...new Set(actions)];
}

function inferRegionKey(origin: GeocodeResult): RegionKey {
  let best: RegionKey = "centro";
  let bestDist = Number.POSITIVE_INFINITY;

  for (const key of REGION_KEYS) {
    const zone = RISK_ZONES.find((z) => z.regionKey === key);
    if (!zone) continue;
    const cLat = zone.polygon.reduce((s, p) => s + p[0], 0) / zone.polygon.length;
    const cLng = zone.polygon.reduce((s, p) => s + p[1], 0) / zone.polygon.length;
    const d = Math.hypot(origin.lat - cLat, origin.lng - cLng);
    if (d < bestDist) {
      bestDist = d;
      best = key;
    }
  }
  return best;
}

/** Compatibilidade com fluxo legado por região */
export async function calculateSafeRoute(
  regionKey: RegionKey,
  _region: unknown,
  currentRoute: RouteData,
  inputs: RouteInputs,
): Promise<{ route: RouteData; usedFallback: boolean; error?: string }> {
  const originPlace = OPERATIONAL_PLACES.find((p) => p.id === inputs.originId);
  const destPlace = OPERATIONAL_PLACES.find((p) => p.id === inputs.destinationId);
  if (!originPlace || !destPlace) {
    return { route: currentRoute, usedFallback: true, error: "Origem ou destino não encontrado." };
  }

  const origin: GeocodeResult = {
    label: originPlace.name,
    lat: originPlace.coords[0],
    lng: originPlace.coords[1],
    type: "place",
    importance: 1,
    source: "fallback",
  };
  const destination: GeocodeResult = {
    label: destPlace.name,
    lat: destPlace.coords[0],
    lng: destPlace.coords[1],
    type: "place",
    importance: 1,
    source: "fallback",
  };

  const planned = await planSafeRoute(origin, destination, inputs.profile);
  return { route: planned.route, usedFallback: planned.usedFallback };
}

export { buildCitizenRouteMessage };
