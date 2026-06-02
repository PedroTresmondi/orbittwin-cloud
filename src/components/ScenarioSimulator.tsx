import type { ScenarioKind } from "../types";
import { SCENARIO_LABELS, isScenarioActive } from "../services/scenarioService";

const SCENARIO_BUTTONS: { id: ScenarioKind; label: string }[] = [
  { id: "heavy_rain", label: "Chuva forte" },
  { id: "flood", label: "Enchente" },
  { id: "blockage", label: "Bloqueio" },
  { id: "landslide", label: "Deslizamento" },
  { id: "multiple", label: "Múltiplos" },
];

type ScenarioSimulatorProps = {
  activeScenario: ScenarioKind;
  isLoading: boolean;
  hasRoute: boolean;
  onSelectScenario: (scenario: ScenarioKind) => void;
  onClear: () => void;
};

export function ScenarioSimulator({
  activeScenario,
  isLoading,
  hasRoute,
  onSelectScenario,
  onClear,
}: ScenarioSimulatorProps) {
  if (!hasRoute) return null;

  return (
    <details className="scenario-simulator" open={isScenarioActive(activeScenario)}>
      <summary className="scenario-simulator__summary">
        Simular risco na rota
        {isScenarioActive(activeScenario) && (
          <span className="scenario-simulator__pill">{SCENARIO_LABELS[activeScenario]}</span>
        )}
      </summary>

      <div className="scenario-simulator__grid">
        {SCENARIO_BUTTONS.map((btn) => (
          <button
            key={btn.id}
            type="button"
            className={`scenario-simulator__btn${activeScenario === btn.id ? " is-active" : ""}`}
            disabled={isLoading}
            onClick={() => onSelectScenario(btn.id)}
          >
            {btn.label}
          </button>
        ))}
        <button
          type="button"
          className="scenario-simulator__btn scenario-simulator__btn--clear"
          disabled={isLoading || !isScenarioActive(activeScenario)}
          onClick={onClear}
        >
          Voltar ao real
        </button>
      </div>
    </details>
  );
}
