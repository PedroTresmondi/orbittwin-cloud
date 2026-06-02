import type { DataSourceEntry } from "../types";
import { formatSourceStatus, hasFallbackSource } from "../services/dataSourceService";

type DataSourcesPanelProps = {
  sources: DataSourceEntry[];
};

export function DataSourcesPanel({ sources }: DataSourcesPanelProps) {
  if (sources.length === 0) {
    return (
      <section className="data-sources card">
        <h3>Dados reais utilizados</h3>
        <p className="data-sources__hint">Calcule uma rota para ver o status das fontes.</p>
      </section>
    );
  }

  return (
    <section className="data-sources card" aria-labelledby="data-sources-title">
      <header className="data-sources__head">
        <h3 id="data-sources-title">Dados reais utilizados</h3>
        <p className="data-sources__intro">
          O OrbitTwin prioriza APIs reais e usa simulação apenas para demonstração de cenários críticos.
        </p>
      </header>
      <ul className="data-sources__list">
        {sources.map((entry) => (
          <li key={entry.id} className={`data-sources__item data-sources__item--${entry.status}`}>
            <span className="data-sources__name">
              {entry.label}: <em>{entry.provider}</em>
            </span>
            <span className={`data-sources__status data-sources__status--${entry.status}`}>
              {formatSourceStatus(entry.status)}
            </span>
            {entry.note && <span className="data-sources__note">{entry.note}</span>}
          </li>
        ))}
      </ul>
      {hasFallbackSource(sources) && (
        <p className="data-sources__warning" role="alert">
          Não foi possível acessar alguma fonte real. Usando dados simulados para manter a demonstração.
        </p>
      )}
    </section>
  );
}
