import type { DataMode, RiskLevel, ScenarioKind } from "../types";

export type DashboardDataMode = DataMode | "fallback";

export type MainThreat = "flood" | "landslide" | "fire" | "traffic_block";

export type CriticalRegion = {
  id: string;
  name: string;
  riskScore: number;
  riskLevel: RiskLevel;
  mainThreat: MainThreat;
  source: DashboardDataMode;
};

export type AlertItem = {
  id: string;
  title: string;
  region: string;
  severity: RiskLevel;
  time: string;
  source: DashboardDataMode;
  action: string;
};

export type DecisionRecommendationData = {
  scenario: string;
  analysis: string;
  action: string;
  confidence: number;
  source: DashboardDataMode;
  explanation: string[];
};

export type DecisionKpi = {
  id: string;
  label: string;
  value: string;
  source: DashboardDataMode;
};

export type DecisionStatusBadge = {
  text: string;
  variant: "live" | "simulation" | "hybrid" | "fallback";
};

export type DashboardDataSourceChip = {
  name: string;
  mode: DashboardDataMode;
};

export type UrbanRiskMapZone = {
  id: string;
  name: string;
  shortName: string;
  riskLevel: RiskLevel;
  highlight: boolean;
};

export type DecisionDashboardSnapshot = {
  statusBadge: DecisionStatusBadge;
  kpis: DecisionKpi[];
  criticalRegions: CriticalRegion[];
  alerts: AlertItem[];
  recommendation: DecisionRecommendationData;
  dataSources: DashboardDataSourceChip[];
  mapZones: UrbanRiskMapZone[];
  mapMarkers: {
    id: string;
    label: string;
    type: "sensor" | "station" | "fire" | "block";
    zoneId: string;
  }[];
  updatedAt: string;
};

export type BuildDecisionDashboardInput = {
  planned: import("../types").PlannedRouteResult | null;
  activeScenario: ScenarioKind;
};
