import type { DecisionRecommendationData } from "../types/decisionDashboard";
import { DataStatusBadge } from "./DataStatusBadge";

type DecisionRecommendationProps = {
  recommendation: DecisionRecommendationData;
};

export function DecisionRecommendation({ recommendation }: DecisionRecommendationProps) {
  return (
    <section className="decision-rec card" aria-labelledby="decision-rec-title">
      <header className="decision-rec__head">
        <h3 id="decision-rec-title">Recomendação OrbitTwin</h3>
        <div className="decision-rec__meta">
          <span className="decision-rec__confidence">Confiança: {recommendation.confidence}%</span>
          <DataStatusBadge mode={recommendation.source} size="md" />
        </div>
      </header>
      <dl className="decision-rec__dl">
        <div>
          <dt>Cenário</dt>
          <dd>{recommendation.scenario}</dd>
        </div>
        <div>
          <dt>Análise</dt>
          <dd>{recommendation.analysis}</dd>
        </div>
        <div>
          <dt>Ação recomendada</dt>
          <dd className="decision-rec__action">{recommendation.action}</dd>
        </div>
      </dl>
      {recommendation.explanation.length > 0 && (
        <ul className="decision-rec__bullets">
          {recommendation.explanation.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
