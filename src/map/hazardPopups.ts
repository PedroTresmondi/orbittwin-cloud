import type { RouteHazard, RouteHazardKind } from "../types/routeHazard";

const SEVERITY_PT: Record<RouteHazard["severity"], string> = {
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

const RISK_TYPE_PT: Record<RouteHazardKind, string> = {
  flood: "Alagamento",
  block: "Bloqueio de via",
  landslide: "Deslizamento",
  fire: "Foco de calor",
  critical: "Trecho crítico",
};

function defaultAction(kind: RouteHazardKind): string {
  if (kind === "block") {
    return "Evitar o ponto bloqueado e seguir a rota OrbitTwin segura.";
  }
  return "Evitar a rota convencional e priorizar a rota segura.";
}

export function formatHazardPopup(hazard: RouteHazard): string {
  const action = hazard.recommendedAction ?? defaultAction(hazard.kind);
  const type = RISK_TYPE_PT[hazard.kind];
  const severity = SEVERITY_PT[hazard.severity];

  return `<div class="hazard-popup">
<strong class="hazard-popup__title">${hazard.label}</strong>
<p class="hazard-popup__row"><span>Tipo</span> ${type}</p>
<p class="hazard-popup__row"><span>Severidade</span> ${severity}</p>
${hazard.description ? `<p class="hazard-popup__desc">${hazard.description}</p>` : ""}
<p class="hazard-popup__action"><span>Ação</span> ${action}</p>
</div>`;
}

export function formatBlockPopup(index: number): string {
  return `<div class="hazard-popup">
<strong class="hazard-popup__title">Bloqueio de via</strong>
<p class="hazard-popup__row"><span>Tipo</span> Bloqueio operacional</p>
<p class="hazard-popup__row"><span>Severidade</span> Alta</p>
<p class="hazard-popup__desc">Ponto B${index + 1} — interdição prevista no trajeto convencional.</p>
<p class="hazard-popup__action"><span>Ação</span> Evitar a rota convencional e priorizar a rota segura.</p>
</div>`;
}
