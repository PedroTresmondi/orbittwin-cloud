import type { PlannedRouteResult } from "../types";

type RouteCompareCompactProps = {
  planned: PlannedRouteResult;
};

export function RouteCompareCompact({ planned }: RouteCompareCompactProps) {
  const { route, risk } = planned;
  const extraMin = Math.max(route.safeTime - route.conventionalTime, 0);

  return (
    <section className="route-compare-compact" aria-label="Comparativo de rotas">
      <div className="route-compare-compact__grid">
        <article className="route-card route-card--danger route-card--compact">
          <div className="route-card__head">
            <span>Convencional</span>
            <strong>{risk.conventionalRiskLabel}</strong>
          </div>
          <dl className="route-card__metrics">
            <div>
              <dt>Tempo</dt>
              <dd>{route.conventionalTime} min</dd>
            </div>
            <div>
              <dt>Risco</dt>
              <dd>{route.conventionalRisk}/100</dd>
            </div>
            <div>
              <dt>Distância</dt>
              <dd>{route.conventionalDistanceKm.toFixed(1)} km</dd>
            </div>
          </dl>
        </article>

        <article className="route-card route-card--safe route-card--compact">
          <div className="route-card__head">
            <span>OrbitTwin segura</span>
            <strong>{risk.safeRiskLabel}</strong>
          </div>
          <dl className="route-card__metrics">
            <div>
              <dt>Tempo</dt>
              <dd>
                {route.safeTime} min <small>(+{extraMin})</small>
              </dd>
            </div>
            <div>
              <dt>Risco</dt>
              <dd>{route.safeRisk}/100</dd>
            </div>
            <div>
              <dt>Exposição</dt>
              <dd>−{risk.exposureReductionPercent}%</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  );
}
