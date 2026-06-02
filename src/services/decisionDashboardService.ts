import { RISK_SCORE, SENSOR_POIS } from "../data";
import { RISK_ZONES, type RiskZone } from "../data/riskZones";
import type {
  AlertItem,
  BuildDecisionDashboardInput,
  CriticalRegion,
  DashboardDataMode,
  DashboardDataSourceChip,
  DecisionDashboardSnapshot,
  DecisionKpi,
  DecisionRecommendationData,
  DecisionStatusBadge,
  MainThreat,
  UrbanRiskMapZone,
} from "../types/decisionDashboard";
import type { PlannedRouteResult, RiskLevel, ScenarioKind } from "../types";
import { applyScenarioToZones, isScenarioActive, SCENARIO_LABELS } from "./scenarioService";

const REGION_DISPLAY: Record<string, string> = {
  "marginal-tiete": "Marginal Tietê",
  "centro-expandido": "Centro Expandido",
  "baixada-glicerio": "Baixada do Glicério",
  "zona-leste": "Zona Leste",
  "area-encosta": "Área de Encosta",
  "zona-sul": "Zona Sul",
  "zona-oeste": "Zona Oeste",
  pinheiros: "Pinheiros",
  "santo-amaro": "Santo Amaro",
};

export function buildDecisionDashboard(input: BuildDecisionDashboardInput): DecisionDashboardSnapshot {
  const scenario = input.planned?.scenario ?? input.activeScenario;
  const scenarioActive = isScenarioActive(scenario);
  const zones = applyScenarioToZones(RISK_ZONES, scenario === "clear" ? "real" : scenario);
  const dataMode = resolveDashboardMode(input.planned, scenarioActive);
  const weather = input.planned?.weather;
  const risk = input.planned?.risk;

  const criticalRegions = buildCriticalRegions(zones, weather?.precipitationProbability ?? 40, dataMode);
  const kpis = buildKpis(zones, criticalRegions, weather, risk, scenarioActive, dataMode);
  const alerts = buildAlerts(zones, scenario, input.planned, dataMode);
  const recommendation = buildRecommendation(input.planned, scenario, dataMode);
  const statusBadge = buildStatusBadge(scenario, dataMode, scenarioActive);
  const dataSources = buildDataSourceChips(input.planned, dataMode);
  const mapZones = buildMapZones(zones, input.planned);
  const mapMarkers = buildMapMarkers(input.planned, scenarioActive);

  return {
    statusBadge,
    kpis,
    criticalRegions,
    alerts,
    recommendation,
    dataSources,
    mapZones,
    mapMarkers,
    updatedAt: new Date().toISOString(),
  };
}

function resolveDashboardMode(planned: PlannedRouteResult | null, scenarioActive: boolean): DashboardDataMode {
  if (!planned) return "simulated";
  if (planned.dataMode === "hybrid" || (scenarioActive && planned.weather.dataStatus === "real")) return "hybrid";
  if (planned.dataMode === "simulated" || scenarioActive) return "simulated";
  if (planned.usedFallback || planned.weather.dataStatus === "fallback") return "fallback";
  return "real";
}

function buildStatusBadge(
  scenario: ScenarioKind,
  dataMode: DashboardDataMode,
  scenarioActive: boolean,
): DecisionStatusBadge {
  if (scenarioActive) {
    const labels: Partial<Record<ScenarioKind, string>> = {
      heavy_rain: "SIMULAÇÃO: Chuva forte",
      flood: "SIMULAÇÃO: Enchente ativa",
      blockage: "SIMULAÇÃO: Bloqueio de vias",
      landslide: "SIMULAÇÃO: Deslizamento",
      multiple: "SIMULAÇÃO: Múltiplos riscos",
    };
    return { text: labels[scenario] ?? "SIMULAÇÃO: Cenário ativo", variant: "simulation" };
  }
  if (dataMode === "hybrid") return { text: "HÍBRIDO: Clima real + risco simulado", variant: "hybrid" };
  if (dataMode === "fallback") return { text: "FALLBACK: Dados simulados", variant: "fallback" };
  if (dataMode === "real") return { text: "LIVE: Monitoramento ativo", variant: "live" };
  return { text: "LIVE: Monitoramento ativo", variant: "live" };
}

