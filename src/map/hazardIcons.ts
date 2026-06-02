import L from "leaflet";
import type { RouteHazardKind } from "../types/routeHazard";

/** Ícones SVG neon compactos (24px) */
const SVG: Record<RouteHazardKind, string> = {
  flood: `<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="#f97316" d="M12 3 4 14h16L12 3zm0 18c-1.5 0-2.7-1.2-2.7-2.7h5.4c0 1.5-1.2 2.7-2.7 2.7z"/></svg>`,
  block: `<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="#ef4444"/><path fill="#1a0a0a" d="M8 8h8v8H8z"/></svg>`,
  landslide: `<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="#fb923c" d="m4 18 8-14 8 14H4z"/></svg>`,
  fire: `<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="#ea580c" d="M12 2c2 4 6 6 6 10a6 6 0 1 1-12 0c0-4 4-6 6-10z"/></svg>`,
  critical: `<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="#ff6b6b" d="M12 3 2 21h20L12 3zm0 6 1 8h-2l1-8zm0 10a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5z"/></svg>`,
};

function hazardHtml(kind: RouteHazardKind, onRoute: boolean, shape: "triangle" | "circle"): string {
  const shapeClass = shape === "circle" ? "hazard-marker--shape-circle" : "hazard-marker--shape-triangle";
  return `<div class="hazard-marker hazard-marker--${kind}${onRoute ? " hazard-marker--on-route" : ""} ${shapeClass}" role="img" aria-hidden="true">
    <span class="hazard-marker__glyph">${SVG[kind]}</span>
  </div>`;
}

export function createHazardDivIcon(kind: RouteHazardKind, onRoute = false): L.DivIcon {
  const shape = kind === "block" ? "circle" : "triangle";
  return L.divIcon({
    className: "",
    html: hazardHtml(kind, onRoute, shape),
    iconSize: [22, 22],
    iconAnchor: [11, kind === "block" ? 11 : 19],
    popupAnchor: [0, -12],
  });
}

export function createZoneLabelDivIcon(label: string, severity: "medium" | "high" | "critical"): L.DivIcon {
  const mod = severity === "critical" ? "critical" : severity === "high" ? "high" : "medium";
  return L.divIcon({
    className: "",
    html: `<div class="zone-center-label zone-center-label--compact zone-center-label--${mod}">${label}</div>`,
    iconSize: [72, 18],
    iconAnchor: [36, 9],
  });
}

export function createBlockDivIcon(): L.DivIcon {
  return createHazardDivIcon("block", true);
}
