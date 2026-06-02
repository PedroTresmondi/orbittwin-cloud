import type { GeoPoint } from "../types";

export type RouteHazardKind = "flood" | "block" | "landslide" | "fire" | "critical";

export type RouteHazardSeverity = "medium" | "high" | "critical";

export type RouteHazard = {
  id: string;
  lat: number;
  lng: number;
  kind: RouteHazardKind;
  severity: RouteHazardSeverity;
  label: string;
  description?: string;
  recommendedAction?: string;
  zoneId?: string;
  onRoute?: boolean;
};

export type RouteCriticalSegment = {
  points: GeoPoint[];
  zoneId?: string;
  zoneName?: string;
};
