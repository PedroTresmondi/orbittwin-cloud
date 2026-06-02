import type { PlannedRouteResult, ScenarioKind } from "../types";
import { SCENARIO_LABELS, isScenarioActive } from "../services/scenarioService";
import { buildCitizenRouteMessage } from "../utils/routeMessages";

type RouteResultStripProps = {
  planned: PlannedRouteResult;
  activeScenario: ScenarioKind;
  isCitizen: boolean;
  onOpenReport: () => void;
  onOpenManager: () => void;
};

const DATA_MODE_LABELS = {
  real: "Dados reais",
  simulated: "Simulado",
  hybrid: "Híbrido",
} as const;

export function RouteResultStrip({
  planned,
  activeScenario,
  isCitizen,
  onOpenReport,
  onOpenManager,
}: RouteResultStripProps) {
  const { route, risk } = planned;
  const extraMin = Math.max(route.safeTime - route.conventionalTime, 0);
  const simActive = isScenarioActive(activeScenario);

  return (
    <section
      className={`result-strip glass-surface${!isCitizen ? " result-strip--manager" : ""}`}
      aria-label="Resultado da rota"
    >
      <div className="result-strip__main">
        <p className="result-strip__verdict">
          {isCitizen && !planned.gsDetourDemo ? buildCitizenRouteMessage(route) : risk.recommendation}
        </p>
        <div className="result-strip__meta">
          <span className={`result-strip__mode result-strip__mode--${planned.dataMode}`}>
            {DATA_MODE_LABELS[planned.dataMode]}
          </span>
          {simActive && (
            <span className="result-strip__scenario scenario-status scenario-status--simulated">
              <strong>{SCENARIO_LABELS[activeScenario]}</strong>
            </span>
          )}
        </div>
      </div>

      <dl className="result-strip__stats">
        <div>
          <dt>Tempo extra</dt>
          <dd>+{extraMin} min</dd>
        </div>
        <div>
          <dt>Exposição</dt>
          <dd>−{risk.exposureReductionPercent}%</dd>
        </div>
        <div>
          <dt>Risco segura</dt>
          <dd>
            {risk.safeRiskLabel} ({risk.safeRiskScore})
          </dd>
        </div>
        <div>
          <dt>Confiança</dt>
          <dd>{risk.confidence}%</dd>
        </div>
      </dl>

      {isCitizen && (
        <div className="result-strip__actions">
          <button type="button" className="btn-secondary btn-secondary--sm" onClick={onOpenReport}>
            Relatório
          </button>
          <button type="button" className="btn-secondary btn-secondary--sm" onClick={onOpenManager}>
            Painel gestor
          </button>
        </div>
      )}
    </section>
  );
}
