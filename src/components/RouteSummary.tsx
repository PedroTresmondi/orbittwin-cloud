import type { PlannedRouteResult } from "../types";

type RouteSummaryProps = {
  planned: PlannedRouteResult;
  compact?: boolean;
};

export function RouteSummary({ planned, compact = false }: RouteSummaryProps) {
  const { route, risk } = planned;
  const extraMin = Math.max(route.safeTime - route.conventionalTime, 0);

  return (
    <section className="route-summary">
      <div className="route-summary__hero card">
        <span className="route-summary__label">Resumo da recomendação</span>
        <p className="route-summary__message">{risk.recommendation}</p>
        {!compact && route.conventionalRisk >= 60 && (
          <p className="route-summary__citizen-tip">
            Evite a rota convencional. Há risco {risk.conventionalRiskLabel.toLowerCase()} de alagamento no trajeto.
          </p>
        )}
      </div>

      <div className="route-summary__cards">
        <article className="route-card route-card--danger">
          <div className="route-card__head">
            <span>Rota convencional</span>
            <strong>{risk.conventionalRiskLabel}</strong>
          </div>
          <dl className="route-card__metrics">
            <div><dt>Tempo</dt><dd>{route.conventionalTime} min</dd></div>
            <div><dt>Distância</dt><dd>{route.conventionalDistanceKm.toFixed(1)} km</dd></div>
            <div><dt>Risco</dt><dd>{route.conventionalRisk}/100</dd></div>
          </dl>
        </article>

        <article className="route-card route-card--safe">
          <div className="route-card__head">
            <span>Rota OrbitTwin</span>
            <strong>{risk.safeRiskLabel}</strong>
          </div>
          <dl className="route-card__metrics">
            <div><dt>Tempo</dt><dd>{route.safeTime} min</dd></div>
            <div><dt>Distância</dt><dd>{route.safeDistanceKm.toFixed(1)} km</dd></div>
            <div><dt>Risco</dt><dd>{route.safeRisk}/100</dd></div>
          </dl>
        </article>

        <article className="route-summary__diff card">
          <span>Diferença</span>
          <strong>+{extraMin} min</strong>
          <p>-{risk.exposureReductionPercent}% exposição ao risco</p>
          <p className="route-summary__confidence">Confiança: {risk.confidence}%</p>
        </article>
      </div>
    </section>
  );
}
