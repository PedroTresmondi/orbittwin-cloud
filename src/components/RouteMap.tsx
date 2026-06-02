import { useEffect, useRef } from "react";
import L from "leaflet";
import { FACILITY_POIS, SENSOR_POIS } from "../data";
import { RISK_ZONES } from "../data/riskZones";
import {
  renderBlockedSegments,
  renderConventionalRoute,
  renderEnvironmentalMarkers,
  renderRiskZones,
  renderRouteHazards,
  renderSafeRoute,
} from "../map/mapRenderers";
import { attachMapBaseLayers } from "../map/mapTiles";
import { ensureMapPanes, MAP_PANE } from "../map/mapPanes";
import { GS_SHOWCASE_ZONE_ID } from "../data/gsDetourDemo";
import { findCrossedZones } from "../utils/riskGeometry";
import type { EnvironmentalContext, MapLayerVisibility, RegionKey, RouteData } from "../types";

type RouteMapProps = {
  route: RouteData;
  regionKey: RegionKey;
  layers: MapLayerVisibility;
  onLayersChange: (layers: MapLayerVisibility) => void;
  environmental?: EnvironmentalContext;
  compact?: boolean;
  showAllRiskZones?: boolean;
  hideLayerUI?: boolean;
  /** Destaca zona crítica da demo GS (ex.: Marginal Tietê) */
  highlightZoneId?: string;
};

