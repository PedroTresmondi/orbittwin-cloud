import { TRAVEL_PROFILE_LABELS } from "../data";
import { routeRiskLabel } from "../simulation";
import type { OperationalEvent } from "../types";

type OperationalHistoryPanelProps = {
  history: OperationalEvent[];
  variant?: "compact" | "full";
};

export function OperationalHistoryPanel({ history, variant = "full" }: OperationalHistoryPanelProps) {
  if (variant === "compact") {
    return (
      <div className="route-history">
        <div className="route-history__head">
          <span>Simulações recentes</span>
          <strong>{history.length}</strong>
        </div>
        {history.length === 0 ? (
          <p className="route-history__empty">Nenhuma simulação registrada.</p>
        ) : (
          <ol className="route-history__list">
            {history.slice(0, 4).map((event) => (
              <li key={event.id}>
                <HistoryRow event={event} />
              </li>
            ))}
          </ol>
        )}
      </div>
    );
  }

  return (
    <section className="history-table card">
      <header className="section-head section-head--compact">
        <div>
          <h2>Histórico operacional</h2>
          <p>Simulações salvas localmente para auditoria e decisão pública</p>
        </div>
        <span className="history-table__count">{history.length} registros</span>
      </header>

      {history.length === 0 ? (
        <p className="route-history__empty">Nenhuma simulação registrada neste dispositivo.</p>
      ) : (
        <div className="history-table__wrap">
          <table className="history-table__table">
            <thead>
              <tr>
                <th>Data/hora</th>
                <th>Trajeto</th>
                <th>Perfil</th>
                <th>Risco conv.</th>
                <th>Risco seguro</th>
                <th>Tempos</th>
                <th>Recomendação</th>
              </tr>
            </thead>
            <tbody>
              {history.map((event) => (
                <tr key={event.id}>
                  <td>{event.timestamp}</td>
                  <td>
                    <strong>{event.region}</strong>
                    <br />
                    <span className="history-table__route">
                      {event.origin} → {event.destination}
                    </span>
                  </td>
                  <td>{TRAVEL_PROFILE_LABELS[event.profile]}</td>
                  <td>{routeRiskLabel(event.conventionalRisk)}</td>
                  <td>{routeRiskLabel(event.safeRisk)}</td>
                  <td>
                    {event.conventionalTime} min / {event.safeTime} min
                  </td>
                  <td>{event.finalRecommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function HistoryRow({ event }: { event: OperationalEvent }) {
  return (
    <>
      <div>
        <strong>{event.region}</strong>
        <span>{event.timestamp}</span>
      </div>
      <p>
        {event.origin} → {event.destination} · {TRAVEL_PROFILE_LABELS[event.profile]} · redução {event.riskReduction}{" "}
        pts
      </p>
    </>
  );
}
