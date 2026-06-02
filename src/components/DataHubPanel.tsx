import type { AppMode, DataHubEntry } from "../types";

type DataHubPanelProps = {
  entries: DataHubEntry[];
  mode: AppMode;
  compact?: boolean;
};

export function DataHubPanel({ entries, mode, compact = false }: DataHubPanelProps) {
  const isCitizen = mode === "citizen";

  if (isCitizen || compact) {
    return (
      <section className="data-hub data-hub--citizen card" aria-labelledby="data-hub-title">
        <h3 id="data-hub-title">Dados na análise</h3>
        <p className="data-hub__citizen-summary">
          Usamos <strong>mapa e rotas reais</strong> (OpenStreetMap/OSRM).{" "}
          <strong>Clima real</strong> via Open-Meteo quando disponível. Pluviômetros (CEMADEN), queimadas (NASA FIRMS) e
          camadas INPE estão em <strong>modo planejado/simulado</strong> no protótipo. Áreas de risco são configuradas
          para demonstração.
        </p>
        <div className="data-hub__citizen-badges">
          {entries.slice(0, 4).map((e) => (
            <span key={e.id} className={`data-hub__badge data-hub__badge--${e.badge.toLowerCase()}`}>
              {e.name}: {e.badge}
            </span>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="data-hub card" aria-labelledby="data-hub-title">
      <header className="data-hub__head">
        <h3 id="data-hub-title">Central de Dados OrbitTwin</h3>
        <p className="data-hub__intro">
          Fontes que alimentam a análise urbana. Usamos dados reais quando disponíveis e simulações controladas para
          demonstrar cenários críticos.
        </p>
      </header>

      <div className="data-hub__table-wrap">
        <table className="data-hub__table">
          <thead>
            <tr>
              <th>Fonte</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Selo</th>
              <th>Uso na análise</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <strong>{entry.name}</strong>
                  <br />
                  <small>{entry.provider}</small>
                </td>
                <td>{entry.type}</td>
                <td>
                  <span className={`data-hub__status data-hub__status--${entry.status}`}>{formatStatus(entry.status)}</span>
                </td>
                <td>
                  <span className={`data-hub__badge data-hub__badge--${entry.badge.toLowerCase()}`}>{entry.badge}</span>
                </td>
                <td>
                  {entry.usage}
                  {entry.detail && <small className="data-hub__detail">{entry.detail}</small>}
                  <small className="data-hub__updated">Atualizado: {formatTime(entry.lastUpdated)}</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatStatus(status: string): string {
  switch (status) {
    case "real":
      return "Online";
    case "fallback":
      return "Fallback";
    case "simulated":
      return "Simulado";
    case "planned":
      return "Planejado";
    default:
      return status;
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "—";
  }
}