export function RouteMap({
  route,
  regionKey,
  layers,
  environmental,
  compact = false,
  showAllRiskZones = false,
  hideLayerUI: _hideLayerUI = false,
  highlightZoneId,
}: RouteMapProps) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayersRef = useRef<L.Layer[]>([]);
  /** Evita fitBounds a cada re-render (quebrava zoom e pan). */
  const lastFitKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) return;

    const leafletMap = L.map(mapNodeRef.current, {
      attributionControl: true,
      zoomControl: true,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
    }).setView(route.map.center, 12);

    attachMapBaseLayers(leafletMap);
    ensureMapPanes(leafletMap);

    mapRef.current = leafletMap;
    const resizeTimer = window.setTimeout(() => leafletMap.invalidateSize(), 250);

    return () => {
      window.clearTimeout(resizeTimer);
      routeLayersRef.current = [];
      leafletMap.remove();
      mapRef.current = null;
      lastFitKeyRef.current = null;
    };
  }, []);

  useEffect(() => {
    const leafletMap = mapRef.current;
    if (!leafletMap) return;

    routeLayersRef.current.forEach((layer) => leafletMap.removeLayer(layer));
    routeLayersRef.current = [];

    const nextLayers: L.Layer[] = [];
    const simulatedIds = new Set(route.map.simulatedZoneIds ?? []);
    const hazards = route.map.hazards ?? [];
    const pathCritical = route.map.criticalSegments ?? [];
    const zoneHighlight =
      highlightZoneId ??
      (route.map.simulatedZoneIds?.includes(GS_SHOWCASE_ZONE_ID) ? GS_SHOWCASE_ZONE_ID : undefined);
    const crossedIds = new Set(
      findCrossedZones(route.map.conventionalPath, RISK_ZONES).map((z) => z.id),
    );

    const currentZoom = leafletMap.getZoom();

    if (layers.riskAreas) {
      nextLayers.push(
        ...renderRiskZones({
          showAllRiskZones,
          riskArea: route.map.riskArea,
          simulatedZoneIds: simulatedIds,
          highlightZoneId: zoneHighlight,
          crossedZoneIds: crossedIds,
          mapZoom: currentZoom,
        }),
      );
    }

    if (layers.conventional) {
      nextLayers.push(...renderConventionalRoute(route.map.conventionalPath, pathCritical));
    }

    if (layers.safe) {
      const safeLine = renderSafeRoute(route.map.safePath);
      if (safeLine) nextLayers.push(safeLine);
    }

    if (layers.routeAlerts && hazards.length > 0) {
      nextLayers.push(...renderRouteHazards(hazards, true));
    }

    if (layers.blocks) {
      nextLayers.push(...renderBlockedSegments(route.map.blocks));
    }

    nextLayers.push(
      L.circleMarker(route.map.originCoords, {
        pane: MAP_PANE.markers,
        color: "#dbeafe",
        fillColor: "#3b82f6",
        fillOpacity: 0.95,
        radius: compact ? 7 : 9,
        weight: 2,
        className: "route-endpoint route-endpoint--origin",
      })
        .bindPopup(`Origem: ${route.origin}`)
        .bindTooltip("Origem", { direction: "top" }),
    );

    nextLayers.push(
      L.circleMarker(route.map.destinationCoords, {
        pane: MAP_PANE.markers,
        color: "#dcfce7",
        fillColor: "#22c55e",
        fillOpacity: 0.95,
        radius: compact ? 7 : 9,
        weight: 2,
        className: "route-endpoint route-endpoint--destination",
      })
        .bindPopup(`Destino: ${route.destination}`)
        .bindTooltip("Destino", { direction: "top" }),
    );

    if (layers.sensors) {
      const sensors = showAllRiskZones ? SENSOR_POIS : SENSOR_POIS.filter((poi) => poi.region === regionKey);
      sensors.forEach((sensor) => {
        nextLayers.push(
          L.circleMarker(sensor.coords, {
            pane: MAP_PANE.markers,
            color: "#67e8f9",
            fillColor: "#0891b2",
            fillOpacity: 0.9,
            radius: 5,
            weight: 2,
          }).bindPopup(sensor.name),
        );
      });
    }

    if (layers.facilities) {
      const facilities = showAllRiskZones
        ? FACILITY_POIS
        : FACILITY_POIS.filter((poi) => poi.region === regionKey || poi.region === "centro");
      facilities.forEach((facility) => {
        nextLayers.push(
          L.circleMarker(facility.coords, {
            pane: MAP_PANE.markers,
            color: "#fde68a",
            fillColor: "#eab308",
            fillOpacity: 0.9,
            radius: 6,
            weight: 2,
          }).bindPopup(facility.name),
        );
      });
    }

    if (environmental && (layers.rainStations || layers.fireHotspots)) {
      nextLayers.push(
        ...renderEnvironmentalMarkers(environmental, {
          rain: layers.rainStations,
          fire: layers.fireHotspots,
        }),
      );
    }

    nextLayers.forEach((layer) => layer.addTo(leafletMap));
    routeLayersRef.current = nextLayers;

    const fitKey = `${route.originPlaceId}|${route.destinationPlaceId}|${route.map.conventionalPath.length}|${route.map.safePath.length}`;
    if (lastFitKeyRef.current !== fitKey) {
      lastFitKeyRef.current = fitKey;
      const bounds = L.latLngBounds([...route.map.conventionalPath, ...route.map.safePath]);
      if (bounds.isValid()) {
        leafletMap.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
      } else {
        leafletMap.setView(route.map.center, 12);
      }
    }

    const resizeTimer = window.setTimeout(() => leafletMap.invalidateSize(), 150);
    return () => window.clearTimeout(resizeTimer);
  }, [route, regionKey, layers, showAllRiskZones, environmental, highlightZoneId, compact]);

  return (
    <div
      className={`routes-map-wrap routes-map-wrap--tactical routes-map-wrap--dark${compact ? " routes-map-wrap--compact" : ""}`}
    >
      <div className="route-map__meta">
        <span>Origem: {route.origin}</span>
        <span>Destino: {route.destination}</span>
      </div>

      <div className="routes-map-host">
        <div ref={mapNodeRef} className="routes-map" aria-label="Mapa operacional de rotas e riscos" />

        <div className="route-map__legend-float" aria-label="Legenda do mapa">
          <div className="route-map__legend-float-title">Legenda</div>
          <ul>
            <li>
              <i className="route-legend route-legend--safe" /> Ciano — rota OrbitTwin segura
            </li>
            <li>
              <i className="route-legend route-legend--danger" /> Vermelho — rota convencional
            </li>
            <li>
              <i className="route-legend route-legend--high" /> Laranja — zona de risco
            </li>
            <li>
              <i className="route-legend route-legend--alert-triangle" /> Triângulo — ponto crítico
            </li>
            <li>
              <i className="route-legend route-legend--block-dot" /> Círculo — bloqueio previsto
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