function buildKpis(
  zones: RiskZone[],
  criticalRegions: CriticalRegion[],
  weather: PlannedRouteResult["weather"] | undefined,
  risk: PlannedRouteResult["risk"] | undefined,
  scenarioActive: boolean,
  dataMode: DashboardDataMode,
): DecisionKpi[] {
  const atRisk = zones.filter((z) => z.riskLevel === "high" || z.riskLevel === "critical").length;
  const floodProb = Math.min(
    98,
    Math.round(
      (weather?.precipitationProbability ?? 45) +
        (scenarioActive ? 25 : 0) +
        (weather?.precipitationNext2Hours ?? 0) * 2,
    ),
  );
  const sensorsActive = Math.min(SENSOR_POIS.length, Math.round(SENSOR_POIS.length * (scenarioActive ? 0.95 : 0.88)));
  const popBase = 8.2;
  const popK = (popBase + atRisk * 0.9 + (scenarioActive ? 2.5 : 0)).toFixed(1);
  const responseMin = risk
    ? Math.max(8, Math.round(10 + (risk.conventionalRiskScore - risk.safeRiskScore) * 0.15))
    : 12;

  return [
    { id: "regions", label: "Regiões em risco", value: String(atRisk), source: scenarioActive ? "hybrid" : "simulated" },
    { id: "flood", label: "Probabilidade de alagamento", value: `${floodProb}%`, source: weather?.dataStatus === "real" ? "hybrid" : dataMode },
    { id: "sensors", label: "Sensores IoT ativos", value: String(sensorsActive), source: "simulated" },
    { id: "population", label: "População impactada", value: `${popK}k`, source: "simulated" },
    { id: "response", label: "Tempo estimado de resposta", value: `${responseMin} min`, source: risk ? dataMode : "simulated" },
  ];
}

