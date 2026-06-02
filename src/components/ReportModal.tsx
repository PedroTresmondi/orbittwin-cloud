import { PLANNER_PROFILE_LABELS } from "../types";
import type { SimulationReport } from "../types";

type ReportModalProps = {
  report: SimulationReport | null;
  onClose: () => void;
};

export function ReportModal({ report, onClose }: ReportModalProps) {
  if (!report) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal__head">
          <div>
            <h2 id="report-title">Relatório da simulação</h2>
            <p>Gerado em {report.generatedAt}</p>
          </div>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Fechar relatório">
            ×
          </button>
        </header>

        <div className="modal__body">
          <section className="report-block">
            <h3>Cenário e fontes</h3>
            <dl className="report-dl">
              <div>
                <dt>Cenário ativo</dt>
                <dd>{report.scenarioLabel}</dd>
              </div>
              <div>
                <dt>Modo de dados</dt>
                <dd>{report.dataMode === "real" ? "Real" : report.dataMode === "hybrid" ? "Híbrido" : "Simulado"}</dd>
              </div>
            </dl>
            {report.realDataUsed.length > 0 && (
              <p className="report-message">
                <strong>Dados reais:</strong> {report.realDataUsed.join(" · ")}
              </p>
            )}
            {report.simulatedDataUsed.length > 0 && (
              <p className="report-message">
                <strong>Dados simulados:</strong> {report.simulatedDataUsed.join(" · ")}
              </p>
            )}
          </section>

          <section className="report-block">
            <h3>Trajeto</h3>
            <dl className="report-dl">
              <div>
                <dt>Origem</dt>
                <dd>{report.origin}</dd>
              </div>
              <div>
                <dt>Destino</dt>
                <dd>{report.destination}</dd>
              </div>
              <div>
                <dt>Região</dt>
                <dd>{report.region}</dd>
              </div>
              <div>
                <dt>Perfil</dt>
                <dd>{PLANNER_PROFILE_LABELS[report.profile]}</dd>
              </div>
            </dl>
          </section>

          <section className="report-block">
            <h3>Rota recomendada</h3>
            <p className="report-highlight">{report.recommendedRoute}</p>
            <p className="report-message">{report.citizenMessage}</p>
            <dl className="report-dl report-dl--grid">
              <div>
                <dt>Risco convencional</dt>
                <dd>{report.conventionalRisk}/100</dd>
              </div>
              <div>
                <dt>Risco rota segura</dt>
                <dd>{report.safeRisk}/100</dd>
              </div>
              <div>
                <dt>Tempo convencional</dt>
                <dd>{report.conventionalTime} min</dd>
              </div>
              <div>
                <dt>Tempo rota segura</dt>
                <dd>{report.safeTime} min</dd>
              </div>
              <div>
                <dt>Diferença de tempo</dt>
                <dd>+{report.timeDifferenceMinutes} min</dd>
              </div>
              <div>
                <dt>Confiança</dt>
                <dd>{report.confidence}%</dd>
              </div>
            </dl>
            <p className="report-source">Fonte de rota: {report.source === "osrm" ? "OSRM" : "Motor local de contingência"}</p>
          </section>

          <section className="report-block">
            <h3>Clima (Open-Meteo)</h3>
            <dl className="report-dl report-dl--grid">
              <div>
                <dt>Chuva prevista (2h)</dt>
                <dd>{report.weather.precipitationNext2Hours} mm</dd>
              </div>
              <div>
                <dt>Probabilidade</dt>
                <dd>{report.weather.precipitationProbability}%</dd>
              </div>
              <div>
                <dt>Temperatura</dt>
                <dd>{report.weather.temperature} °C</dd>
              </div>
              <div>
                <dt>Fonte</dt>
                <dd>{report.weather.source}{report.weather.isSimulated ? " (simulado)" : ""}</dd>
              </div>
            </dl>
            {report.crossedZones.length > 0 && (
              <p className="report-message">Áreas de risco: {report.crossedZones.join(" · ")}</p>
            )}
          </section>

          <section className="report-block">
            <h3>Justificativas</h3>
            <ul className="report-list">
              {report.justifications.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="report-block">
            <h3>Ações recomendadas</h3>
            <ul className="report-list report-list--actions">
              {report.recommendedActions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <footer className="modal__footer">
          <button type="button" className="btn-orbit" onClick={onClose}>
            Fechar relatório
          </button>
        </footer>
      </div>
    </div>
  );
}
