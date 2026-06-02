import type {
  DataFeedStatus,
  DataHubBadge,
  DataHubEntry,
  EnvironmentalContext,
  GeocodeResult,
  RouteSource,
  ScenarioKind,
  WeatherForecast,
} from "../types";
import { isFirmsApiConfigured } from "./fireService";
import { isScenarioActive } from "./scenarioService";

function statusToBadge(status: DataFeedStatus): DataHubBadge {
  switch (status) {
    case "real":
      return "Real";
    case "fallback":
      return "Fallback";
    case "simulated":
      return "Simulado";
    case "planned":
      return "Planejado";
    default:
      return "Planejado";
  }
}

function aggregateFeedStatus(statuses: DataFeedStatus[]): DataFeedStatus {
  if (statuses.includes("real")) return statuses.every((s) => s === "real") ? "real" : "fallback";
  if (statuses.includes("fallback")) return "fallback";
  if (statuses.includes("simulated")) return "simulated";
  return "planned";
}

export function buildDataHub(input: {
  weather: WeatherForecast;
  baseWeather?: WeatherForecast;
  routeSource: RouteSource;
  origin: GeocodeResult;
  destination: GeocodeResult;
  scenario: ScenarioKind;
  environmental: EnvironmentalContext;
}): DataHubEntry[] {
  const now = new Date().toISOString();
  const scenarioOn = isScenarioActive(input.scenario);

  const weatherStatus: DataFeedStatus = scenarioOn
    ? "simulated"
    : input.weather.dataStatus === "real"
      ? "real"
      : "fallback";

  const routingStatus: DataFeedStatus = input.routeSource === "osrm" ? "real" : "fallback";
  const geocodeStatus: DataFeedStatus =
    input.origin.source === "nominatim" && input.destination.source === "nominatim" ? "real" : "fallback";

  const fireStatus = input.environmental.firesFeed?.status ?? aggregateFeedStatus(input.environmental.fireHotspots.map((h) => h.status));
  const rainStatus = aggregateFeedStatus(input.environmental.rainStations.map((s) => s.status));
  const satelliteStatus = aggregateFeedStatus(input.environmental.satelliteLayers.map((l) => l.status));

  return [
    {
      id: "open-meteo",
      name: "Open-Meteo",
      type: "Clima e previsão",
      provider: "Open-Meteo",
      status: weatherStatus,
      badge: statusToBadge(weatherStatus),
      lastUpdated: input.weather.fetchedAt,
      usage: "Chuva prevista, probabilidade, temperatura, umidade e vento",
      detail: scenarioOn
        ? "Overlay de cenário simulado sobre base real quando disponível"
        : input.baseWeather?.dataStatus === "real"
          ? "Dados meteorológicos reais por coordenada"
          : "API indisponível — fallback local",
    },
    {
      id: "osm-osrm",
      name: "OpenStreetMap + OSRM",
      type: "Mapa e rotas",
      provider: "OSM / OSRM",
      status: routingStatus,
      badge: statusToBadge(routingStatus),
      lastUpdated: now,
      usage: "Tiles do mapa, rota convencional e rota segura OrbitTwin",
      detail: geocodeStatus === "real" ? "Geocodificação via Nominatim" : "Geocoding com sugestões locais SP",
    },
    {
      id: "nominatim",
      name: "Nominatim",
      type: "Geocodificação",
      provider: "OpenStreetMap",
      status: geocodeStatus,
      badge: statusToBadge(geocodeStatus),
      lastUpdated: now,
      usage: "Origem e destino em coordenadas",
    },
    {
      id: "nasa-firms",
      name: "NASA FIRMS",
      type: "Queimadas / focos de calor",
      provider: "NASA FIRMS",
      status: fireStatus,
      badge: statusToBadge(fireStatus),
      lastUpdated: input.environmental.fetchedAt,
      usage: "Focos ativos de incêndio, risco de fumaça e calor",
      detail: buildFirmsHubDetail(fireStatus, input.environmental),
    },
    {
      id: "cemaden",
      name: "CEMADEN",
      type: "Pluviômetros e estações",
      provider: "CEMADEN",
      status: rainStatus,
      badge: statusToBadge(rainStatus),
      lastUpdated: input.environmental.fetchedAt,
      usage: "Chuva observada, pluviômetros e estações hidrológicas/geotécnicas",
      detail: "Integração com mapa interativo CEMADEN planejada — dados simulados no protótipo",
    },
    {
      id: "inpe-terrabrasilis",
      name: "INPE TerraBrasilis",
      type: "Dados espaciais e ambientais",
      provider: "INPE",
      status: satelliteStatus,
      badge: statusToBadge(satelliteStatus),
      lastUpdated: input.environmental.fetchedAt,
      usage: "Camadas ambientais, uso do solo e monitoramento territorial",
      detail: "Roadmap: PRODES, DETER e camadas do gêmeo digital",
    },
    {
      id: "risk-zones",
      name: "Áreas de risco OrbitTwin",
      type: "Risco urbano",
      provider: "Gêmeo digital (protótipo)",
      status: scenarioOn ? "simulated" : "simulated",
      badge: scenarioOn ? "Simulado" : "Planejado",
      lastUpdated: now,
      usage: "Polígonos de alagamento, encosta e bloqueios para análise de rota",
      detail: "Camadas configuradas em São Paulo — evolução com dados oficiais",
    },
  ];
}

