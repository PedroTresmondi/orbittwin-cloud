import type { RouteData, RouteRiskAssessment } from "../types";

type AIJustificationProps = {
  route: RouteData;
  rainForecast?: string;
};

export function AIJustification({ route, rainForecast }: AIJustificationProps) {
  const conventional = route.conventionalAssessment;
  const safe = route.safeAssessment;

  return (
    <section className="ai-panel card" aria-label="Justificativa da IA">
      <header className="section-head section-head--compact">
        <div>
          <h2>Justificativa da IA</h2>
          <p>Explicabilidade da recomendação com base em dados espaciais e IoT</p>
        </div>
        <span className="ai-panel__confidence">{route.confidence}% confiança</span>
      </header>

      <div className="ai-panel__grid">
        <JustificationCard title="Chuva prevista" value={rainForecast ?? "—"} detail="Correlação com saturação do solo e drenagem urbana." />
        <JustificationCard
          title="Áreas de risco na rota convencional"
          value={conventional ? `${conventional.explanation[0] ?? "Análise em curso"}` : "—"}
          detail="Trechos que cruzam polígonos de alagamento mapeados."
        />
        <JustificationCard
          title="Bloqueios detectados"
          value={route.criticalSegments.slice(0, 2).join(" · ") || "Nenhum bloqueio imediato"}
          detail="Pontos operacionais com restrição de passagem."
        />
        <JustificationCard
          title="Sensores e leituras simuladas"
          value={route.avoidedBlocks[0] ?? "Rede IoT em monitoramento"}
          detail="Telemetria pluviométrica e sensores de nível integrados."
        />
        <JustificationCard
          title="Exposição reduzida (rota segura)"
          value={safe ? `${safe.exposureReduction} pontos` : "—"}
          detail="Comparativo entre trajeto convencional e rota OrbitTwin."
        />
        <JustificationCard
          title="Score de confiança"
          value={`${route.confidence}%`}
          detail={buildConfidenceDetail(route.confidence, safe)}
        />
      </div>

      {safe && (
        <ul className="ai-panel__list">
          {safe.explanation.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function JustificationCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <article className="ai-panel__item">
      <span className="ai-panel__item-label">{title}</span>
      <strong className="ai-panel__item-value">{value}</strong>
      <p className="ai-panel__item-detail">{detail}</p>
    </article>
  );
}

function buildConfidenceDetail(confidence: number, safe?: RouteRiskAssessment): string {
  if (confidence >= 85) return "Alta confiança na recomendação operacional.";
  if (confidence >= 70) return "Confiança moderada; reavaliar após nova leitura orbital.";
  return safe ? "Confiança reduzida por bloqueios ou chuva intensa na região." : "Aguardando nova simulação.";
}
