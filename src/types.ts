import type { DataHubEntry, EnvironmentalContext } from "./types/environmental";

export type {
  DataFeedStatus,
  DataHubBadge,
  DataHubEntry,
  EnvironmentalContext,
  FireHotspot,
  FiresFeedMeta,
  MapBounds,
  RainStation,
  SatelliteLayer,
  WeatherDataStatus,
} from "./types/environmental";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type RegionKey = "centro" | "oeste" | "leste" | "tiete" | "encosta" | "sul";

export type AlertType = "critical" | "warning" | "info";

export type SpatialKey = "ndwi" | "precipitation" | "surfaceTemp" | "humidity" | "cloudCover";

export type TravelProfile = "emergency" | "public_transport" | "utility" | "pedestrian" | "citizen" | "driver";

export type PlannerProfile = TravelProfile;

export type GeocodeSource = "nominatim" | "fallback";

export type Coordinate = {
  lat: number;
  lng: number;
};

export type GeocodeResult = {
  label: string;
  lat: number;
  lng: number;
  type?: string;
  importance?: number;
  source: GeocodeSource;
};

export type RouteResult = {
  path: GeoPoint[];
  distanceKm: number;
  durationMinutes: number;
  source: RouteSource;
};

export type RiskLabel = "Baixo" | "Médio" | "Alto" | "Crítico";

export type RouteRiskResult = {
  conventionalRiskScore: number;
  safeRiskScore: number;
  conventionalRiskLabel: RiskLabel;
  safeRiskLabel: RiskLabel;
  exposureReduction: number;
  exposureReductionPercent: number;
  confidence: number;
  recommendation: string;
  explanation: string[];
  crossedZones: string[];
  avoidedZoneNames?: string[];
};

export type WeatherForecast = {
  precipitationNextHour: number;
  precipitationNext2Hours: number;
  precipitationProbability: number;
  temperature: number;
  humidity: number;
  windSpeed?: number;
  source: string;
  fetchedAt: string;
  isSimulated: boolean;
  dataStatus: "real" | "fallback";
};

export type PlannedRouteResult = {
  route: RouteData;
  weather: WeatherForecast;
  /** Clima original da API antes de overlay de cenário */
  baseWeather?: WeatherForecast;
  risk: RouteRiskResult;
  usedFallback: boolean;
  warnings: string[];
  scenario: ScenarioKind;
  scenarioLabel: string;
  dataMode: DataMode;
  dataSources: DataSourceEntry[];
  dataHub: DataHubEntry[];
  environmental: EnvironmentalContext;
  /** Demonstração GS com desvio em zona crítica */
  gsDetourDemo?: boolean;
};

export type RouteSource = "osrm" | "fallback";

export type ScenarioKind =
  | "real"
  | "heavy_rain"
  | "flood"
  | "blockage"
  | "landslide"
  | "multiple"
  | "clear";

export type DataMode = "real" | "simulated" | "hybrid";

export type DataSourceStatus = "online" | "fallback" | "simulated";

export type DataSourceEntry = {
  id: "map" | "routing" | "geocoding" | "weather" | "risk";
  label: string;
  provider: string;
  status: DataSourceStatus;
  note?: string;
};

export type AppMode = "citizen" | "manager";

export type { RouteHazard, RouteHazardKind, RouteCriticalSegment, RouteHazardSeverity } from "./types/routeHazard";

export type MapLayerId =
  | "conventional"
  | "safe"
  | "riskAreas"
  | "routeAlerts"
  | "blocks"
  | "sensors"
  | "facilities"
  | "weather"
  | "rainStations"
  | "fireHotspots"
  | "satelliteLayers";

export type MapLayerVisibility = Record<MapLayerId, boolean>;

export type RiskSummary = {
  label: string;
  score: number;
};

export type RouteRiskAssessment = {
  riskScore: number;
  riskLabel: string;
  confidence: number;
  exposureReduction: number;
  explanation: string[];
};

export type Kpis = {
  cityRisk: RiskSummary;
  regions: {
    active: number;
    total: number;
  };
  sensors: {
    active: number;
    total: number;
  };
  satellites: {
    count: number;
    names: string;
  };
  criticalAlerts: number;
};

export type Region = {
  name: string;
  risk: RiskLevel;
  rain: string;
  sensors: string;
  source: string;
  recommendation: string;
};

export type SpatialMetric = {
  value: number | string;
  unit: string;
  bars: number[];
};

export type Alert = {
  type: AlertType;
  time: string;
  region: string;
  recommendation: string;
};

export type GeoPoint = [number, number];

export type MapPoi = {
  id: string;
  name: string;
  coords: GeoPoint;
  region: RegionKey;
};

export type RouteMapModel = {
  center: GeoPoint;
  originCoords: GeoPoint;
  destinationCoords: GeoPoint;
  riskArea: GeoPoint[];
  conventionalPath: GeoPoint[];
  safePath: GeoPoint[];
  blocks: GeoPoint[];
  simulatedZoneIds?: string[];
  hazards?: import("./types/routeHazard").RouteHazard[];
  criticalSegments?: import("./types/routeHazard").RouteCriticalSegment[];
};

