import { RISK_LABELS } from "../data";
import type { Region, RouteData } from "../types";
import { riskLevelFromScore } from "../simulation";

export function buildCitizenRouteMessage(route: RouteData): string {
  const extraMinutes = Math.max(route.safeTime - route.conventionalTime, 0);
  const highRiskAreas = countHighRiskAreas(route);
  const riskLabel = RISK_LABELS[riskLevelFromScore(route.safeRisk)];

  if (extraMinutes <= 0) {
    return `Rota segura recomendada com risco ${riskLabel.toLowerCase()}. Ela mantém tempo semelhante à rota convencional e evita ${highRiskAreas} área(s) sensível(is).`;
  }

  const minuteLabel = extraMinutes === 1 ? "1 minuto" : `${extraMinutes} minutos`;
  const areaLabel = highRiskAreas === 1 ? "1 área" : `${highRiskAreas} áreas`;

  return `Rota segura recomendada. Ela leva ${minuteLabel} a mais, mas evita ${areaLabel} com risco alto de alagamento. Nível de risco estimado: ${riskLabel.toLowerCase()}.`;
}

export function buildRecommendedActions(region: Region, route: RouteData): string[] {
  const actions = [region.recommendation, route.recommendation];

  if (route.conventionalRisk >= 70) {
    actions.push("Evitar a rota convencional até nova leitura orbital e atualização dos sensores IoT.");
  }

  if (route.safeRisk <= 35) {
    actions.push("Rota segura apta para deslocamento de equipes e fluxo essencial da população.");
  } else {
    actions.push("Manter monitoramento ativo e reavaliar trajeto a cada 30 minutos.");
  }

  return [...new Set(actions.filter(Boolean))];
}

function countHighRiskAreas(route: RouteData): number {
  const segments = route.criticalSegments.length;
  const blocks = route.avoidedBlocks.length;
  return Math.max(1, Math.min(Math.ceil((segments + blocks) / 2), 4));
}
