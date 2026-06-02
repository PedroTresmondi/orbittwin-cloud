import { OPERATIONAL_PLACES, REGION_KEYS, RISK_LABELS, createInitialState } from "../data";
import { riskLevelFromScore } from "../simulation";
import { RISK_ZONES } from "../data/riskZones";
import type { RegionKey } from "../types";
import type {
  GeocodeResult,
  OperationalEvent,
  PlannedRouteResult,
  RouteData,
  RouteInputs,
  ScenarioKind,
  SimulationReport,
  TravelProfile,
} from "../types";
import { findCrossedZones } from "../utils/riskGeometry";
import { buildRouteHazards, buildCriticalRouteSegments } from "./routeHazardsService";
import { buildCitizenRouteMessage, buildRecommendedActions } from "../utils/routeMessages";
import { getMidpoint, getGsDetourRoutes, getSafeRoute, buildBlocksFromZones } from "./routeEngine";
import { GS_SHOWCASE_ZONE_ID, GS_SHOWCASE_ZONE_NAME } from "../data/gsDetourDemo";
import { applyGsDetourRiskAdjustment } from "./gsDetourRisk";
import { buildDataSources, buildRouteSimulationHistory } from "./historyMapper";
import { buildDataSourceStatuses } from "./dataSourceService";
import { compareRouteRisks, buildRecommendationConfidence } from "./riskService";
import {
  applyScenarioToWeather,
  applyScenarioToZones,
  buildScenarioExplanations,
  computeDataMode,
  getScenarioExtraBlocks,
  getSimulatedZoneIds,
  isScenarioActive,
  SCENARIO_LABELS,
} from "./scenarioService";
import { buildDataHub } from "./dataHubService";
import { fetchEnvironmentalContext } from "./environmentalDataService";
import { getWeatherForRoute } from "./weatherService";

export type PlanSafeRouteOptions = {
  scenario?: ScenarioKind;
  /** Demonstração GS: convencional pela zona crítica, segura com desvio */
  gsDetourDemo?: boolean;
};

