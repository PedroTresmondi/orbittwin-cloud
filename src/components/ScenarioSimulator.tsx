import type { ScenarioKind } from "../types";
import { SCENARIO_LABELS, isScenarioActive } from "../services/scenarioService";

const SCENARIO_BUTTONS: { id: ScenarioKind; label: string; hint: string }[] = [
  { id: "heavy_rain", label: "Chuva forte", hint: "Aumenta risco pluvial no trajeto" },
  { id: "flood", label: "Enchente", hint: "Simula alagamento em zonas críticas" },
  { id: "blockage", label: "Bloqueio", hint: "Vias interditadas no mapa" },
  { id: "landslide", label: "Deslizamento", hint: "Risco em encostas" },
  { id: "multiple", label: "Múltiplos", hint: "Combina cenários" },
];

type ScenarioSimulatorProps = {
  activeScenario: ScenarioKind;
  isLoading: boolean;
  hasRoute: boolean;
  variant?: "collapsible" | "panel";
  onSelectScenario: (scenario: ScenarioKind) => void;
  onClear: () => void;
};

export function ScenarioSimulator({
  activeScenario,
  isLoading,
  hasRoute,
  variant = "collapsible",
  onSelectScenario,
  onClear,
}: ScenarioSimulatorProps) {
  if (!hasRoute) return null;

  const grid = (
    <>
      <p className="scenario-panel__intro">
        Escolha um cenário para recalcular risco e rota. Use <strong>Voltar ao real</strong> para restaurar dados
        ao vivo.
      </p>
      <div className="scenario-simulator__grid">
        {SCENARIO_BUTTONS.map((btn) => (
          <button
            key={btn.id}
            type="button"
            className={`scenario-simulator__btn${activeScenario === btn.id ? " is-active" : ""}`}
            disabled={isLoading}
            title={btn.hint}
            onClick={() => onSelectScenario(btn.id)}
          >
            <span className="scenario-simulator__btn-label">{btn.label}</span>
            <span className="scenario-simulator__btn-hint">{btn.hint}</span>
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
    </>
  );

  if (variant === "panel") {
    return (
      <section className="scenario-panel glass-surface" aria-labelledby="scenario-panel-title">
        <header className="scenario-panel__head">
          <h3 id="scenario-panel-title">Simular risco na rota</h3>
          {isScenarioActive(activeScenario) && (
            <span className="scenario-simulator__pill">{SCENARIO_LABELS[activeScenario]}</span>
          )}
        </header>
        {grid}
      </section>
    );
  }

  return (
    <details className="scenario-simulator" open={isScenarioActive(activeScenario)}>
      <summary className="scenario-simulator__summary">
        Simular risco na rota
        {isScenarioActive(activeScenario) && (
          <span className="scenario-simulator__pill">{SCENARIO_LABELS[activeScenario]}</span>
        )}
      </summary>
      {grid}
    </details>
  );
}