export type RouteData = {
  originPlaceId: string;
  destinationPlaceId: string;
  origin: string;
  destination: string;
  conventionalTime: number;
  safeTime: number;
  conventionalRisk: number;
  safeRisk: number;
  conventionalDistanceKm: number;
  safeDistanceKm: number;
  confidence: number;
  source: RouteSource;
  criticalSegments: string[];
  avoidedBlocks: string[];
  recommendation: string;
  map: RouteMapModel;
  conventionalAssessment?: RouteRiskAssessment;
  safeAssessment?: RouteRiskAssessment;
};

export type OperationalPlace = {
  id: string;
  name: string;
  region: RegionKey;
  coords: GeoPoint;
};

export type RouteInputs = {
  originId: string;
  destinationId: string;
  profile: TravelProfile;
};

export type RouteExposure = {
  score: number;
  pointsInsideRiskArea: number;
  nearBlocks: number;
  minBlockDistanceMeters: number | null;
  distanceInsideRiskKm: number;
};

export type RouteEngineResult = {
  route: RouteData;
  usedFallback: boolean;
  error?: string;
};

export type RouteSimulationHistory = {
  id: string;
  createdAt: string;
  originLabel: string;
  destinationLabel: string;
  profile: string;
  scenarioType: ScenarioKind;
  dataMode: DataMode;
  conventionalTimeMinutes: number;
  safeTimeMinutes: number;
  conventionalDistanceKm: number;
  safeDistanceKm: number;
  conventionalRisk: string;
  safeRisk: string;
  exposureReduction: number;
  confidence: number;
  recommendation: string;
  sources: string[];
  realWeatherSummary?: string;
  simulatedWeatherSummary?: string;
};

export type OperationalEvent = {
  id: string;
  timestamp: string;
  region: string;
  origin: string;
  destination: string;
  profile: TravelProfile;
  source: RouteSource;
  conventionalRisk: number;
  safeRisk: number;
  conventionalTime: number;
  safeTime: number;
  conventionalDistanceKm: number;
  safeDistanceKm: number;
  exposureReduction: number;
  finalRecommendation: string;
  riskReduction: number;
  confidence: number;
  weatherSource: string;
  geocodeSource: string;
  sources: string[];
  simulation?: RouteSimulationHistory;
  plannerSnapshot?: PlannedRouteResult;
};

export type SimulationReport = {
  generatedAt: string;
  origin: string;
  destination: string;
  profile: TravelProfile;
  scenario: ScenarioKind;
  scenarioLabel: string;
  dataMode: DataMode;
  dataSources: DataSourceEntry[];
  realDataUsed: string[];
  simulatedDataUsed: string[];
  region: string;
  recommendedRoute: string;
  conventionalRisk: number;
  safeRisk: number;
  conventionalTime: number;
  safeTime: number;
  timeDifferenceMinutes: number;
  riskReduction: number;
  exposureReductionPercent: number;
  confidence: number;
  source: RouteSource;
  citizenMessage: string;
  justifications: string[];
  recommendedActions: string[];
  weather: WeatherForecast;
  crossedZones: string[];
};

export type OrbitTwinState = {
  lastReading: Date;
  selectedRegion: RegionKey;
  kpis: Kpis;
  regions: Record<RegionKey, Region>;
  routes: Record<RegionKey, RouteData>;
  spatial: Record<SpatialKey, SpatialMetric>;
  alerts: Alert[];
};

export const DEFAULT_MAP_LAYERS: MapLayerVisibility = {
  conventional: true,
  safe: true,
  riskAreas: true,
  routeAlerts: true,
  blocks: true,
  sensors: true,
  facilities: true,
  weather: true,
  rainStations: false,
  fireHotspots: false,
  satelliteLayers: false,
};

/** Modo Cidadão — menos camadas por padrão */
export const CITIZEN_MAP_LAYERS: MapLayerVisibility = {
  conventional: true,
  safe: true,
  riskAreas: true,
  routeAlerts: true,
  blocks: false,
  sensors: false,
  facilities: false,
  weather: false,
  rainStations: false,
  fireHotspots: false,
  satelliteLayers: false,
};

/** Modo Gestor — visão operacional completa */
export const MANAGER_MAP_LAYERS: MapLayerVisibility = {
  conventional: true,
  safe: true,
  riskAreas: true,
  routeAlerts: true,
  blocks: true,
  sensors: true,
  facilities: true,
  weather: true,
  rainStations: true,
  fireHotspots: true,
  satelliteLayers: false,
};

export const PLANNER_PROFILE_LABELS: Record<PlannerProfile, string> = {
  citizen: "Cidadão",
  pedestrian: "Pedestre",
  driver: "Motorista",
  public_transport: "Transporte público",
  utility: "Defesa Civil",
  emergency: "Ambulância / Emergência",
};
