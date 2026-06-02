import type { GeocodeResult } from "../types";

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const SAO_PAULO_BBOX = "-46.95,-23.85,-46.25,-23.35";

/** Lugares conhecidos de São Paulo — fallback offline */
const LOCAL_FALLBACK: GeocodeResult[] = [
  { label: "Avenida Paulista, Bela Vista, São Paulo, SP", lat: -23.5614, lng: -46.6559, type: "road", importance: 0.9, source: "fallback" },
  { label: "MASP — Museu de Arte de São Paulo", lat: -23.5614, lng: -46.6565, type: "museum", importance: 0.85, source: "fallback" },
  { label: "Parque Ibirapuera, São Paulo, SP", lat: -23.5874, lng: -46.6576, type: "park", importance: 0.88, source: "fallback" },
  { label: "Pinheiros, São Paulo, SP", lat: -23.561, lng: -46.69, type: "suburb", importance: 0.8, source: "fallback" },
  { label: "Tatuapé, São Paulo, SP", lat: -23.5403, lng: -46.5766, type: "suburb", importance: 0.82, source: "fallback" },
  { label: "Estação Santo Amaro, São Paulo, SP", lat: -23.653, lng: -46.71, type: "station", importance: 0.84, source: "fallback" },
  { label: "Marginal Tietê, São Paulo, SP", lat: -23.5238, lng: -46.68, type: "road", importance: 0.86, source: "fallback" },
  { label: "Centro Histórico, São Paulo, SP", lat: -23.5489, lng: -46.6388, type: "district", importance: 0.83, source: "fallback" },
  { label: "CEAGESP, São Paulo, SP", lat: -23.5378, lng: -46.7354, type: "industrial", importance: 0.75, source: "fallback" },
  { label: "Aeroporto de Congonhas, São Paulo, SP", lat: -23.6261, lng: -46.6564, type: "aerodrome", importance: 0.87, source: "fallback" },
  { label: "Terminal Bandeira, São Paulo, SP", lat: -23.547, lng: -46.644, type: "station", importance: 0.78, source: "fallback" },
  { label: "Estação da Luz, São Paulo, SP", lat: -23.535, lng: -46.635, type: "station", importance: 0.8, source: "fallback" },
];

let lastRequestAt = 0;

export async function geocodePlace(query: string): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const fallbackMatches = searchLocalFallback(trimmed);
  if (fallbackMatches.length > 0 && trimmed.length < 4) {
    return fallbackMatches;
  }

  try {
    await throttleNominatim();
    const searchQuery = buildSearchQuery(trimmed);
    const params = new URLSearchParams({
      q: searchQuery,
      format: "json",
      addressdetails: "1",
      limit: "6",
      countrycodes: "br",
      viewbox: SAO_PAULO_BBOX,
      bounded: "1",
    });

    const response = await fetch(`${NOMINATIM_ENDPOINT}?${params}`, {
      headers: { Accept: "application/json", "Accept-Language": "pt-BR" },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) throw new Error(`Nominatim status ${response.status}`);

    const payload = (await response.json()) as NominatimResult[];
    const results = payload.map((item) => ({
      label: item.display_name,
      lat: Number.parseFloat(item.lat),
      lng: Number.parseFloat(item.lon),
      type: item.type ?? item.class ?? "place",
      importance: item.importance ?? 0.5,
      source: "nominatim" as const,
    }));

    if (results.length > 0) return results;
    return fallbackMatches.length > 0 ? fallbackMatches : searchLocalFallback(trimmed);
  } catch {
    return fallbackMatches.length > 0 ? fallbackMatches : searchLocalFallback(trimmed);
  }
}

export function resolveGeocode(query: string, selected?: GeocodeResult | null): GeocodeResult | null {
  if (selected) return selected;
  const matches = searchLocalFallback(query);
  return matches[0] ?? null;
}

export const EXAMPLE_ROUTE = {
  originQuery: "Avenida Paulista",
  destinationQuery: "Estação Santo Amaro",
  origin: LOCAL_FALLBACK[0],
  destination: LOCAL_FALLBACK[5],
};

function buildSearchQuery(query: string): string {
  const lower = query.toLowerCase();
  if (lower.includes("são paulo") || lower.includes("sao paulo") || lower.includes("sp")) {
    return query;
  }
  return `${query}, São Paulo, Brasil`;
}

function searchLocalFallback(query: string): GeocodeResult[] {
  const normalized = normalize(query);
  return LOCAL_FALLBACK.filter((place) => normalize(place.label).includes(normalized) || normalized.split(" ").every((w) => normalize(place.label).includes(w)));
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

async function throttleNominatim(): Promise<void> {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < 1100) {
    await new Promise((resolve) => setTimeout(resolve, 1100 - elapsed));
  }
  lastRequestAt = Date.now();
}

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
  importance?: number;
};
