import type { Map as LeafletMap } from "leaflet";

export const MAP_PANE = {
  zones: "orbitZones",
  routeDanger: "orbitRouteDanger",
  routeSafe: "orbitRouteSafe",
  markers: "orbitMarkers",
} as const;

export function ensureMapPanes(map: LeafletMap): void {
  if (!map.getPane(MAP_PANE.zones)) {
    map.createPane(MAP_PANE.zones);
    map.getPane(MAP_PANE.zones)!.style.zIndex = "403";
  }
  if (!map.getPane(MAP_PANE.routeDanger)) {
    map.createPane(MAP_PANE.routeDanger);
    map.getPane(MAP_PANE.routeDanger)!.style.zIndex = "408";
  }
  if (!map.getPane(MAP_PANE.routeSafe)) {
    map.createPane(MAP_PANE.routeSafe);
    map.getPane(MAP_PANE.routeSafe)!.style.zIndex = "412";
  }
  if (!map.getPane(MAP_PANE.markers)) {
    map.createPane(MAP_PANE.markers);
    map.getPane(MAP_PANE.markers)!.style.zIndex = "620";
  }
}