function buildFirmsHubDetail(
  fireStatus: DataFeedStatus,
  environmental: EnvironmentalContext,
): string {
  const count = environmental.fireHotspots.length;
  const feed = environmental.firesFeed;

  if (fireStatus === "real") {
    if (count > 0) return `${count} foco(s) ativos na área da rota (VIIRS, NASA FIRMS)`;
    if (feed?.apiOnline) {
      return "API NASA FIRMS online — nenhum foco ativo na área da rota (últimas 24h)";
    }
    return "Chave configurada — calcule a rota para consultar a área";
  }
  if (fireStatus === "fallback") {
    return count > 0
      ? "API indisponível — exibindo pontos demonstrativos no mapa"
      : "API NASA FIRMS indisponível — tente novamente mais tarde";
  }
  return "Configure VITE_NASA_FIRMS_MAP_KEY em .env.local e reinicie npm run dev";
}

export function getDefaultDataHub(): DataHubEntry[] {
  const firmsConfigured = isFirmsApiConfigured();
  const firmsStatus: DataFeedStatus = firmsConfigured ? "real" : "planned";

  return [
    {
      id: "open-meteo",
      name: "Open-Meteo",
      type: "Clima e previsão",
      provider: "Open-Meteo",
      status: "planned",
      badge: "Planejado",
      lastUpdated: new Date().toISOString(),
      usage: "Aguardando cálculo de rota",
    },
    {
      id: "osm-osrm",
      name: "OpenStreetMap + OSRM",
      type: "Mapa e rotas",
      provider: "OSM / OSRM",
      status: "real",
      badge: "Real",
      lastUpdated: new Date().toISOString(),
      usage: "Mapa base e motor de rotas",
    },
    {
      id: "nasa-firms",
      name: "NASA FIRMS",
      type: "Queimadas",
      provider: "NASA FIRMS",
      status: firmsStatus,
      badge: statusToBadge(firmsStatus),
      lastUpdated: new Date().toISOString(),
      usage: "Focos de calor — consulta na área ao calcular rota",
      detail: firmsConfigured
        ? "Chave configurada — calcule uma rota para carregar focos na região"
        : "Defina VITE_NASA_FIRMS_MAP_KEY em .env.local",
    },
    {
      id: "cemaden",
      name: "CEMADEN",
      type: "Pluviômetros",
      provider: "CEMADEN",
      status: "planned",
      badge: "Planejado",
      lastUpdated: new Date().toISOString(),
      usage: "Chuva observada — integração futura",
    },
    {
      id: "inpe-terrabrasilis",
      name: "INPE TerraBrasilis",
      type: "Dados espaciais",
      provider: "INPE",
      status: "planned",
      badge: "Planejado",
      lastUpdated: new Date().toISOString(),
      usage: "Camadas ambientais — roadmap",
    },
  ];
}

/** @deprecated Use getDefaultDataHub() — mantém compatibilidade */
export const DEFAULT_DATA_HUB: DataHubEntry[] = getDefaultDataHub();
