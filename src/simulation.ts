import {
  REGION_KEYS,
  RISK_LABELS,
  RISK_SCORE,
  ROUTE_AVOIDED_BLOCKS,
  ROUTE_CRITICAL_SEGMENTS,
  SATELLITES,
} from "./data";
import type { Alert, Kpis, OrbitTwinState, Region, RegionKey, RiskLevel, RouteData, RiskSummary } from "./types";
import { buildRecommendationConfidence } from "./services/riskModel";

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomItem<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function randomBars(count: number, max: number): number[] {
  return Array.from({ length: count }, () => randomInt(15, max));
}

export function riskClass(level: RiskLevel): string {
  return `risk--${level}`;
}

export function computeCityRisk(regions: Record<RegionKey, Region>): RiskSummary {
  const total = REGION_KEYS.reduce((sum, key) => sum + RISK_SCORE[regions[key].risk], 0);
  const score = Math.round(total / REGION_KEYS.length);
  let label = "Baixo";

  if (score >= 80) label = "Crítico";
  else if (score >= 60) label = "Alto";
  else if (score >= 40) label = "Médio";

  return { label, score };
}

export function countCriticalAlerts(alerts: Alert[]): number {
  return alerts.filter((alert) => alert.type === "critical").length;
}

export function parseSensorActivity(value: string): { active: number; total: number; percent: number } {
  const [active = 0, total = 1] = value.split(" / ").map((part) => Number.parseInt(part, 10));
  const safeTotal = total > 0 ? total : 1;
  return {
    active,
    total: safeTotal,
    percent: Math.round((active / safeTotal) * 100),
  };
}

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function routeRiskLabel(score: number): string {
  return `${RISK_LABELS[riskLevelFromScore(score)]} (${score}/100)`;
}

export function pickItems<T>(items: T[], count: number): T[] {
  const pool = [...items];
  const picked: T[] = [];

  while (pool.length > 0 && picked.length < count) {
    picked.push(pool.splice(randomInt(0, pool.length - 1), 1)[0]);
  }

  return picked;
}

export function buildRouteRecommendation(region: Region, route: RouteData): string {
  if (region.risk === "critical") {
    return `Risco ${RISK_LABELS[region.risk]}: ${route.recommendation} Operação deve seguir somente pela rota OrbitTwin.`;
  }

  if (region.risk === "high") {
    return `Risco ${RISK_LABELS[region.risk]}: ${route.recommendation} Priorizar rota segura para reduzir exposição.`;
  }

  if (region.risk === "medium") {
    return `Risco ${RISK_LABELS[region.risk]}: rota segura recomendada para viaturas, transporte público e deslocamentos essenciais.`;
  }

  return `Risco ${RISK_LABELS[region.risk]}: manter rota segura como contingência e seguir monitorando bloqueios IoT.`;
}

export function refreshRouteData(key: RegionKey, region: Region, route: RouteData): RouteData {
  const baseRisk = RISK_SCORE[region.risk];
  const segmentCount = region.risk === "critical" ? 3 : region.risk === "low" ? 1 : 2;
  const conventionalRisk = clamp(baseRisk + randomInt(-7, 8), 20, 98);
  const conventionalTime = clamp(route.conventionalTime + randomInt(-3, 4), 14, 42);
  const conventionalDistanceKm = Number((route.conventionalDistanceKm + randomInt(-3, 4) / 10).toFixed(1));
  const safeDistanceKm = Number((route.safeDistanceKm + randomInt(-2, 5) / 10).toFixed(1));
  const nextRoute: RouteData = {
    ...route,
    conventionalRisk,
    safeRisk: clamp(Math.round((conventionalRisk * randomInt(34, 48)) / 100), 12, 52),
    conventionalTime,
    safeTime: clamp(conventionalTime + randomInt(5, 12), conventionalTime + 2, 52),
    conventionalDistanceKm: clamp(conventionalDistanceKm, 1.4, 32),
    safeDistanceKm: clamp(safeDistanceKm, 1.8, 38),
    source: route.source === "osrm" ? "osrm" : "fallback",
    criticalSegments: pickItems(ROUTE_CRITICAL_SEGMENTS[key], segmentCount),
    avoidedBlocks: pickItems(ROUTE_AVOIDED_BLOCKS[key], Math.max(2, segmentCount)),
  };

  return {
    ...nextRoute,
    confidence: buildRecommendationConfidence(nextRoute),
  };
}

