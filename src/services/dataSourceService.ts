import type { DataSourceEntry, DataSourceStatus, GeocodeResult, ScenarioKind, WeatherForecast } from "../types";
import { isScenarioActive } from "./scenarioService";

export function buildDataSourceStatuses(input: {
  origin: GeocodeResult;
  destination: GeocodeResult;
  routeSource: "osrm" | "fallback";
  weather: WeatherForecast;
  scenario: ScenarioKind;
}): DataSourceEntry[] {
  const routingStatus: DataSourceStatus =
    input.routeSource === "osrm" ? "online" : "fallback";

  const geocodeStatus: DataSourceStatus =
    input.origin.source === "nominatim" && input.destination.source === "nominatim"
      ? "online"
      : "fallback";

  const weatherStatus: DataSourceStatus = input.weather.isSimulated
    ? "simulated"
    : isScenarioActive(input.scenario)
      ? "simulated"
      : "online";

  const riskStatus: DataSourceStatus = isScenarioActive(input.scenario) ? "simulated" : "simulated";

  return [
    {
      id: "map",
      label: "Mapa",
      provider: "OpenStreetMap",
      status: "online",
    },
    {
      id: "routing",
      label: "Rotas",
      provider: "OSRM",
      status: routingStatus,
      note: routingStatus === "fallback" ? "Rota estimada local" : undefined,
    },
    {
      id: "geocoding",
      label: "Geocodificação",
      provider: "Nominatim",
      status: geocodeStatus,
      note: geocodeStatus === "fallback" ? "Sugestões locais de SP" : undefined,
    },
    {
      id: "weather",
      label: "Clima",
      provider: "Open-Meteo",
      status: weatherStatus,
      note:
        weatherStatus === "simulated"
          ? isScenarioActive(input.scenario)
            ? "Cenário climático simulado"
            : "Modo simulado"
          : undefined,
    },
    {
      id: "risk",
      label: "Risco urbano",
      provider: "Camadas do gêmeo digital",
      status: riskStatus,
      note: "Áreas configuradas no protótipo para demonstração",
    },
  ];
}

export const PENDING_DATA_SOURCES: DataSourceEntry[] = [
  { id: "map", label: "Mapa", provider: "OpenStreetMap", status: "online" },
  { id: "routing", label: "Rotas", provider: "OSRM", status: "online", note: "Aguardando cálculo" },
  { id: "geocoding", label: "Geocodificação", provider: "Nominatim", status: "online", note: "Aguardando endereços" },
  { id: "weather", label: "Clima", provider: "Open-Meteo", status: "online", note: "Aguardando rota" },
  {
    id: "risk",
    label: "Risco urbano",
    provider: "Camadas do gêmeo digital",
    status: "simulated",
    note: "Protótipo — áreas configuradas para demonstração",
  },
];

export function hasFallbackSource(sources: DataSourceEntry[]): boolean {
  return sources.some((s) => s.status === "fallback" || s.status === "simulated");
}

export function formatSourceStatus(status: DataSourceStatus): string {
  switch (status) {
    case "online":
      return "Online";
    case "fallback":
      return "Usando fallback";
    case "simulated":
      return "Simulado";
    default:
      return status;
  }
}
