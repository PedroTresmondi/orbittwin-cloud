import { RISK_LABELS, RISK_SCORE } from "../data";
import { RISK_ZONES, type RiskZone } from "../data/riskZones";
import type {
  GeoPoint,
  Region,
  RouteExposure,
  RouteRiskAssessment,
  RouteRiskResult,
  RiskLabel,
  TravelProfile,
  WeatherForecast,
} from "../types";
import { findCrossedZones } from "../utils/riskGeometry";
import { buildRecommendationConfidence, calculateRouteExposure } from "./riskModel";

export type CalculateRouteRiskInput = {
  path: GeoPoint[];
  riskArea: GeoPoint[];
  blocks: GeoPoint[];
  region: Region;
  profile: TravelProfile;
  rainForecastMm?: number;
  comparePath?: GeoPoint[];
  compareExposure?: RouteExposure;
};

export function compareRouteRisks(input: {
  conventionalPath: GeoPoint[];
  safePath: GeoPoint[];
  zones: RiskZone[];
  blocks: GeoPoint[];
  profile: TravelProfile;
  weather: WeatherForecast;
  region: Region;
  safeExtraMinutes: number;
}): RouteRiskResult {
  const rainMm = input.weather.precipitationNext2Hours;
  const allPolygons = input.zones.flatMap((z) => z.polygon);
  const conventionalCrossed = findCrossedZones(input.conventionalPath, input.zones);
  const safeCrossed = findCrossedZones(input.safePath, input.zones);

  const conventionalExposure = calculateRouteExposure(
    input.conventionalPath,
    allPolygons,
    input.blocks,
    input.region,
    normalizeProfile(input.profile),
  );
  const safeExposure = calculateRouteExposure(
    input.safePath,
    allPolygons,
    input.blocks,
    input.region,
    normalizeProfile(input.profile),
  );

  const conventionalRiskScore = scoreFromExposure(conventionalExposure, input.region, rainMm, input.weather.precipitationProbability, input.profile);
  let safeRiskScore = scoreFromExposure(safeExposure, input.region, rainMm * 0.85, input.weather.precipitationProbability, input.profile);
  safeRiskScore = Math.min(safeRiskScore, conventionalRiskScore - 1);

  const exposureReduction = Math.max(conventionalRiskScore - safeRiskScore, 0);
  const exposureReductionPercent =
    conventionalRiskScore > 0 ? Math.round((exposureReduction / conventionalRiskScore) * 100) : 0;

  const confidence = clamp(
    Math.round(
      62 +
        exposureReductionPercent * 0.35 -
        input.safeExtraMinutes * 0.8 +
        (input.profile === "emergency" ? 5 : 0),
    ),
    35,
    96,
  );

  const explanation: string[] = [];

  if (input.weather.precipitationNext2Hours >= 5) {
    explanation.push(
      `Previsão de chuva elevada nas próximas 2 horas (${input.weather.precipitationNext2Hours} mm, probabilidade ${input.weather.precipitationProbability}%).`,
    );
  } else {
    explanation.push(`Chuva prevista moderada nas próximas 2 horas (${input.weather.precipitationNext2Hours} mm).`);
  }

  if (conventionalCrossed.length > 0) {
    explanation.push(
      `A rota convencional cruza ou passa perto de: ${conventionalCrossed.map((z) => z.name).join(", ")}.`,
    );
  } else {
    explanation.push("A rota convencional não cruza áreas críticas mapeadas.");
  }

  if (conventionalExposure.nearBlocks > 0) {
    explanation.push(`Foram identificados ${conventionalExposure.nearBlocks} ponto(s) de bloqueio próximos ao trajeto convencional.`);
  }

  if (safeCrossed.length < conventionalCrossed.length) {
    explanation.push("A rota OrbitTwin evita os trechos mais críticos e mantém exposição reduzida.");
  } else if (exposureReductionPercent >= 30) {
    explanation.push(`A rota segura reduz a exposição em ${exposureReductionPercent}% em relação à rota convencional.`);
  }

  if (input.safeExtraMinutes > 0) {
    explanation.push(`O desvio seguro adiciona cerca de ${input.safeExtraMinutes} minuto(s) ao trajeto.`);
  }

  const timeLabel = input.safeExtraMinutes === 1 ? "1 minuto" : `${input.safeExtraMinutes} minutos`;
  const zoneCount = Math.max(conventionalCrossed.length - safeCrossed.length, 1);
  const recommendation =
    exposureReductionPercent >= 25
      ? `Rota segura recomendada. Ela leva ${timeLabel} a mais, mas reduz em ${exposureReductionPercent}% a exposição a áreas críticas.`
      : conventionalRiskScore >= 60
        ? `Rota segura recomendada. Ela leva ${timeLabel} a mais, mas evita ${zoneCount} área(s) com risco alto de alagamento.`
        : `Rota convencional aceitável, mas a rota OrbitTwin oferece margem extra de segurança.`;

  return {
    conventionalRiskScore,
    safeRiskScore: Math.max(8, safeRiskScore),
    conventionalRiskLabel: scoreToLabel(conventionalRiskScore),
    safeRiskLabel: scoreToLabel(safeRiskScore),
    exposureReduction,
    exposureReductionPercent,
    confidence,
    recommendation,
    explanation,
    crossedZones: conventionalCrossed.map((z) => z.name),
  };
}

