import type { DataHubBadge, MapLayerId, MapLayerVisibility } from "../types";
import { GlassDrawer } from "./GlassDrawer";
import { LayerControls } from "./LayerControls";

type MapLayersDrawerProps = {
  open: boolean;
  onClose: () => void;
  layers: MapLayerVisibility;
  onChange: (layers: MapLayerVisibility) => void;
  layerBadges?: Partial<Record<MapLayerId, DataHubBadge>>;
};

export function MapLayersDrawer({ open, onClose, layers, onChange, layerBadges }: MapLayersDrawerProps) {
  return (
    <GlassDrawer open={open} onClose={onClose} title="Camadas do mapa" side="right">
      <p className="map-layers-drawer__hint">Ative ou desative o que aparece no mapa da rota.</p>
      <LayerControls layers={layers} onChange={onChange} layerBadges={layerBadges} />
    </GlassDrawer>
  );
}
