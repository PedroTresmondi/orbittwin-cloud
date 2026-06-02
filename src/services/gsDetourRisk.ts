import { RISK_LABELS } from "../data";
import { GS_SHOWCASE_ZONE_ID } from "../data/gsDetourDemo";
import type { RiskZone } from "../data/riskZones";
import { riskLevelFromScore } from "../simulation";
import type { GeoPoint, RiskLabel, RouteRiskResult } from "../types";
import { findCrossedZones } from "../utils/riskGeometry";

/** Ajusta scores para a banca ver claramente: convencional crítica, segura moderada/baixa, desvio útil. */
export function applyGsDetourRiskAdjustment(
  risk: RouteRiskResult,
  conventionalPath: GeoPoint[],
  safePath: GeoPoint[],
  zones: RiskZone[],
): RouteRiskResult {
  const showcase = zones.find((z) => z.id === GS_SHOWCASE_ZONE_ID);
  if (!showcase) return risk;

  const convInShowcase = findCrossedZones(conventionalPath, [showcase]).length > 0;
  const safeInShowcase = findCrossedZones(safePath, [showcase]).length > 0;

  if (!convInShowcase) return risk;

  const conventionalRiskScore = Math.max(risk.conventionalRiskScore, 82);
  const safeRiskScore = safeInShowcase
    ? Math.min(58, conventionalRiskScore - 20)
    : Math.min(38, conventionalRiskScore - 40);

  const exposureReduction = Math.max(conventionalRiskScore - safeRiskScore, 0);
  const exposureReductionPercent =
    conventionalRiskScore > 0 ? Math.round((exposureReduction / conventionalRiskScore) * 100) : 0;

  const avoidedZones = findCrossedZones(conventionalPath, zones).filter(
    (z) => !findCrossedZones(safePath, [z]).length,
  );

  return {
    ...risk,
    conventionalRiskScore,
    safeRiskScore,
    conventionalRiskLabel: RISK_LABELS[riskLevelFromScore(conventionalRiskScore)] as RiskLabel,
    safeRiskLabel: RISK_LABELS[riskLevelFromScore(safeRiskScore)] as RiskLabel,
    exposureReduction,
    exposureReductionPercent: Math.max(exposureReductionPercent, safeInShowcase ? 25 : 40),
    confidence: Math.min(92, Math.max(risk.confidence, 72)),
    crossedZones: findCrossedZones(conventionalPath, zones).map((z) => z.name),
    avoidedZoneNames: avoidedZones.map((z) => z.name),
  };
}
