import type { SatelliteLayer } from "../types";

type SatelliteLayersPanelProps = {
  layers: SatelliteLayer[];
};

export function SatelliteLayersPanel({ layers }: SatelliteLayersPanelProps) {
  if (layers.length === 0) return null;

  return (
    <section className="satellite-panel card">
      <h3>Dados espaciais / satélite (INPE)</h3>
      <p className="satellite-panel__hint">Camadas planejadas — integração TerraBrasilis em roadmap.</p>
      <ul className="satellite-panel__list">
        {layers.map((layer) => (
          <li key={layer.id} className="satellite-panel__item">
            <strong>{layer.name}</strong>
            <span className={`satellite-panel__badge satellite-panel__badge--${layer.status}`}>{layer.status}</span>
            <p>{layer.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
