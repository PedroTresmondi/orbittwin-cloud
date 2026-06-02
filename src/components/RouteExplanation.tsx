import type { PlannedRouteResult } from "../types";
import { isScenarioActive } from "../services/scenarioService";

type RouteExplanationProps = {
  planned: PlannedRouteResult | null;
  compact?: boolean;
};

export function RouteExplanation({ planned, compact = false }: RouteExplanationProps) {
  if (!planned) return null;

  const items = compact ? planned.risk.explanation.slice(0, 3) : planned.risk.explanation;
  const simulated = isScenarioActive(planned.scenario);

  return (
    <section className="route-explanation card">
      <h3>{compact ? "Resumo da recomendação" : "Por que o OrbitTwin recomenda essa rota?"}</h3>
      <p className={`route-explanation__mode route-explanation__mode--${planned.dataMode}`}>
        {simulated
          ? "Recomendação influenciada por cenário simulado para demonstração."
          : "Recomendação baseada em dados reais e camadas de risco do protótipo."}
      </p>
      <ul>
        {items.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {planned.risk.crossedZones.length > 0 && (
        <p className="route-explanation__zones">
          Áreas de risco no trajeto convencional: {planned.risk.crossedZones.join(" · ")}
        </p>
      )}
    </section>
  );
}
