import { PLANNER_PROFILE_LABELS } from "../types";
import type { DataMode, OperationalEvent } from "../types";
import { SCENARIO_LABELS } from "../services/scenarioService";

const DATA_MODE_LABELS: Record<DataMode, string> = {
  real: "Real",
  simulated: "Simulado",
  hybrid: "Híbrido",
};

type OperationalHistoryProps = {
  history: OperationalEvent[];
  onSelect: (event: OperationalEvent) => void;
  onClear: () => void;
  variant?: "cards" | "table";
};

export function OperationalHistory({ history, onSelect, onClear, variant = "cards" }: OperationalHistoryProps) {
  if (history.length === 0) {
    return (
      <section className="history-panel glass-surface">
        <h3>Histórico operacional</h3>
        <p className="route-history__empty">
          Nenhuma rota calculada ainda. Use <strong>Calcular rota segura</strong> ou{" "}
          <strong>Aleatório e calcular</strong> para gerar o primeiro registro.
        </p>
      </section>
    );
  }

  return (
    <section className="history-panel glass-surface">
      <header className="history-panel__head">
        <h3>Histórico operacional</h3>
        <div className="history-panel__actions">
          <span>{history.length} simulações</span>
          <button type="button" className="btn-text" onClick={onClear}>
            Limpar histórico
          </button>
        </div>
      </header>

      {variant === "table" ? (
        <div className="history-table__wrap">
          <table className="history-table__table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Trajeto</th>
                <th>Riscos</th>
                <th>Fontes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {history.map((event) => (
                <tr key={event.id}>
                  <td>{event.timestamp}</td>
                  <td>
                    {event.origin} → {event.destination}
                    <br />
                    <small>{PLANNER_PROFILE_LABELS[event.profile]}</small>
                  </td>
                  <td>
                    {event.conventionalRisk} → {event.safeRisk} (-{event.exposureReduction}%)
                    <HistoryBadges event={event} />
                  </td>
                  <td>
                    <HistorySources event={event} />
                  </td>
                  <td>
                    <button type="button" className="btn-text" onClick={() => onSelect(event)}>
                      Recarregar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="history-cards">
          {history.slice(0, 6).map((event) => (
            <button key={event.id} type="button" className="history-card" onClick={() => onSelect(event)}>
              <span className="history-card__time">{event.timestamp}</span>
              <strong>
                {event.origin} → {event.destination}
              </strong>
              <p>
                {PLANNER_PROFILE_LABELS[event.profile]} · risco {event.conventionalRisk} → {event.safeRisk} · -
                {event.exposureReduction}%
              </p>
              <HistoryBadges event={event} />
              <HistorySources event={event} compact />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function HistoryBadges({ event }: { event: OperationalEvent }) {
  const mode = event.plannerSnapshot?.dataMode ?? "hybrid";
  const scenario = event.plannerSnapshot?.scenario ?? "real";
  const scenarioLabel =
    scenario === "real" || scenario === "clear" ? "Real" : SCENARIO_LABELS[scenario].replace(" simulada", "").replace(" simulado", "");

  return (
    <div className="history-badges">
      <span className={`history-badges__tag history-badges__tag--${mode}`}>{DATA_MODE_LABELS[mode]}</span>
      {scenario !== "real" && scenario !== "clear" && (
        <span className="history-badges__tag history-badges__tag--scenario">{scenarioLabel}</span>
      )}
    </div>
  );
}

function HistorySources({ event, compact = false }: { event: OperationalEvent; compact?: boolean }) {
  const sources = event.simulation?.sources ?? event.sources;
  if (sources.length === 0) return null;

  return (
    <div className={`history-sources${compact ? " history-sources--compact" : ""}`}>
      {sources.map((source) => (
        <span key={source} className="history-sources__tag">
          {source}
        </span>
      ))}
    </div>
  );
}
