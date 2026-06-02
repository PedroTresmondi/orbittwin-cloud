import L from "leaflet";
import { RISK_ZONES, RISK_ZONE_COLORS, type RiskZone } from "../data/riskZones";
import type { EnvironmentalContext, GeoPoint } from "../types";
import type { RouteCriticalSegment, RouteHazard } from "../types/routeHazard";
import { zoneCenterLabel } from "../services/routeHazardsService";
import { createBlockDivIcon, createHazardDivIcon, createZoneLabelDivIcon } from "./hazardIcons";
import { formatBlockPopup, formatHazardPopup } from "./hazardPopups";
import { MAP_PANE } from "./mapPanes";

const MAX_ZONE_LABELS = 3;
const ZONE_LABEL_MIN_ZOOM = 11;
const MAX_ROUTE_HAZARD_MARKERS = 6;

export type RenderRiskZonesOptions = {
  showAllRiskZones: boolean;
  riskArea: GeoPoint[];
  simulatedZoneIds: Set<string>;
  highlightZoneId?: string;
  crossedZoneIds: Set<string>;
  mapZoom?: number;
};

function zoneFillOpacity(zone: RiskZone, isShowcase: boolean, isSimulated: boolean): number {
  if (isShowcase) return 0.32;
  if (zone.riskLevel === "critical") return isSimulated ? 0.34 : 0.3;
  if (zone.riskLevel === "high") return 0.26;
  if (zone.riskLevel === "medium") return 0.22;
  return 0.2;
}

export function selectZonesForLabels(
  zones: RiskZone[],
  crossedIds: Set<string>,
  simulatedIds: Set<string>,
  highlightZoneId?: string,
): RiskZone[] {
  const score = (z: RiskZone) => {
    let s = 0;
    if (highlightZoneId && z.id === highlightZoneId) s += 100;
    if (crossedIds.has(z.id)) s += 50;
    if (simulatedIds.has(z.id)) s += 40;
    if (z.riskLevel === "critical") s += 30;
    if (z.riskLevel === "high") s += 20;
    return s;
  };

  return [...zones].sort((a, b) => score(b) - score(a)).slice(0, MAX_ZONE_LABELS);
}

export function renderRiskZones(options: RenderRiskZonesOptions): L.Layer[] {
  const { showAllRiskZones, riskArea, simulatedZoneIds, highlightZoneId, crossedZoneIds, mapZoom = 12 } = options;
  const layers: L.Layer[] = [];
  const showLabels = mapZoom >= ZONE_LABEL_MIN_ZOOM;
  const zonesToPaint = showAllRiskZones ? RISK_ZONES : [];
  const labelZones = showLabels
    ? selectZonesForLabels(zonesToPaint, crossedZoneIds, simulatedZoneIds, highlightZoneId)
    : [];
  const labelZoneIds = new Set(labelZones.map((z) => z.id));

  const paintZone = (zone: RiskZone) => {
    const colors = RISK_ZONE_COLORS[zone.riskLevel];
    const isSimulated = simulatedZoneIds.has(zone.id);
    const isShowcase = highlightZoneId && zone.id === highlightZoneId;
    const isCritical = zone.riskLevel === "critical" || zone.riskLevel === "high";

    layers.push(
      L.polygon(zone.polygon, {
        pane: MAP_PANE.zones,
        className: [
          "risk-zone-polygon",
          isCritical ? "risk-zone-polygon--critical" : "",
          isSimulated ? "risk-zone--simulated" : "",
          isShowcase ? "risk-zone--showcase" : "",
        ]
          .filter(Boolean)
          .join(" ") || undefined,
        color: isShowcase ? "#ff6b6b" : isCritical ? "#ef4444" : colors.stroke,
        fillColor: isShowcase ? "#ef4444" : isCritical ? "#f97316" : colors.fill,
        fillOpacity: zoneFillOpacity(zone, Boolean(isShowcase), isSimulated),
        opacity: 0.95,
        weight: isShowcase ? 3 : isCritical ? 2.5 : 2,
        dashArray: isSimulated ? "8 5" : undefined,
      }).bindPopup(
        `<div class="hazard-popup"><strong>${zone.name}</strong>
        <p class="hazard-popup__row"><span>Tipo</span> ${zone.type === "landslide" ? "Deslizamento" : zone.type === "traffic_block" ? "Bloqueio" : "Alagamento"}</p>
        <p class="hazard-popup__desc">${zone.description}</p>
        ${isSimulated ? "<p class=\"hazard-popup__row\"><em>Cenário simulado ativo</em></p>" : ""}
        <p class="hazard-popup__action"><span>Ação</span> Priorizar rota OrbitTwin segura.</p></div>`,
      ),
    );

    if (showLabels && labelZoneIds.has(zone.id)) {
      const lat = zone.polygon.reduce((s, p) => s + p[0], 0) / zone.polygon.length;
      const lng = zone.polygon.reduce((s, p) => s + p[1], 0) / zone.polygon.length;
      const severity = zone.riskLevel === "critical" ? "critical" : zone.riskLevel === "high" ? "high" : "medium";
      layers.push(
        L.marker([lat, lng], {
          icon: createZoneLabelDivIcon(zoneCenterLabel(zone), severity),
          interactive: false,
          zIndexOffset: 100,
        }),
      );
    }
  };

  if (showAllRiskZones) {
    zonesToPaint.forEach(paintZone);
  } else if (riskArea.length >= 3) {
    layers.push(
      L.polygon(riskArea, {
        pane: MAP_PANE.zones,
        className: "risk-zone-polygon risk-zone-polygon--critical",
        color: "#ef4444",
        fillColor: "#f97316",
        fillOpacity: 0.28,
        opacity: 0.95,
        weight: 2.5,
      }).bindPopup(
        `<div class="hazard-popup"><strong>Zona de risco</strong>
        <p class="hazard-popup__desc">Área de alagamento previsto no trajeto convencional.</p>
        <p class="hazard-popup__action"><span>Ação</span> Priorizar rota segura.</p></div>`,
      ),
    );
  }

  return layers;
}

