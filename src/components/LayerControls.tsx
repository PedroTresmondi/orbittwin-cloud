import type { DataHubBadge, MapLayerId, MapLayerVisibility } from "../types";

type LayerBadge = "Real" | "Simulado" | "Planejado" | "Fallback";

const LAYER_META: Record<MapLayerId, { label: string; defaultBadge: LayerBadge }> = {
  conventional: { label: "Rota convencional", defaultBadge: "Real" },
  safe: { label: "Rota segura", defaultBadge: "Real" },
  riskAreas: { label: "Zonas críticas", defaultBadge: "Simulado" },
  routeAlerts: { label: "Alertas de rota", defaultBadge: "Simulado" },
  blocks: { label: "Bloqueios", defaultBadge: "Simulado" },
  sensors: { label: "Sensores IoT", defaultBadge: "Simulado" },
  facilities: { label: "Hospitais / escolas", defaultBadge: "Simulado" },
  weather: { label: "Clima (painel)", defaultBadge: "Real" },
  rainStations: { label: "Pluviômetros / estações", defaultBadge: "Planejado" },
  fireHotspots: { label: "Focos de calor", defaultBadge: "Planejado" },
  satelliteLayers: { label: "Camadas satelitais", defaultBadge: "Planejado" },
};

type LayerControlsProps = {
  layers: MapLayerVisibility;
  onChange: (layers: MapLayerVisibility) => void;
  /** Badges vindos da Central de Dados após calcular rota */
  layerBadges?: Partial<Record<MapLayerId, DataHubBadge>>;
};

export function LayerControls({ layers, onChange, layerBadges }: LayerControlsProps) {
  return (
    <div className="map-layers" aria-label="Camadas do mapa">
      {(Object.keys(LAYER_META) as MapLayerId[]).map((layerId) => {
        const badge = layerBadges?.[layerId] ?? LAYER_META[layerId].defaultBadge;
        return (
          <label key={layerId} className="map-layers__item">
            <input
              type="checkbox"
              checked={layers[layerId]}
              onChange={() => onChange({ ...layers, [layerId]: !layers[layerId] })}
            />
            <span>
              {LAYER_META[layerId].label}
              <small className={`map-layers__badge map-layers__badge--${badge.toLowerCase()}`}>{badge}</small>
            </span>
          </label>
        );
      })}
    </div>
  );
}
