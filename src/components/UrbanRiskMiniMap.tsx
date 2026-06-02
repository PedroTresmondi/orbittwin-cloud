import { RISK_LABELS } from "../data";
import type { DecisionDashboardSnapshot } from "../types/decisionDashboard";

type UrbanRiskMiniMapProps = {
  zones: DecisionDashboardSnapshot["mapZones"];
  markers: DecisionDashboardSnapshot["mapMarkers"];
};

const ZONE_LAYOUT: Record<string, { row: number; col: number }> = {
  "marginal-tiete": { row: 1, col: 2 },
  "centro-expandido": { row: 2, col: 2 },
  "baixada-glicerio": { row: 2, col: 3 },
  "zona-leste": { row: 2, col: 4 },
  "area-encosta": { row: 1, col: 4 },
  "zona-sul": { row: 3, col: 3 },
  "zona-oeste": { row: 2, col: 1 },
  pinheiros: { row: 3, col: 1 },
  "santo-amaro": { row: 3, col: 2 },
};

export function UrbanRiskMiniMap({ zones, markers }: UrbanRiskMiniMapProps) {
  return (
    <section className="urban-risk-map card" aria-labelledby="urban-risk-map-title">
      <header className="urban-risk-map__head">
        <h3 id="urban-risk-map-title">Mapa de risco urbano</h3>
        <p>Visão sintética · São Paulo (protótipo)</p>
      </header>
      <div className="urban-risk-map__canvas" role="img" aria-label="Mapa simplificado de zonas de risco">
        {zones.map((zone) => {
          const pos = ZONE_LAYOUT[zone.id] ?? { row: 2, col: 2 };
          return (
            <div
              key={zone.id}
              className={`urban-risk-map__zone urban-risk-map__zone--${zone.riskLevel}${zone.highlight ? " is-highlight" : ""}`}
              style={{ gridRow: pos.row, gridColumn: pos.col }}
              title={`${zone.name}: ${RISK_LABELS[zone.riskLevel]}`}
            >
              <span>{zone.shortName}</span>
            </div>
          );
        })}
        <div className="urban-risk-map__markers">
          {markers.map((m, i) => (
            <span
              key={m.id}
              className={`urban-risk-map__marker urban-risk-map__marker--${m.type}`}
              style={{ left: `${12 + (i % 4) * 22}%`, top: `${18 + Math.floor(i / 4) * 28}%` }}
              title={m.label}
            />
          ))}
        </div>
      </div>
      <ul className="urban-risk-map__legend">
        <li>
          <span className="urban-risk-map__swatch urban-risk-map__swatch--critical" /> Crítico
        </li>
        <li>
          <span className="urban-risk-map__swatch urban-risk-map__swatch--high" /> Alto
        </li>
        <li>
          <span className="urban-risk-map__swatch urban-risk-map__swatch--medium" /> Médio
        </li>
        <li>
          <span className="urban-risk-map__dot urban-risk-map__dot--sensor" /> Sensor
        </li>
        <li>
          <span className="urban-risk-map__dot urban-risk-map__dot--fire" /> Foco calor
        </li>
      </ul>
    </section>
  );
}
