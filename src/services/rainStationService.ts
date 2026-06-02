import type { MapBounds, RainStation } from "../types";

/**
 * Integração futura: API/mapas CEMADEN (pluviômetros automáticos).
 * @see https://mapainterativo.cemaden.gov.br/
 */
export async function getRainStations(bounds: MapBounds): Promise<RainStation[]> {
  await delay(120);
  return buildFallbackStations(bounds);
}

function buildFallbackStations(bounds: MapBounds): RainStation[] {
  const centerLat = (bounds.south + bounds.north) / 2;
  const centerLng = (bounds.west + bounds.east) / 2;

  const stations: RainStation[] = [
    {
      id: "cemaden-sp-01",
      name: "Pluviômetro — Marginal Tietê",
      lat: -23.52,
      lng: -46.68,
      rain1h: 8.4,
      rain24h: 42,
      stationType: "pluviometer",
      source: "fallback",
      status: "planned",
    },
    {
      id: "cemaden-sp-02",
      name: "Estação hidrológica — Pinheiros",
      lat: -23.56,
      lng: -46.69,
      rain1h: 5.2,
      rain24h: 28,
      stationType: "hydrological",
      source: "fallback",
      status: "planned",
    },
    {
      id: "cemaden-sp-03",
      name: "Estação geotécnica — Encosta Sul",
      lat: -23.61,
      lng: -46.66,
      rain1h: 3.1,
      rain24h: 19,
      stationType: "geotechnical",
      source: "fallback",
      status: "planned",
    },
    {
      id: "cemaden-sp-04",
      name: "Pluviômetro — Centro",
      lat: centerLat,
      lng: centerLng,
      rain1h: 6.8,
      rain24h: 35,
      stationType: "pluviometer",
      source: "fallback",
      status: "planned",
    },
  ];

  return stations.filter(
    (s) => s.lat >= bounds.south && s.lat <= bounds.north && s.lng >= bounds.west && s.lng <= bounds.east,
  ).length > 0
    ? stations.filter(
        (s) => s.lat >= bounds.south - 0.05 && s.lat <= bounds.north + 0.05 && s.lng >= bounds.west - 0.05 && s.lng <= bounds.east + 0.05,
      )
    : stations;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
