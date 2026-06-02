export type RiskLevel = "low" | "medium" | "high" | "critical";

export type RegionKey = "centro" | "oeste" | "leste" | "tiete" | "encosta" | "sul";

export type AlertType = "critical" | "warning" | "info";

export type SpatialKey = "ndwi" | "precipitation" | "surfaceTemp" | "humidity" | "cloudCover";

export type TravelProfile = "emergency" | "public_transport" | "utility" | "pedestrian";

export type RouteSource = "osrm" | "fallback";

export type RiskSummary = {
  label: string;
  score: number;
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

export type RouteMapModel = {
  center: GeoPoint;
  originCoords: GeoPoint;
  destinationCoords: GeoPoint;
  riskArea: GeoPoint[];
  conventionalPath: GeoPoint[];
  safePath: GeoPoint[];
  blocks: GeoPoint[];
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
};

export type RouteEngineResult = {
  route: RouteData;
  usedFallback: boolean;
  error?: string;
};

export type OperationalEvent = {
  id: string;
  timestamp: string;
  region: string;
  origin: string;
  destination: string;
  profile: TravelProfile;
  source: RouteSource;
  decision: string;
  riskReduction: number;
  confidence: number;
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
