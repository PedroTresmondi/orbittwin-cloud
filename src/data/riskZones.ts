import type { GeoPoint, RiskLevel, RegionKey } from "../types";

export type RiskZoneType = "flood" | "traffic_block" | "landslide";

export type RiskZone = {
  id: string;
  name: string;
  regionKey: RegionKey;
  riskLevel: RiskLevel;
  type: RiskZoneType;
  polygon: GeoPoint[];
  description: string;
  updatedAt: string;
};

export const RISK_ZONE_COLORS: Record<RiskLevel, { stroke: string; fill: string }> = {
  low: { stroke: "#22c55e", fill: "#22c55e" },
  medium: { stroke: "#eab308", fill: "#eab308" },
  high: { stroke: "#f97316", fill: "#f97316" },
  critical: { stroke: "#ef4444", fill: "#ef4444" },
};

export const RISK_ZONES: RiskZone[] = [
  {
    id: "marginal-tiete",
    name: "Marginal Tietê",
    regionKey: "tiete",
    riskLevel: "critical",
    type: "flood",
    description: "Risco crítico de alagamento junto ao rio e pistas expressas.",
    updatedAt: "2026-06-01T12:00:00Z",
    polygon: [
      [-23.5188, -46.6625],
      [-23.515, -46.7068],
      [-23.5356, -46.716],
      [-23.5382, -46.6768],
    ],
  },
  {
    id: "centro-expandido",
    name: "Centro Expandido",
    regionKey: "centro",
    riskLevel: "high",
    type: "flood",
    description: "Baixadas centrais com drenagem saturada em eventos de chuva intensa.",
    updatedAt: "2026-06-01T12:00:00Z",
    polygon: [
      [-23.5486, -46.6445],
      [-23.5462, -46.6545],
      [-23.5548, -46.6598],
      [-23.5591, -46.6501],
    ],
  },
  {
    id: "baixada-glicerio",
    name: "Baixada do Glicério",
    regionKey: "centro",
    riskLevel: "high",
    type: "flood",
    description: "Área baixa com histórico de acúmulo hídrico rápido.",
    updatedAt: "2026-06-01T12:00:00Z",
    polygon: [
      [-23.543, -46.634],
      [-23.541, -46.642],
      [-23.548, -46.645],
      [-23.551, -46.636],
    ],
  },
  {
    id: "zona-leste",
    name: "Zona Leste",
    regionKey: "leste",
    riskLevel: "high",
    type: "flood",
    description: "Áreas ribeirinhas com risco elevado de transbordamento.",
    updatedAt: "2026-06-01T12:00:00Z",
    polygon: [
      [-23.5328, -46.5066],
      [-23.532, -46.545],
      [-23.5482, -46.5548],
      [-23.5508, -46.515],
    ],
  },
  {
    id: "area-encosta",
    name: "Área de Encosta",
    regionKey: "encosta",
    riskLevel: "high",
    type: "landslide",
    description: "Taludes saturados com risco de deslizamento.",
    updatedAt: "2026-06-01T12:00:00Z",
    polygon: [
      [-23.4495, -46.6328],
      [-23.4388, -46.6335],
      [-23.4332, -46.6204],
      [-23.445, -46.6148],
    ],
  },
  {
    id: "zona-sul",
    name: "Zona Sul",
    regionKey: "sul",
    riskLevel: "medium",
    type: "flood",
    description: "Pontos de alagamento recorrente próximos a córregos canalizados.",
    updatedAt: "2026-06-01T12:00:00Z",
    polygon: [
      [-23.724, -46.6905],
      [-23.715, -46.6908],
      [-23.7108, -46.701],
      [-23.7226, -46.7042],
    ],
  },
  {
    id: "zona-oeste",
    name: "Zona Oeste",
    regionKey: "oeste",
    riskLevel: "medium",
    type: "flood",
    description: "Corredores de várzea com monitoramento pluviométrico ativo.",
    updatedAt: "2026-06-01T12:00:00Z",
    polygon: [
      [-23.5538, -46.7115],
      [-23.5445, -46.7078],
      [-23.5336, -46.7227],
      [-23.5425, -46.7315],
    ],
  },
  {
    id: "pinheiros",
    name: "Pinheiros",
    regionKey: "oeste",
    riskLevel: "medium",
    type: "flood",
    description: "Várzea do Pinheiros com pontos de alagamento em chuvas fortes.",
    updatedAt: "2026-06-01T12:00:00Z",
    polygon: [
      [-23.558, -46.688],
      [-23.552, -46.695],
      [-23.565, -46.702],
      [-23.571, -46.692],
    ],
  },
  {
    id: "santo-amaro",
    name: "Santo Amaro",
    regionKey: "sul",
    riskLevel: "medium",
    type: "flood",
    description: "Corredor sul com drenagem limitada próximo à estação e vias expressas.",
    updatedAt: "2026-06-01T12:00:00Z",
    polygon: [
      [-23.648, -46.708],
      [-23.642, -46.718],
      [-23.658, -46.722],
      [-23.662, -46.712],
    ],
  },
];

export function getRiskZonesForRegion(regionKey: RegionKey): RiskZone[] {
  return RISK_ZONES.filter((zone) => zone.regionKey === regionKey);
}

export function getAllRiskPolygons(): GeoPoint[][] {
  return RISK_ZONES.map((zone) => zone.polygon);
}
