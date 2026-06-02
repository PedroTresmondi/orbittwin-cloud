import type { PlannedRouteResult } from "../types";

type RouteSummaryProps = {
  planned: PlannedRouteResult;
  compact?: boolean;
  /** Exibe cards comparativos convencional vs segura (aba Detalhes) */
  showComparison?: boolean;
};

const DATA_MODE_LABELS = {
  real: "Real",
  simulated: "Simulado",
  hybrid: "Híbrido",
} as const;

export function RouteSummary({ planned, compact = false, showComparison = true }: RouteSummaryProps) {
  const { route, risk } = planned;
  const extraMin = Math.max(route.safeTime - route.conventionalTime, 0);

  return (
    <section className="route-summary">
      {!showComparison && (
        <div className="route-summary__hero card">
          <div className="route-summary__meta-row">
            <span className="route-summary__label">Recomendação</span>
            <span className={`route-summary__mode route-summary__mode--${planned.dataMode}`}>
              {DATA_MODE_LABELS[planned.dataMode]}
            </span>
          </div>
          <p className="route-summary__message">{risk.recommendation}</p>
        </div>
      )}

      {showComparison && (
        <>
          <div className="route-summary__hero card">
            <div className="route-summary__meta-row">
              <span className="route-summary__label">Comparativo de rotas</span>
              <span className={`route-summary__mode route-summary__mode--${planned.dataMode}`}>
                {DATA_MODE_LABELS[planned.dataMode]}
              </span>
            </div>
            <p className="route-summary__message">{risk.recommendation}</p>
            {!compact && route.conventionalRisk >= 60 && (
              <p className="route-summary__citizen-tip">
                Evite a rota convencional. Há risco {risk.conventionalRiskLabel.toLowerCase()} no trajeto.
              </p>
            )}
            <dl className="route-summary__stats">
              <div>
                <dt>Recomendada</dt>
                <dd>OrbitTwin segura</dd>
              </div>
              <div>
                <dt>Tempo extra</dt>
                <dd>+{extraMin} min</dd>
              </div>
              <div>
                <dt>Exposição</dt>
                <dd>−{risk.exposureReductionPercent}%</dd>
              </div>
              <div>
                <dt>Confiança</dt>
                <dd>{risk.confidence}%</dd>
              </div>
            </dl>
          </div>

          <div className="route-summary__cards">
        <article className="route-card route-card--danger">
          <div className="route-card__head">
            <span>Rota convencional</span>
            <strong>{risk.conventionalRiskLabel}</strong>
          </div>
          <dl className="route-card__metrics">
            <div>
              <dt>Tempo</dt>
              <dd>{route.conventionalTime} min</dd>
            </div>
            <div>
              <dt>Distância</dt>
              <dd>{route.conventionalDistanceKm.toFixed(1)} km</dd>
            </div>
            <div>
              <dt>Risco</dt>
              <dd>{route.conventionalRisk}/100</dd>
            </div>
          </dl>
        </article>

        <article className="route-card route-card--safe">
          <div className="route-card__head">
            <span>Rota OrbitTwin</span>
            <strong>{risk.safeRiskLabel}</strong>
          </div>
          <dl className="route-card__metrics">
            <div>
              <dt>Tempo</dt>
              <dd>{route.safeTime} min</dd>
            </div>
            <div>
              <dt>Distância</dt>
              <dd>{route.safeDistanceKm.toFixed(1)} km</dd>
            </div>
            <div>
              <dt>Risco</dt>
              <dd>{route.safeRisk}/100</dd>
            </div>
          </dl>
        </article>
          </div>
        </>
      )}
    </section>
  );
}
