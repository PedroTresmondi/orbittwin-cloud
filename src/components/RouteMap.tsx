import { useEffect, useRef } from "react";
import L from "leaflet";
import { FACILITY_POIS, SENSOR_POIS } from "../data";
import { RISK_ZONES, RISK_ZONE_COLORS } from "../data/riskZones";
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
};

export function RouteMap({
  route,
  regionKey,
  layers,
  onLayersChange,
  environmental,
  compact = false,
  showAllRiskZones = false,
  hideLayerUI = false,
}: RouteMapProps) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayersRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) return;

    const leafletMap = L.map(mapNodeRef.current, {
      attributionControl: true,
      zoomControl: true,
    }).setView(route.map.center, 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(leafletMap);

    mapRef.current = leafletMap;
    const resizeTimer = window.setTimeout(() => leafletMap.invalidateSize(), 250);

    return () => {
      window.clearTimeout(resizeTimer);
      routeLayersRef.current = [];
      leafletMap.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const leafletMap = mapRef.current;
    if (!leafletMap) return;

    routeLayersRef.current.forEach((layer) => leafletMap.removeLayer(layer));
    routeLayersRef.current = [];

    const nextLayers: L.Layer[] = [];

    const simulatedIds = new Set(route.map.simulatedZoneIds ?? []);

    if (layers.riskAreas) {
      if (showAllRiskZones) {
        RISK_ZONES.forEach((zone) => {
          const colors = RISK_ZONE_COLORS[zone.riskLevel];
          const isSimulated = simulatedIds.has(zone.id);
          nextLayers.push(
            L.polygon(zone.polygon, {
              className: isSimulated ? "risk-zone--simulated" : undefined,
              color: colors.stroke,
              fillColor: colors.fill,
              fillOpacity: zone.riskLevel === "low" ? 0.12 : zone.riskLevel === "medium" ? 0.2 : 0.38,
              opacity: isSimulated ? 1 : 0.85,
              weight: zone.riskLevel === "critical" || isSimulated ? 3 : 2,
            }).bindPopup(
              `<strong>${zone.name}</strong><br/>${zone.description}${isSimulated ? "<br/><em>Evento simulado</em>" : ""}`,
            ),
          );
        });
      } else {
        nextLayers.push(
          L.polygon(route.map.riskArea, {
            color: "#ef4444",
            fillColor: "#f97316",
            fillOpacity: 0.28,
            opacity: 0.9,
            weight: 2,
          }).bindPopup("Área de risco / alagamento previsto"),
        );
      }
    }

    if (layers.conventional) {
      nextLayers.push(
        L.polyline(route.map.conventionalPath, {
          color: "#ef4444",
          dashArray: "8 8",
          opacity: 0.95,
          weight: 5,
        }).bindPopup("Rota convencional"),
      );
    }

    if (layers.safe && route.map.safePath.length >= 2) {
      nextLayers.push(
        L.polyline(route.map.safePath, {
          color: "#00d4ff",
          opacity: 0.96,
          weight: 5,
          lineCap: "round",
          lineJoin: "round",
          smoothFactor: 1.2,
        }).bindPopup("Rota OrbitTwin segura"),
      );
    }

    nextLayers.push(
      L.circleMarker(route.map.originCoords, {
        color: "#dbeafe",
        fillColor: "#3b82f6",
        fillOpacity: 0.95,
        radius: 9,
        weight: 2,
      })
        .bindPopup(`Origem: ${route.origin}`)
        .bindTooltip("Origem", { direction: "top" }),
    );

    nextLayers.push(
      L.circleMarker(route.map.destinationCoords, {
        color: "#dcfce7",
        fillColor: "#22c55e",
        fillOpacity: 0.95,
        radius: 9,
        weight: 2,
      })
        .bindPopup(`Destino: ${route.destination}`)
        .bindTooltip("Destino", { direction: "top" }),
    );

    if (layers.blocks) {
      route.map.blocks.forEach((coords, index) => {
        nextLayers.push(
          L.circleMarker(coords, {
            color: "#fecaca",
            fillColor: "#ef4444",
            fillOpacity: 0.95,
            radius: 8,
            weight: 2,
          })
            .bindPopup(`Bloqueio previsto B${index + 1}`)
            .bindTooltip(`B${index + 1}`, { direction: "right" }),
        );
      });
    }

    if (layers.sensors) {
      const sensors = showAllRiskZones ? SENSOR_POIS : SENSOR_POIS.filter((poi) => poi.region === regionKey);
      sensors.forEach((sensor) => {
        nextLayers.push(
          L.circleMarker(sensor.coords, {
            color: "#67e8f9",
            fillColor: "#0891b2",
            fillOpacity: 0.9,
            radius: 6,
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
            color: "#fde68a",
            fillColor: "#eab308",
            fillOpacity: 0.9,
            radius: 7,
            weight: 2,
          }).bindPopup(facility.name),
        );
      });
    }

    if (layers.rainStations && environmental) {
      environmental.rainStations.forEach((station) => {
        nextLayers.push(
          L.circleMarker([station.lat, station.lng], {
            color: "#93c5fd",
            fillColor: "#2563eb",
            fillOpacity: 0.92,
            radius: 7,
            weight: 2,
          }).bindPopup(
            `<strong>${station.name}</strong><br/>Chuva 1h: ${station.rain1h ?? "—"} mm<br/>Chuva 24h: ${station.rain24h ?? "—"} mm<br/>Tipo: ${station.stationType}<br/>Fonte: ${station.source} (${station.status})`,
          ),
        );
      });
    }

    if (layers.fireHotspots && environmental) {
      environmental.fireHotspots.forEach((hotspot) => {
        nextLayers.push(
          L.circleMarker([hotspot.lat, hotspot.lng], {
            color: "#ffedd5",
            fillColor: "#ea580c",
            fillOpacity: 0.95,
            radius: 8,
            weight: 2,
            className: "fire-hotspot-marker",
          }).bindPopup(
            `<strong>Foco de calor</strong><br/>Confiança: ${hotspot.confidence ?? "—"}%<br/>Fonte: ${hotspot.source} (${hotspot.status})`,
          ),
        );
      });
    }

    nextLayers.forEach((layer) => layer.addTo(leafletMap));
    routeLayersRef.current = nextLayers;

    const bounds = L.latLngBounds([...route.map.conventionalPath, ...route.map.safePath]);
    if (bounds.isValid()) {
      leafletMap.fitBounds(bounds, { padding: [32, 32] });
    } else {
      leafletMap.setView(route.map.center, 12);
    }

    const resizeTimer = window.setTimeout(() => leafletMap.invalidateSize(), 150);
    return () => window.clearTimeout(resizeTimer);
  }, [route, regionKey, layers, showAllRiskZones, environmental]);

  return (
    <div className={`routes-map-wrap${compact ? " routes-map-wrap--compact" : ""}`}>
      <div className="route-map__meta">
        <span>Origem: {route.origin}</span>
        <span>Destino: {route.destination}</span>
      </div>

      <div ref={mapNodeRef} className="routes-map" aria-label="Mapa com rotas e camadas operacionais" />

      <div className="route-map__legend">
        <span>
          <i className="route-legend route-legend--safe" /> Rota segura (ciano)
        </span>
        <span>
          <i className="route-legend route-legend--danger" /> Convencional (risco)
        </span>
        <span>
          <i className="route-legend route-legend--high" /> Área de risco
        </span>
        <span>
          <i className="route-legend route-legend--simulated" /> Evento simulado
        </span>
        <span>
          <i className="route-legend route-legend--block" /> Bloqueio
        </span>
        <span>
          <i className="route-legend route-legend--rain" /> Pluviômetro
        </span>
        <span>
          <i className="route-legend route-legend--fire" /> Foco de calor
        </span>
      </div>
    </div>
  );
}