export function renderConventionalRoute(
  path: GeoPoint[],
  criticalSegments: RouteCriticalSegment[],
): L.Layer[] {
  const layers: L.Layer[] = [];
  if (path.length < 2) return layers;

  layers.push(
    L.polyline(path, {
      pane: MAP_PANE.routeDanger,
      className: "route-line-leaflet route-line-leaflet--danger",
      color: "#ef4444",
      dashArray: "10 8",
      opacity: 0.82,
      weight: 4,
    }).bindPopup(
      `<div class="hazard-popup"><strong>Rota convencional</strong>
      <p class="hazard-popup__desc">Cruza ou encosta em zonas críticas.</p>
      <p class="hazard-popup__action"><span>Ação</span> Evitar e usar rota OrbitTwin.</p></div>`,
    ),
  );

  criticalSegments.forEach((seg) => {
    if (seg.points.length < 2) return;
    layers.push(
      L.polyline(seg.points, {
        pane: MAP_PANE.routeDanger,
        className: "route-line-leaflet route-line-leaflet--danger-critical",
        color: "#ff5555",
        opacity: 1,
        weight: 7,
        dashArray: "3 5",
      }).bindPopup(
        `<div class="hazard-popup"><strong>Trecho crítico</strong>
        ${seg.zoneName ? `<p class="hazard-popup__row"><span>Zona</span> ${seg.zoneName}</p>` : ""}
        <p class="hazard-popup__action"><span>Ação</span> Evitar rota convencional neste trecho.</p></div>`,
      ),
    );
  });

  return layers;
}

export function renderSafeRoute(path: GeoPoint[]): L.Layer | null {
  if (path.length < 2) return null;
  return L.polyline(path, {
    pane: MAP_PANE.routeSafe,
    className: "route-line-leaflet route-line-leaflet--safe",
    color: "#00d4ff",
    opacity: 0.98,
    weight: 6,
    lineCap: "round",
    lineJoin: "round",
    smoothFactor: 1.2,
  }).bindPopup(
    `<div class="hazard-popup hazard-popup--safe"><strong>Rota OrbitTwin segura</strong>
    <p class="hazard-popup__desc">Trajeto recomendado fora das zonas críticas.</p></div>`,
  );
}

function prioritizeHazards(hazards: RouteHazard[]): RouteHazard[] {
  const severityScore = { critical: 3, high: 2, medium: 1 };
  return [...hazards]
    .filter((h) => h.onRoute)
    .sort((a, b) => severityScore[b.severity] - severityScore[a.severity])
    .slice(0, MAX_ROUTE_HAZARD_MARKERS);
}

export function renderRouteHazards(hazards: RouteHazard[], routeOnly: boolean): L.Layer[] {
  const list = routeOnly ? prioritizeHazards(hazards) : hazards.filter((h) => !h.onRoute).slice(0, 3);

  return list.map((hazard) => {
    const marker = L.marker([hazard.lat, hazard.lng], {
      pane: MAP_PANE.markers,
      icon: createHazardDivIcon(hazard.kind, hazard.onRoute),
      zIndexOffset: hazard.onRoute ? 500 : 300,
    });
    marker.bindPopup(formatHazardPopup(hazard));
    return marker;
  });
}

export function renderBlockedSegments(blocks: GeoPoint[]): L.Layer[] {
  return blocks.map((coords, index) =>
    L.marker(coords, {
      pane: MAP_PANE.markers,
      icon: createBlockDivIcon(),
      zIndexOffset: 480,
    }).bindPopup(formatBlockPopup(index)),
  );
}

export function renderEnvironmentalMarkers(
  environmental: EnvironmentalContext,
  layers: { rain: boolean; fire: boolean },
): L.Layer[] {
  const out: L.Layer[] = [];
  if (layers.rain) {
    environmental.rainStations.forEach((station) => {
      out.push(
        L.circleMarker([station.lat, station.lng], {
          pane: MAP_PANE.markers,
          color: "#93c5fd",
          fillColor: "#2563eb",
          fillOpacity: 0.92,
          radius: 6,
          weight: 2,
        }).bindPopup(`<strong>${station.name}</strong><br/>Chuva 1h: ${station.rain1h ?? "—"} mm`),
      );
    });
  }
  if (layers.fire) {
    environmental.fireHotspots.slice(0, 4).forEach((hotspot) => {
      out.push(
        L.marker([hotspot.lat, hotspot.lng], {
          pane: MAP_PANE.markers,
          icon: createHazardDivIcon("fire"),
          zIndexOffset: 320,
        }).bindPopup(
          `<div class="hazard-popup"><strong>Foco de calor</strong>
          <p class="hazard-popup__row"><span>Severidade</span> Alta</p>
          <p class="hazard-popup__desc">Confiança ${hotspot.confidence ?? "—"}%.</p>
          <p class="hazard-popup__action"><span>Ação</span> Evitar proximidade na rota convencional.</p></div>`,
        ),
      );
    });
  }
  return out;
}