export function calculateRouteRisk(input: CalculateRouteRiskInput): RouteRiskAssessment {
  const rainMm = input.rainForecastMm ?? 20;
  const exposure = calculateRouteExposure(input.path, input.riskArea, input.blocks, input.region, normalizeProfile(input.profile));
  const rainFactor = clamp((rainMm - 10) * 0.35, 0, 18);
  const regionalFactor = RISK_SCORE[input.region.risk] * 0.22;
  const riskScore = clamp(Math.round(exposure.score + rainFactor + regionalFactor), 8, 98);

  let exposureReduction = 0;
  if (input.compareExposure) {
    const compareScore = estimateScoreFromExposure(input.compareExposure, input.region, rainMm, input.profile);
    exposureReduction = Math.max(compareScore - riskScore, 0);
  }

  return {
    riskScore,
    riskLabel: `${RISK_LABELS[scoreToLevel(riskScore)]} (${riskScore}/100)`,
    confidence: clamp(Math.round(58 + exposureReduction * 0.7), 35, 96),
    exposureReduction,
    explanation: [],
  };
}

export function attachRouteAssessments(
  conventionalPath: GeoPoint[],
  safePath: GeoPoint[],
  riskArea: GeoPoint[],
  blocks: GeoPoint[],
  region: Region,
  profile: TravelProfile,
  rainMm: number,
): { conventional: RouteRiskAssessment; safe: RouteRiskAssessment } {
  const conventionalExposure = calculateRouteExposure(conventionalPath, riskArea, blocks, region, normalizeProfile(profile));
  const conventional = calculateRouteRisk({ path: conventionalPath, riskArea, blocks, region, profile, rainForecastMm: rainMm });
  const safe = calculateRouteRisk({
    path: safePath,
    riskArea,
    blocks,
    region,
    profile,
    rainForecastMm: rainMm,
    compareExposure: conventionalExposure,
  });
  return { conventional, safe: { ...safe, exposureReduction: Math.max(conventional.riskScore - safe.riskScore, 0) } };
}

function scoreFromExposure(
  exposure: RouteExposure,
  region: Region,
  rainMm: number,
  rainProbability: number,
  profile: TravelProfile,
): number {
  const rainFactor = clamp((rainMm - 8) * 0.4 + rainProbability * 0.08, 0, 22);
  const regionalFactor = RISK_SCORE[region.risk] * 0.2;
  const profileFactor = profile === "pedestrian" || profile === "citizen" ? 4 : profile === "emergency" ? -2 : 0;
  return clamp(Math.round(exposure.score + rainFactor + regionalFactor + profileFactor), 8, 98);
}

function estimateScoreFromExposure(exposure: RouteExposure, region: Region, rainMm: number, profile: TravelProfile): number {
  return scoreFromExposure(exposure, region, rainMm, 50, profile);
}

function scoreToLabel(score: number): RiskLabel {
  if (score >= 80) return "Crítico";
  if (score >= 60) return "Alto";
  if (score >= 40) return "Médio";
  return "Baixo";
}

function scoreToLevel(score: number): Region["risk"] {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function normalizeProfile(profile: TravelProfile): TravelProfile {
  if (profile === "citizen") return "pedestrian";
  if (profile === "driver") return "utility";
  return profile;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export { buildRecommendationConfidence, calculateRouteExposure, calculateDistanceKm, calculateTravelTimeMinutes } from "./riskModel";
