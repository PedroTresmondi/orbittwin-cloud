import type { DecisionRecommendationData } from "../types/decisionDashboard";
import { DataStatusBadge } from "./DataStatusBadge";

type DecisionRecommendationProps = {
  recommendation: DecisionRecommendationData;
};

export function DecisionRecommendation({ recommendation }: DecisionRecommendationProps) {
  return (
    <div className="decision-rec__body" aria-labelledby="decision-rec-title">
      <p id="decision-rec-title" className="visually-hidden">
        Recomendação OrbitTwin
      </p>
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
      <div className="decision-rec__footer">
        <span className="decision-rec__confidence">Confiança: {recommendation.confidence}%</span>
        <DataStatusBadge mode={recommendation.source} size="md" />
      </div>
    </div>
  );
}
