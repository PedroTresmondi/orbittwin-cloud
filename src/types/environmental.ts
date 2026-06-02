/** Status de integração de uma fonte de dados ambiental */
export type DataFeedStatus = "real" | "fallback" | "simulated" | "planned";

export type DataHubBadge = "Real" | "Fallback" | "Simulado" | "Planejado";

export type DataHubEntry = {
  id: string;
  name: string;
  type: string;
  provider: string;
  status: DataFeedStatus;
  badge: DataHubBadge;
  lastUpdated: string;
  usage: string;
  detail?: string;
};

export type WeatherDataStatus = "real" | "fallback";

export type FireHotspot = {
  id: string;
  lat: number;
  lng: number;
  brightness?: number;
  confidence?: number;
  detectedAt?: string;
  source: "NASA FIRMS" | "fallback";
  status: DataFeedStatus;
};

export type RainStation = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  rain1h?: number;
  rain24h?: number;
  stationType: "pluviometer" | "hydrological" | "geotechnical";
  source: "CEMADEN" | "fallback";
  status: DataFeedStatus;
};

export type SatelliteLayer = {
  id: string;
  name: string;
  type: "vegetation" | "flood_index" | "land_use" | "risk_area";
  source: "INPE TerraBrasilis" | "fallback";
  status: DataFeedStatus;
  description: string;
  updatedAt: string;
};

export type MapBounds = {
  south: number;
  west: number;
  north: number;
  east: number;
};

/** Status da consulta NASA FIRMS (independente de haver focos no mapa) */
export type FiresFeedMeta = {
  status: DataFeedStatus;
  apiConfigured: boolean;
  /** API respondeu com sucesso na última consulta */
  apiOnline?: boolean;
};

export type EnvironmentalContext = {
  fireHotspots: FireHotspot[];
  /** Status da fonte FIRMS — evita “Planejado” quando a API está ok mas sem focos na área */
  firesFeed: FiresFeedMeta;
  rainStations: RainStation[];
  satelliteLayers: SatelliteLayer[];
  fetchedAt: string;
};
