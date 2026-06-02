import type { PlannedRouteResult } from "../types";

type RouteExplanationProps = {
  planned: PlannedRouteResult | null;
};

export function RouteExplanation({ planned }: RouteExplanationProps) {
  if (!planned) return null;

  return (
    <section className="route-explanation card">
      <h3>Por que o OrbitTwin recomenda essa rota?</h3>
      <ul>
        {planned.risk.explanation.map((line) => (
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
