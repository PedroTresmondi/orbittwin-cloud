import type { GeocodeResult, PlannedRouteResult, RouteSimulationHistory, TravelProfile } from "../types";
import { PLANNER_PROFILE_LABELS } from "../types";
import { SCENARIO_LABELS } from "./scenarioService";

export function buildRouteSimulationHistory(
  planned: PlannedRouteResult,
  origin: GeocodeResult,
  destination: GeocodeResult,
  profile: TravelProfile,
  id: string,
  createdAt: string,
): RouteSimulationHistory {
  const { route, weather, risk, baseWeather, scenario, dataMode } = planned;
  const sources = buildDataSources(planned, origin, destination);

  return {
    id,
    createdAt,
    originLabel: route.origin,
    destinationLabel: route.destination,
    profile: PLANNER_PROFILE_LABELS[profile],
    scenarioType: scenario,
    dataMode,
    conventionalTimeMinutes: route.conventionalTime,
    safeTimeMinutes: route.safeTime,
    conventionalDistanceKm: route.conventionalDistanceKm,
    safeDistanceKm: route.safeDistanceKm,
    conventionalRisk: `${risk.conventionalRiskLabel} (${route.conventionalRisk}/100)`,
    safeRisk: `${risk.safeRiskLabel} (${route.safeRisk}/100)`,
    exposureReduction: risk.exposureReductionPercent,
    confidence: risk.confidence,
    recommendation: risk.recommendation,
    sources,
    realWeatherSummary: baseWeather
      ? `${baseWeather.precipitationNext2Hours} mm / ${baseWeather.precipitationProbability}% (${baseWeather.source})`
      : undefined,
    simulatedWeatherSummary:
      scenario !== "real" && scenario !== "clear"
        ? `${SCENARIO_LABELS[scenario]} — ${weather.precipitationNext2Hours} mm sim.`
        : weather.isSimulated
          ? "Clima simulado (API indisponível)"
          : undefined,
  };
}

export function buildDataSources(
  planned: PlannedRouteResult,
  origin: GeocodeResult,
  destination: GeocodeResult,
): string[] {
  const sources = new Set<string>(planned.dataSources.map((d) => `${d.provider}: ${d.status}`));

  sources.add(origin.source === "nominatim" && destination.source === "nominatim" ? "Nominatim" : "Geocoding (fallback)");
  sources.add(planned.route.source === "osrm" ? "OSRM" : "Roteamento (fallback)");
  sources.add(planned.dataMode === "real" ? "Dados reais" : planned.dataMode === "hybrid" ? "Híbrido" : "Simulado");

  if (planned.usedFallback) {
    sources.add("Modo contingência");
  }

  return [...sources];
}