function buildCriticalRegions(
  zones: RiskZone[],
  rainProbability: number,
  dataMode: DashboardDataMode,
): CriticalRegion[] {
  return [...zones]
    .map((zone) => {
      let score = RISK_SCORE[zone.riskLevel];
      if (rainProbability > 60 && zone.type === "flood") score = Math.min(98, score + 8);
      return {
        id: zone.id,
        name: REGION_DISPLAY[zone.id] ?? zone.name,
        riskScore: score,
        riskLevel: scoreToLevel(score),
        mainThreat: zoneTypeToThreat(zone.type),
        source: dataMode,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 8);
}

function buildAlerts(
  zones: RiskZone[],
  scenario: ScenarioKind,
  planned: PlannedRouteResult | null,
  dataMode: DashboardDataMode,
): AlertItem[] {
  const now = new Date();
  const time = (offsetMin: number) =>
    new Date(now.getTime() - offsetMin * 60_000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const alerts: AlertItem[] = [];

  if (scenario === "flood" || scenario === "multiple") {
    alerts.push({
      id: "a-flood-centro",
      title: "Alagamento",
      region: "Centro",
      severity: "critical",
      time: time(8),
      source: "hybrid",
      action: "Emitir alerta preventivo e priorizar rota segura",
    });
  }

  if (scenario === "blockage" || scenario === "multiple") {
    alerts.push({
      id: "a-block-sul",
      title: "Vias bloqueadas",
      region: "Zona Sul",
      severity: "high",
      time: time(15),
      source: "simulated",
      action: "Redirecionar rotas e transporte público",
    });
  }

  const tiete = zones.find((z) => z.id === "marginal-tiete");
  if (tiete && (tiete.riskLevel === "critical" || tiete.riskLevel === "high")) {
    alerts.push({
      id: "a-tiete",
      title: "Risco alto",
      region: "Marginal Tietê",
      severity: tiete.riskLevel === "critical" ? "critical" : "high",
      time: time(22),
      source: dataMode,
      action: "Evitar rota convencional no corredor marginal",
    });
  }

  if (scenario === "heavy_rain") {
    alerts.push({
      id: "a-rain",
      title: "Chuva intensa prevista",
      region: "Grande SP",
      severity: "high",
      time: time(5),
      source: planned?.weather.dataStatus === "real" ? "real" : "simulated",
      action: "Monitorar pluviômetros e reforçar drenagem",
    });
  }

  if (scenario === "landslide" || scenario === "multiple") {
    alerts.push({
      id: "a-slide",
      title: "Risco de deslizamento",
      region: "Área de Encosta",
      severity: "critical",
      time: time(12),
      source: "simulated",
      action: "Restringir acesso a taludes saturados",
    });
  }

  alerts.push({
    id: "a-vila",
    title: "Atenção operacional",
    region: "Vila Nova / Zona Leste",
    severity: "medium",
    time: time(35),
    source: "simulated",
    action: "Monitorar sensores próximos",
  });

  if (planned && planned.risk.conventionalRiskScore >= 55) {
    alerts.unshift({
      id: "a-route",
      title: "Rota convencional em risco",
      region: planned.route.origin.split(",")[0] ?? "Trajeto",
      severity: planned.risk.conventionalRiskScore >= 75 ? "critical" : "high",
      time: time(2),
      source: dataMode,
      action: "Priorizar rota OrbitTwin segura",
    });
  }

  return alerts.slice(0, 6);
}

function buildRecommendation(
  planned: PlannedRouteResult | null,
  scenario: ScenarioKind,
  dataMode: DashboardDataMode,
): DecisionRecommendationData {
  const scenarioLabel = SCENARIO_LABELS[scenario === "clear" ? "real" : scenario];

  if (!planned) {
    return {
      scenario: "Monitoramento urbano (baseline)",
      analysis: "Painel em modo demonstração com áreas de risco configuradas para São Paulo.",
      action: "Calcule uma rota para vincular clima real, OSRM e recomendação contextual.",
      confidence: 72,
      source: "simulated",
      explanation: ["Dados de zonas e sensores são simulados para o protótipo."],
    };
  }

  const { risk, weather, route } = planned;
  const blocks = route.map?.blocks?.length ?? 0;
  const scenarioActive = isScenarioActive(scenario);

  let analysis = `Rota convencional com risco ${risk.conventionalRiskLabel} (${risk.conventionalRiskScore}/100).`;
  if (risk.crossedZones.length) {
    analysis += ` Cruza: ${risk.crossedZones.slice(0, 2).join(", ")}.`;
  }
  if (blocks > 0) analysis += ` ${blocks} bloqueio(s) previsto(s) no trajeto.`;

  let action = risk.recommendation;
  if (risk.conventionalRiskScore >= 50) {
    action = "Priorizar rota segura e emitir alerta preventivo à população nas áreas críticas.";
  }

  const explanation: string[] = [];
  if (scenarioActive) {
    explanation.push(`Simulação ativa: ${scenarioLabel}.`);
  }
  if (weather.dataStatus === "real" && !weather.isSimulated) {
    explanation.push(
      `Dados meteorológicos reais: chuva prevista ${weather.precipitationNext2Hours} mm (prob. ${weather.precipitationProbability}%).`,
    );
  }
  if (planned.route.source === "osrm") {
    explanation.push("Rotas calculadas via OSRM/OpenStreetMap.");
  }
  explanation.push(...risk.explanation.slice(0, 2));

  return {
    scenario: scenarioActive ? `${scenarioLabel} + ${dataMode === "hybrid" ? "clima real" : "análise híbrida"}` : scenarioLabel,
    analysis,
    action,
    confidence: risk.confidence,
    source: dataMode,
    explanation,
  };
}

function buildDataSourceChips(planned: PlannedRouteResult | null, dataMode: DashboardDataMode): DashboardDataSourceChip[] {
  const chips: DashboardDataSourceChip[] = [
    { name: "Open-Meteo", mode: planned?.weather.dataStatus === "real" ? "real" : "fallback" },
    { name: "OSRM", mode: planned?.route.source === "osrm" ? "real" : "fallback" },
    { name: "Áreas de risco", mode: "simulated" },
    { name: "Sensores IoT", mode: "simulated" },
    { name: "Alertas", mode: dataMode === "real" ? "real" : dataMode },
  ];
  if (planned?.environmental.firesFeed?.apiConfigured) {
    chips.push({
      name: "NASA FIRMS",
      mode: planned.environmental.firesFeed.status === "real" ? "real" : "fallback",
    });
  }
  return chips;
}

function buildMapZones(zones: RiskZone[], planned: PlannedRouteResult | null): UrbanRiskMapZone[] {
  const crossed = new Set(planned?.risk.crossedZones ?? []);
  return zones.map((zone) => ({
    id: zone.id,
    name: zone.name,
    shortName: (REGION_DISPLAY[zone.id] ?? zone.name).split(" ")[0] ?? zone.name,
    riskLevel: zone.riskLevel,
    highlight: crossed.has(zone.name) || zone.riskLevel === "critical",
  }));
}

function buildMapMarkers(
  planned: PlannedRouteResult | null,
  scenarioActive: boolean,
): DecisionDashboardSnapshot["mapMarkers"] {
  const markers: DecisionDashboardSnapshot["mapMarkers"] = SENSOR_POIS.slice(0, 5).map((s) => ({
    id: s.id,
    label: s.name,
    type: "sensor" as const,
  }));

  if (planned?.environmental.rainStations.length) {
    planned.environmental.rainStations.slice(0, 2).forEach((st) => {
      markers.push({ id: st.id, label: st.name, type: "station" });
    });
  }

  if (planned?.environmental.fireHotspots.length) {
    planned.environmental.fireHotspots.slice(0, 2).forEach((h) => {
      markers.push({ id: h.id, label: "Foco de calor", type: "fire" });
    });
  }

  if (scenarioActive) {
    markers.push({ id: "block-1", label: "Bloqueio simulado", type: "block" });
  }

  return markers.slice(0, 10);
}

function scoreToLevel(score: number): RiskLevel {
  if (score >= 76) return "critical";
  if (score >= 56) return "high";
  if (score >= 36) return "medium";
  return "low";
}

function zoneTypeToThreat(type: RiskZone["type"]): MainThreat {
  if (type === "landslide") return "landslide";
  if (type === "traffic_block") return "traffic_block";
  return "flood";
}
