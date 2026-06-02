import type { PlannedRouteResult } from "../types";
import { isScenarioActive } from "../services/scenarioService";

type RouteOperationalBridgeProps = {
  planned: PlannedRouteResult;
  onOpenManager: () => void;
};

export function RouteOperationalBridge({ planned, onOpenManager }: RouteOperationalBridgeProps) {
  const { route, risk } = planned;
  const extraMin = Math.max(route.safeTime - route.conventionalTime, 0);

  return (
    <section className="route-bridge card" aria-labelledby="route-bridge-title">
      <header className="route-bridge__head">
        <h3 id="route-bridge-title">Resumo operacional desta rota</h3>
        <p>Dados vinculados ao trajeto calculado — abra o painel gestor para KPIs urbanos e alertas.</p>
      </header>
      <dl className="route-bridge__stats">
        <div>
          <dt>Risco convencional</dt>
          <dd>
            {risk.conventionalRiskLabel} ({risk.conventionalRiskScore}/100)
          </dd>
        </div>
        <div>
          <dt>Risco rota segura</dt>
          <dd>
            {risk.safeRiskLabel} ({risk.safeRiskScore}/100)
          </dd>
        </div>
        <div>
          <dt>Redução de exposição</dt>
          <dd>{risk.exposureReductionPercent}%</dd>
        </div>
        <div>
          <dt>Tempo extra (segura)</dt>
          <dd>+{extraMin} min</dd>
        </div>
      </dl>
      {isScenarioActive(planned.scenario) && (
        <p className="route-bridge__scenario">Cenário simulado ativo nesta análise.</p>
      )}
      <button type="button" className="btn-secondary route-bridge__cta" onClick={onOpenManager}>
        Ver indicadores para decisão
      </button>
    </section>
  );
}
