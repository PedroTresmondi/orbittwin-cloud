import type { AppMode, DataHubEntry } from "../types";

type DataHubPanelProps = {
  entries: DataHubEntry[];
  mode: AppMode;
  /** Recolhido por padrão — menos ruído na home */
  collapsible?: boolean;
};

export function DataHubPanel({ entries, mode, collapsible = true }: DataHubPanelProps) {
  const isCitizen = mode === "citizen";
  const realCount = entries.filter((e) => e.badge === "Real").length;

  const body = isCitizen ? (
    <div className="data-hub__citizen-badges">
      {entries.slice(0, 5).map((e) => (
        <span key={e.id} className={`data-hub__badge data-hub__badge--${e.badge.toLowerCase()}`}>
          {e.name}: {e.badge}
        </span>
      ))}
    </div>
  ) : (
    <div className="data-hub__table-wrap">
      <table className="data-hub__table">
        <thead>
          <tr>
            <th>Fonte</th>
            <th>Status</th>
            <th>Uso</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>
                <strong>{entry.name}</strong>
              </td>
              <td>
                <span className={`data-hub__badge data-hub__badge--${entry.badge.toLowerCase()}`}>{entry.badge}</span>
              </td>
              <td>
                {entry.usage}
                {entry.detail && <small className="data-hub__detail">{entry.detail}</small>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (collapsible) {
    return (
      <details className="data-hub data-hub--collapsible">
        <summary className="data-hub__summary">
          Fontes de dados
          <span className="data-hub__summary-meta">{realCount} reais</span>
        </summary>
        <div className="data-hub__body">{body}</div>
      </details>
    );
  }

  return (
    <section className="data-hub card" aria-labelledby="data-hub-title">
      <h3 id="data-hub-title" className="data-hub__title">
        Central de Dados
      </h3>
      {body}
    </section>
  );
}
