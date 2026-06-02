import { useMemo } from "react";
import { RISK_LABELS } from "../data";
import type { DecisionDashboardSnapshot } from "../types/decisionDashboard";

type UrbanRiskMiniMapProps = {
  zones: DecisionDashboardSnapshot["mapZones"];
  markers: DecisionDashboardSnapshot["mapMarkers"];
};

/** Grade 3×3 — cabe no painel gestor sem cortar colunas */
const ZONE_LAYOUT: Record<string, { row: number; col: number }> = {
  "zona-oeste": { row: 1, col: 1 },
  "marginal-tiete": { row: 1, col: 2 },
  "area-encosta": { row: 1, col: 3 },
  pinheiros: { row: 2, col: 1 },
  "centro-expandido": { row: 2, col: 2 },
  "zona-leste": { row: 2, col: 3 },
  "baixada-glicerio": { row: 3, col: 1 },
  "santo-amaro": { row: 3, col: 2 },
  "zona-sul": { row: 3, col: 3 },
};

const MARKER_SYMBOL: Record<string, string> = {
  sensor: "●",
  station: "◆",
  fire: "▲",
  block: "■",
};

export function UrbanRiskMiniMap({ zones, markers }: UrbanRiskMiniMapProps) {
  const markersByZone = useMemo(() => {
    const map = new Map<string, DecisionDashboardSnapshot["mapMarkers"]>();
    for (const marker of markers) {
      const list = map.get(marker.zoneId) ?? [];
      list.push(marker);
      map.set(marker.zoneId, list);
    }
    return map;
  }, [markers]);

  return (
    <section className="urban-risk-map glass-surface" aria-labelledby="urban-risk-map-title">
      <header className="urban-risk-map__head">
        <h3 id="urban-risk-map-title">Mapa de risco urbano</h3>
        <p>Visão sintética · São Paulo (protótipo)</p>
      </header>

      <div className="urban-risk-map__scroll">
        <div className="urban-risk-map__canvas" role="img" aria-label="Mapa simplificado de zonas de risco">
          {zones.map((zone) => {
            const pos = ZONE_LAYOUT[zone.id] ?? { row: 2, col: 2 };
            const zoneMarkers = markersByZone.get(zone.id) ?? [];
            const visible = zoneMarkers.slice(0, 3);
            const extra = zoneMarkers.length - visible.length;

            return (
              <div
                key={zone.id}
                className={`urban-risk-map__zone urban-risk-map__zone--${zone.riskLevel}${zone.highlight ? " is-highlight" : ""}`}
                style={{ gridRow: pos.row, gridColumn: pos.col }}
                title={`${zone.name}: ${RISK_LABELS[zone.riskLevel]}`}
              >
                <span className="urban-risk-map__zone-label">{zone.shortName}</span>
                {visible.length > 0 && (
                  <div className="urban-risk-map__zone-markers" aria-hidden="true">
                    {visible.map((m) => (
                      <span
                        key={m.id}
                        className={`urban-risk-map__marker urban-risk-map__marker--${m.type}`}
                        title={m.label}
                      >
                        {MARKER_SYMBOL[m.type]}
                      </span>
                    ))}
                    {extra > 0 && <span className="urban-risk-map__more">+{extra}</span>}
                  </div>
                )}
              </div>
            );
          })}
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
