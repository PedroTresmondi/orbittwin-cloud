import type { MapLayerId, MapLayerVisibility } from "../types";

const LABELS: Record<MapLayerId, string> = {
  conventional: "Rota convencional",
  safe: "Rota segura",
  riskAreas: "Áreas de risco",
  blocks: "Bloqueios",
  sensors: "Sensores IoT",
  facilities: "Hospitais / escolas",
  weather: "Dados climáticos",
};

type LayerControlsProps = {
  layers: MapLayerVisibility;
  onChange: (layers: MapLayerVisibility) => void;
};

export function LayerControls({ layers, onChange }: LayerControlsProps) {
  return (
    <div className="map-layers" aria-label="Camadas do mapa">
      {(Object.keys(LABELS) as MapLayerId[]).map((layerId) => (
        <label key={layerId} className="map-layers__item">
          <input
            type="checkbox"
            checked={layers[layerId]}
            onChange={() => onChange({ ...layers, [layerId]: !layers[layerId] })}
          />
          <span>{LABELS[layerId]}</span>
        </label>
      ))}
    </div>
  );
}