export async function planSafeRoute(
  origin: GeocodeResult,
  destination: GeocodeResult,
  profile: TravelProfile,
  options?: PlanSafeRouteOptions,
): Promise<PlannedRouteResult> {
  const scenario: ScenarioKind = options?.scenario && options.scenario !== "clear" ? options.scenario : "real";
  const warnings: string[] = [];
  const regionKey = inferRegionKey(origin);
  const region = createInitialState().regions[regionKey];

  const activeZones = applyScenarioToZones(RISK_ZONES, scenario);

  const gsDetourDemo = options?.gsDetourDemo === true;

  const [baseWeather, environmental, routes] = await Promise.all([
    getWeatherForRoute([origin.lat, origin.lng], [destination.lat, destination.lng]),
    fetchEnvironmentalContext([origin.lat, origin.lng], [destination.lat, destination.lng]),
    gsDetourDemo
      ? getGsDetourRoutes(origin, destination, activeZones)
      : getSafeRoute(origin, destination, activeZones, profile),
  ]);

  const weather = applyScenarioToWeather(baseWeather, scenario);

  if (routes.usedFallback || routes.conventional.source === "fallback") {
    warnings.push("Não foi possível calcular rota real. Usando rota estimada local.");
  }
  if (baseWeather.isSimulated) {
    warnings.push("Não foi possível acessar a API de clima. Usando dados simulados.");
  }
  if (isScenarioActive(scenario)) {
    warnings.push(`Cenário simulado ativo: ${SCENARIO_LABELS[scenario]}.`);
  }
  if (gsDetourDemo) {
    warnings.push(`Demonstração GS: rota convencional passa por ${GS_SHOWCASE_ZONE_NAME}; rota OrbitTwin contorna a área crítica.`);
  }

  const zoneBlocks = buildBlocksFromZones(activeZones);
  const scenarioBlocks = getScenarioExtraBlocks(scenario, routes.conventional.path);
  const blocks = [...zoneBlocks, ...scenarioBlocks];
  const profileFactor = profile === "pedestrian" || profile === "citizen" ? 1.35 : profile === "emergency" ? 0.9 : 1;
  const conventionalTime = Math.max(5, Math.round(routes.conventional.durationMinutes * profileFactor));
  const safeTime = Math.max(
    Math.round(routes.safe.durationMinutes * profileFactor),
    conventionalTime + (profile === "emergency" ? 1 : 2),
  );

  let risk = compareRouteRisks({
    conventionalPath: routes.conventional.path,
    safePath: routes.safe.path,
    zones: activeZones,
    blocks,
    profile,
    weather,
    region,
    safeExtraMinutes: Math.max(safeTime - conventionalTime, 0),
    environmental,
  });

  if (isScenarioActive(scenario)) {
    risk = applyScenarioRiskBoost(risk, scenario);
    risk = {
      ...risk,
      explanation: [...buildScenarioExplanations(scenario, !baseWeather.isSimulated), ...risk.explanation],
      recommendation: buildScenarioRecommendation(risk, scenario, Math.max(safeTime - conventionalTime, 0)),
    };
  } else if (!baseWeather.isSimulated) {
    risk = {
      ...risk,
      explanation: [
        "A previsão real indica condições consultadas via Open-Meteo.",
        ...risk.explanation,
      ],
    };
  }

  if (gsDetourDemo) {
    risk = applyGsDetourRiskAdjustment(risk, routes.conventional.path, routes.safe.path, activeZones);
    const extraMin = Math.max(safeTime - conventionalTime, 0);
    const zoneLabel = GS_SHOWCASE_ZONE_NAME;
    risk = {
      ...risk,
      recommendation: buildGsDetourRecommendation(risk, zoneLabel, extraMin),
      explanation: [
        `A rota convencional atravessa ${zoneLabel} (nível crítico de alagamento).`,
        "A rota OrbitTwin recalcula o trajeto com waypoints de desvio (OSRM) para contornar a zona.",
        (risk.avoidedZoneNames?.length ?? 0) > 0
          ? `Zonas evitadas pela rota segura: ${risk.avoidedZoneNames!.join(", ")}.`
          : "Desvio calculado para reduzir exposição à zona crítica.",
        ...risk.explanation.slice(0, 1),
      ],
    };
  }

  const crossed = findCrossedZones(routes.conventional.path, activeZones);
  const mapHazards = buildRouteHazards({
    conventionalPath: routes.conventional.path,
    zones: activeZones,
    blocks,
    scenario,
    environmental,
    simulatedZoneIds: getSimulatedZoneIds(scenario),
  });
  const pathCriticalSegments = buildCriticalRouteSegments(
    routes.conventional.path,
    crossed.length ? crossed : activeZones,
  );
  const showcaseZone = activeZones.find((z) => z.id === GS_SHOWCASE_ZONE_ID);
  const primaryRiskZone =
    (gsDetourDemo && showcaseZone) ||
    crossed.find((z) => z.id === GS_SHOWCASE_ZONE_ID) ||
    crossed[0] ||
    RISK_ZONES.find((z) => z.regionKey === regionKey) ||
    RISK_ZONES[0];
  const criticalSegmentLabels = crossed.map((z) => `${z.name} — ${z.description}`);
  const avoided = crossed
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
    criticalSegments: criticalSegmentLabels.length ? criticalSegmentLabels : ["Trecho direto sem nomeação de zona"],
    avoidedBlocks: avoided.length ? avoided : ["Trechos críticos evitados pelo desvio OrbitTwin"],
    recommendation: risk.recommendation,
    map: {
      center: getMidpoint([origin.lat, origin.lng], [destination.lat, destination.lng]),
      originCoords: [origin.lat, origin.lng],
      destinationCoords: [destination.lat, destination.lng],
      riskArea: [...primaryRiskZone.polygon],
      conventionalPath: routes.conventional.path,
      safePath: routes.safe.path,
      blocks,
      simulatedZoneIds: getSimulatedZoneIds(scenario),
      hazards: mapHazards,
      criticalSegments: pathCriticalSegments,
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

  const dataSources = buildDataSourceStatuses({
    origin,
    destination,
    routeSource: routes.safe.source,
    weather,
    scenario,
  });

  const dataHub = buildDataHub({
    weather,
    baseWeather,
    routeSource: routes.safe.source,
    origin,
    destination,
    scenario,
    environmental,
  });

  if (dataSources.some((s) => s.status === "fallback")) {
    warnings.push("Não foi possível acessar alguma fonte real. Usando dados simulados para manter a demonstração.");
  }

  return {
    route: { ...route, confidence: buildRecommendationConfidence(route) },
    weather,
    baseWeather,
    risk,
    usedFallback: routes.usedFallback || routes.conventional.source === "fallback",
    warnings,
    scenario,
    scenarioLabel: SCENARIO_LABELS[scenario],
    dataMode: computeDataMode(scenario, weather, routes.safe.source),
    dataSources,
    dataHub,
    environmental,
    gsDetourDemo: gsDetourDemo || undefined,
  };
}

function applyScenarioRiskBoost(risk: PlannedRouteResult["risk"], scenario: ScenarioKind): PlannedRouteResult["risk"] {
  const boost = scenario === "multiple" ? 22 : scenario === "flood" ? 18 : 12;
  const conventionalRiskScore = Math.min(98, risk.conventionalRiskScore + boost);
  const safeRiskScore = Math.min(conventionalRiskScore - 4, Math.max(8, risk.safeRiskScore + 4));
  const exposureReduction = Math.max(conventionalRiskScore - safeRiskScore, 0);
  const exposureReductionPercent =
    conventionalRiskScore > 0 ? Math.round((exposureReduction / conventionalRiskScore) * 100) : 0;

  return {
    ...risk,
    conventionalRiskScore,
    safeRiskScore,
    conventionalRiskLabel: RISK_LABELS[riskLevelFromScore(conventionalRiskScore)] as PlannedRouteResult["risk"]["conventionalRiskLabel"],
    safeRiskLabel: RISK_LABELS[riskLevelFromScore(safeRiskScore)] as PlannedRouteResult["risk"]["safeRiskLabel"],
    exposureReduction,
    exposureReductionPercent,
    confidence: Math.min(96, risk.confidence + 8),
  };
}

function buildGsDetourRecommendation(
  risk: PlannedRouteResult["risk"],
  zoneName: string,
  extraMin: number,
): string {
  const timeLabel = extraMin <= 1 ? "1 minuto" : `${extraMin} minutos`;
  return `A rota convencional passa por ${zoneName} (risco ${risk.conventionalRiskLabel.toLowerCase()}). Use a rota OrbitTwin: ela contorna a área crítica em cerca de ${timeLabel} a mais e reduz a exposição em ${risk.exposureReductionPercent}%.`;
}

function buildScenarioRecommendation(
  risk: PlannedRouteResult["risk"],
  scenario: ScenarioKind,
  extraMin: number,
): string {
  const timeLabel = extraMin === 1 ? "1 minuto" : `${extraMin} minutos`;
  if (scenario === "flood" || scenario === "multiple") {
    return `Com a ${SCENARIO_LABELS[scenario].toLowerCase()}, a rota convencional cruza áreas críticas. O OrbitTwin recomenda a rota segura, que evita trechos alagados (cerca de ${timeLabel} a mais, -${risk.exposureReductionPercent}% exposição).`;
  }
  return `Rota segura recomendada no cenário simulado. Ela leva ${timeLabel} a mais, mas reduz em ${risk.exposureReductionPercent}% a exposição a áreas de risco.`;
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
  const sources = buildDataSources(planned, origin, destination);
  const simulation = buildRouteSimulationHistory(planned, origin, destination, profile, id, timestamp);

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
    exposureReduction: risk.exposureReductionPercent,
    finalRecommendation: risk.recommendation,
    riskReduction: risk.exposureReduction,
    confidence: risk.confidence,
    weatherSource: weather.source,
    geocodeSource: origin.source === "nominatim" && destination.source === "nominatim" ? "Nominatim" : "Geocoding (fallback)",
    sources,
    simulation,
    plannerSnapshot: planned,
  };
}

