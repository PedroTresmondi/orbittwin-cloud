import type { EnvironmentalContext, GeoPoint, MapBounds } from "../types";
import { getFireHotspots, isFirmsApiConfigured } from "./fireService";
import { getRainStations } from "./rainStationService";
import { getSatelliteLayers } from "./satelliteLayerService";

export function boundsFromRoute(origin: GeoPoint, destination: GeoPoint, padding = 0.06): MapBounds {
  const south = Math.min(origin[0], destination[0]) - padding;
  const north = Math.max(origin[0], destination[0]) + padding;
  const west = Math.min(origin[1], destination[1]) - padding;
  const east = Math.max(origin[1], destination[1]) + padding;
  return { south, west, north, east };
}

export function emptyEnvironmentalContext(): EnvironmentalContext {
  const apiConfigured = isFirmsApiConfigured();
  return {
    fireHotspots: [],
    firesFeed: {
      status: apiConfigured ? "real" : "planned",
      apiConfigured,
    },
    rainStations: [],
    satelliteLayers: [],
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchEnvironmentalContext(
  origin: GeoPoint,
  destination: GeoPoint,
): Promise<EnvironmentalContext> {
  const bounds = boundsFromRoute(origin, destination);

  const [fireResult, rainStations, satelliteLayers] = await Promise.all([
    getFireHotspots(bounds),
    getRainStations(bounds),
    getSatelliteLayers(),
  ]);

  return {
    fireHotspots: fireResult.hotspots,
    firesFeed: fireResult.feed,
    rainStations,
    satelliteLayers,
    fetchedAt: new Date().toISOString(),
  };
}
