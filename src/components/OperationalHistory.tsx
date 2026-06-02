import { PLANNER_PROFILE_LABELS } from "../types";
import type { OperationalEvent } from "../types";

type OperationalHistoryProps = {
  history: OperationalEvent[];
  onSelect: (event: OperationalEvent) => void;
  onClear: () => void;
  variant?: "cards" | "table";
};

export function OperationalHistory({ history, onSelect, onClear, variant = "cards" }: OperationalHistoryProps) {
  if (history.length === 0) {
    return (
      <section className="history-panel card">
        <h3>Histórico recente</h3>
        <p className="route-history__empty">Nenhuma simulação salva neste dispositivo.</p>
      </section>
    );
  }

  return (
    <section className="history-panel card">
      <header className="history-panel__head">
        <h3>Histórico recente</h3>
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
                {event.exposureReduction} pts
              </p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