export function buildSimulationReport(planned: PlannedRouteResult, profile: TravelProfile): SimulationReport {
  const { route, weather, risk } = planned;
  const regionName = RISK_ZONES.find((z) => risk.crossedZones.includes(z.name))?.name ?? "São Paulo";

  const realDataUsed = [
    ...planned.dataSources.filter((d) => d.status === "online").map((d) => `${d.label}: ${d.provider}`),
    ...planned.dataHub
      .filter((e) => e.badge === "Real" || e.badge === "Fallback")
      .map((e) => `${e.name} (${e.badge})`),
  ];
  const simulatedDataUsed = [
    ...planned.dataSources
      .filter((d) => d.status === "simulated" || d.status === "fallback")
      .map((d) => `${d.label}: ${d.note ?? d.provider}`),
    ...planned.dataHub
      .filter((e) => e.badge === "Simulado" || e.badge === "Planejado")
      .map((e) => `${e.name}: ${e.usage}`),
  ];

  return {
    generatedAt: new Date().toLocaleString("pt-BR"),
    origin: route.origin,
    destination: route.destination,
    profile,
    scenario: planned.scenario,
    scenarioLabel: planned.scenarioLabel,
    dataMode: planned.dataMode,
    dataSources: planned.dataSources,
    realDataUsed,
    simulatedDataUsed,
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
  const actions: string[] = [];

  if (risk.conventionalRiskScore >= 60) {
    actions.push("Evitar rota convencional.");
  }
  if (risk.conventionalRiskScore >= 50) {
    actions.push("Redirecionar transporte público em trechos críticos.");
    actions.push("Emitir alerta preventivo à população.");
  }
  actions.push("Monitorar sensores próximos ao trajeto.");
  if (risk.safeRiskScore <= 45) {
    actions.push("Priorizar rota segura para equipes de emergência.");
  }
  actions.push(...risk.explanation.slice(0, 2));
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
