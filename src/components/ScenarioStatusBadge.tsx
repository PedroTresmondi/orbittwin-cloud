import type { PlannedRouteResult, ScenarioKind } from "../types";
import { SCENARIO_LABELS, isScenarioActive } from "../services/scenarioService";

type ScenarioStatusBadgeProps = {
  scenario: ScenarioKind;
  planned: PlannedRouteResult | null;
};

export function ScenarioStatusBadge({ scenario, planned }: ScenarioStatusBadgeProps) {
  const active = isScenarioActive(scenario);
  const label = active ? SCENARIO_LABELS[scenario] : "Dados reais ativos";
  const dataMode = planned?.dataMode ?? (active ? "simulated" : "real");

  return (
    <div
      className={`scenario-status${active ? " scenario-status--simulated" : " scenario-status--real"}`}
      role="status"
      aria-live="polite"
    >
      <span className="scenario-status__label">Status do cenário</span>
      <strong>{label}</strong>
      <span className="scenario-status__mode">
        Fonte: {dataMode === "real" ? "Real" : dataMode === "hybrid" ? "Híbrido" : "Simulado"}
      </span>
    </div>
  );
}
