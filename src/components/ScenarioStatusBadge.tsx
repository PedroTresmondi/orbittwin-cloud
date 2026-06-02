import type { PlannedRouteResult, ScenarioKind } from "../types";
import { SCENARIO_LABELS, isScenarioActive } from "../services/scenarioService";

type ScenarioStatusBadgeProps = {
  scenario: ScenarioKind;
  planned: PlannedRouteResult | null;
};

export function ScenarioStatusBadge({ scenario, planned }: ScenarioStatusBadgeProps) {
  if (!planned) return null;

  const active = isScenarioActive(scenario);
  if (!active) return null;

  return (
    <div className="scenario-status scenario-status--simulated scenario-status--compact" role="status">
      <strong>{SCENARIO_LABELS[scenario]}</strong>
    </div>
  );
}
