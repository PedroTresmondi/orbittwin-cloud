import type { ScenarioKind } from "../types";
import { SCENARIO_LABELS, isScenarioActive } from "../services/scenarioService";

const SCENARIO_BUTTONS: { id: ScenarioKind; label: string }[] = [
  { id: "heavy_rain", label: "Chuva forte" },
  { id: "flood", label: "Enchente / alagamento" },
  { id: "blockage", label: "Bloqueio de vias" },
  { id: "landslide", label: "Deslizamento / encosta" },
  { id: "multiple", label: "Múltiplos riscos" },
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
  return (
    <section className="scenario-simulator card" aria-labelledby="scenario-sim-title">
      <header className="scenario-simulator__head">
        <h3 id="scenario-sim-title">Simular cenário de risco</h3>
        <p>
          Ative eventos extremos para demonstrar a rota segura — útil quando não há chuva real no dia da apresentação.
        </p>
      </header>

      {!hasRoute && (
        <p className="scenario-simulator__hint" role="status">
          Defina uma origem e um destino para visualizar o impacto da simulação na rota.
        </p>
      )}

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
          Limpar simulação
        </button>
      </div>

      {isScenarioActive(activeScenario) && (
        <p className="scenario-simulator__active">
          Cenário ativo: <strong>{SCENARIO_LABELS[activeScenario]}</strong>
        </p>
      )}
    </section>
  );
}