export function updateKpis(kpis: Kpis, regions: OrbitTwinState["regions"], alerts: Alert[]): Kpis {
  return {
    ...kpis,
    cityRisk: computeCityRisk(regions),
    criticalAlerts: countCriticalAlerts(alerts),
  };
}

export function simulateOrbitalReading(state: OrbitTwinState): OrbitTwinState {
  const regions = { ...state.regions };
  const routes = { ...state.routes };

  REGION_KEYS.forEach((key) => {
    const total = randomInt(12, 32);
    const active = randomInt(Math.max(8, total - 5), total);
    const risk = randomItem(["low", "medium", "high", "critical"] as const);

    regions[key] = {
      ...regions[key],
      risk,
      rain: `${randomInt(8, 58)} mm`,
      sensors: `${active} / ${total}`,
      source: `${randomItem(SATELLITES)} · ${randomItem(["NDWI", "precipitação IR", "radar SAR", "nível hídrico"])}`,
    };
    routes[key] = refreshRouteData(key, regions[key], routes[key]);
  });

  const now = new Date();
  const regionNames = REGION_KEYS.map((key) => regions[key].name);
  const alerts: Alert[] = [
    {
      type: "critical",
      time: formatTime(new Date(now.getTime() - randomInt(1, 5) * 60000)),
      region: randomItem(regionNames),
      recommendation: "Nova leitura orbital detectou anomalia hídrica. Acionar protocolo de resposta imediata.",
    },
    {
      type: randomItem(["critical", "warning"] as const),
      time: formatTime(new Date(now.getTime() - randomInt(6, 15) * 60000)),
      region: randomItem(regionNames),
      recommendation: "Correlação IA: precipitação + saturação do solo acima do limiar operacional.",
    },
    {
      type: "warning",
      time: formatTime(new Date(now.getTime() - randomInt(16, 30) * 60000)),
      region: randomItem(regionNames),
      recommendation: "Reforçar monitoramento IoT. Tendência de elevação nos sensores pluviométricos.",
    },
    {
      type: "info",
      time: formatTime(now),
      region: "Global",
      recommendation: "Passagem orbital concluída. Gêmeo digital atualizado com resolução de 10 m.",
    },
  ];

  const kpis: Kpis = {
    ...state.kpis,
    sensors: { active: randomInt(115, 132), total: 132 },
    satellites: {
      count: randomInt(3, 5),
      names: `${randomItem(SATELLITES)} · ${randomItem(SATELLITES)}`,
    },
  };

  return {
    ...state,
    lastReading: now,
    regions,
    routes,
    alerts,
    kpis: updateKpis(kpis, regions, alerts),
    spatial: {
      ndwi: { value: (Math.random() * 0.6 + 0.1).toFixed(2), unit: "índice", bars: randomBars(7, 80) },
      precipitation: { value: randomInt(15, 65), unit: "mm", bars: randomBars(7, 90) },
      surfaceTemp: { value: (Math.random() * 8 + 24).toFixed(1), unit: "°C", bars: randomBars(7, 85) },
      humidity: { value: randomInt(55, 95), unit: "%", bars: randomBars(7, 95) },
      cloudCover: { value: randomInt(30, 90), unit: "%", bars: randomBars(7, 90) },
    },
  };
}

export function simulateRouteGeneration(state: OrbitTwinState): OrbitTwinState {
  const key = state.selectedRegion;
  const currentRoute = state.routes[key];
  let nextRoute = refreshRouteData(key, state.regions[key], currentRoute);

  if (
    nextRoute.conventionalTime === currentRoute.conventionalTime &&
    nextRoute.safeTime === currentRoute.safeTime &&
    nextRoute.conventionalRisk === currentRoute.conventionalRisk &&
    nextRoute.safeRisk === currentRoute.safeRisk
  ) {
    const conventionalTime = clamp(currentRoute.conventionalTime + 1, 14, 42);
    nextRoute = {
      ...nextRoute,
      conventionalTime,
      safeTime: clamp(conventionalTime + 7, conventionalTime + 2, 52),
    };
  }

  return {
    ...state,
    routes: {
      ...state.routes,
      [key]: nextRoute,
    },
  };
}
