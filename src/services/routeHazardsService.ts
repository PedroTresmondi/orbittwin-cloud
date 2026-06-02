import type { RiskZone, RiskZoneType } from "../data/riskZones";
import type { EnvironmentalContext, GeoPoint, ScenarioKind } from "../types";
import type { RouteHazard, RouteHazardKind, RouteHazardSeverity } from "../types/routeHazard";
import { buildCriticalRouteSegments } from "../utils/routeCriticalSegments";
import {
  findCrossedZones,
  isPointInRiskZone,
  pointTouchesAnyZone,
  zoneInteriorPoint,
} from "../utils/riskGeometry";
import { isScenarioActive } from "./scenarioService";

export type BuildRouteHazardsInput = {
  conventionalPath: GeoPoint[];
  zones: RiskZone[];
  blocks: GeoPoint[];
  scenario: ScenarioKind;
  environmental?: EnvironmentalContext;
  simulatedZoneIds?: string[];
};

const RECOMMENDED_SAFE = "Evitar a rota convencional e priorizar a rota segura.";

function riskLevelToSeverity(level: RiskZone["riskLevel"]): RouteHazardSeverity {
  if (level === "critical") return "critical";
  if (level === "high") return "high";
  return "medium";
}

function zoneTypeToKind(type: RiskZoneType): RouteHazardKind {
  if (type === "landslide") return "landslide";
  if (type === "traffic_block") return "block";
  return "flood";
}

function hazardLabelForZone(zone: RiskZone): string {
  if (zone.type === "flood") return "Alagamento previsto";
  if (zone.type === "landslide") return "Risco de deslizamento";
  if (zone.type === "traffic_block") return "Bloqueio de via";
  if (zone.riskLevel === "critical") return "Trecho crítico";
  return "Área de risco";
}

export function zoneCenterLabel(zone: RiskZone): string {
  if (zone.type === "flood") return "ALAGAMENTO";
  if (zone.type === "landslide") return "ENCOSTA";
  if (zone.type === "traffic_block") return "BLOQUEIO";
  if (zone.riskLevel === "critical") return "RISCO";
  return "RISCO";
}

function sampleRoutePoints(path: GeoPoint[], maxSamples: number): GeoPoint[] {
  if (path.length <= maxSamples) return path;
  const step = Math.max(1, Math.floor(path.length / maxSamples));
  const sampled: GeoPoint[] = [];
  for (let i = 0; i < path.length; i += step) {
    sampled.push(path[i]);
  }
  const last = path[path.length - 1];
  if (sampled[sampled.length - 1] !== last) sampled.push(last);
  return sampled;
}

function dedupeHazards(hazards: RouteHazard[]): RouteHazard[] {
  const seen = new Set<string>();
  return hazards.filter((h) => {
    const key = `${h.kind}:${h.lat.toFixed(4)}:${h.lng.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildRouteHazards(input: BuildRouteHazardsInput): RouteHazard[] {
  const { conventionalPath, zones, blocks, scenario, environmental, simulatedZoneIds = [] } = input;
  const hazards: RouteHazard[] = [];
  const crossed = findCrossedZones(conventionalPath, zones);
  const crossedIds = new Set(crossed.map((z) => z.id));

  const routeSamples = sampleRoutePoints(conventionalPath, 10);
  for (const point of routeSamples) {
    const zone = zones.find((z) => isPointInRiskZone(point, z)) ?? pointTouchesAnyZone(point, zones);
    if (!zone) continue;

    const kind = zone.riskLevel === "critical" ? "critical" : zoneTypeToKind(zone.type);
    hazards.push({
      id: `route-${zone.id}-${point[0].toFixed(4)}`,
      lat: point[0],
      lng: point[1],
      kind,
      severity: riskLevelToSeverity(zone.riskLevel),
      label: hazardLabelForZone(zone),
      description: `${zone.name}: ${zone.description}`,
      recommendedAction: RECOMMENDED_SAFE,
      zoneId: zone.id,
      onRoute: true,
    });
  }

  blocks.forEach((coords, index) => {
    hazards.push({
      id: `block-${index}`,
      lat: coords[0],
      lng: coords[1],
      kind: "block",
      severity: "high",
      label: "Bloqueio de via",
      description: `Interdição operacional B${index + 1}.`,
      recommendedAction: "Evitar o ponto bloqueado e seguir a rota OrbitTwin segura.",
      onRoute: true,
    });
  });

  if (environmental?.fireHotspots?.length) {
    environmental.fireHotspots.slice(0, 3).forEach((hotspot, index) => {
      const nearRoute = conventionalPath.some(
        (p) => Math.hypot(p[0] - hotspot.lat, p[1] - hotspot.lng) < 0.035,
      );
      if (!nearRoute && !isScenarioActive(scenario)) return;

      hazards.push({
        id: `fire-${index}-${hotspot.lat.toFixed(3)}`,
        lat: hotspot.lat,
        lng: hotspot.lng,
        kind: "fire",
        severity: "high",
        label: "Foco de calor",
        description: `Queimada detectada — confiança ${hotspot.confidence ?? "—"}%.`,
        recommendedAction: RECOMMENDED_SAFE,
        onRoute: nearRoute,
      });
    });
  }

  if (scenario === "flood" || scenario === "multiple") {
    const marginal = zones.find((z) => z.id === "marginal-tiete");
    if (marginal && !hazards.some((h) => h.zoneId === marginal.id && h.onRoute)) {
      const mid = conventionalPath[Math.floor(conventionalPath.length / 2)];
      if (mid) {
        hazards.push({
          id: "scenario-flood-route",
          lat: mid[0],
          lng: mid[1],
          kind: "flood",
          severity: "critical",
          label: "Alagamento previsto",
          description: "Cenário: enchente na rota convencional.",
          recommendedAction: RECOMMENDED_SAFE,
          zoneId: marginal.id,
          onRoute: true,
        });
      }
    }
  }

  if (scenario === "landslide" || scenario === "multiple") {
    const encosta = zones.find((z) => z.id === "area-encosta");
    if (encosta && crossedIds.has(encosta.id)) {
      const [lat, lng] = zoneInteriorPoint(encosta);
      hazards.push({
        id: "scenario-landslide",
        lat,
        lng,
        kind: "landslide",
        severity: "critical",
        label: "Risco de deslizamento",
        description: "Cenário: encosta instável no trajeto.",
        recommendedAction: RECOMMENDED_SAFE,
        zoneId: encosta.id,
        onRoute: true,
      });
    }
  }

  return dedupeHazards(hazards);
}

export { buildCriticalRouteSegments };
