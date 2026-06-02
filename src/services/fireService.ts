import type { DataFeedStatus, FireHotspot, MapBounds } from "../types";

const FIRMS_AREA_ENDPOINT = "https://firms.modaps.eosdis.nasa.gov/api/area/csv";

export type FireHotspotsResult = {
  hotspots: FireHotspot[];
  feed: {
    status: DataFeedStatus;
    apiConfigured: boolean;
    apiOnline?: boolean;
  };
};

/** Chave em `.env.local`: VITE_NASA_FIRMS_MAP_KEY=... (reinicie o `npm run dev`) */
export function isFirmsApiConfigured(): boolean {
  return Boolean(getFirmsMapKey());
}

function getFirmsMapKey(): string | undefined {
  const raw = import.meta.env.VITE_NASA_FIRMS_MAP_KEY;
  if (typeof raw !== "string") return undefined;
  const key = raw.trim();
  return key.length > 4 ? key : undefined;
}

export async function getFireHotspots(bounds: MapBounds): Promise<FireHotspotsResult> {
  const mapKey = getFirmsMapKey();
  const apiConfigured = Boolean(mapKey);

  if (mapKey) {
    try {
      const area = `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`;
      const url = `${FIRMS_AREA_ENDPOINT}/${mapKey}/VIIRS_NOAA20_NRT/${area}/1`;
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (response.ok) {
        const text = await response.text();
        const parsed = parseFirmsCsv(text);
        if (parsed.length > 0) {
          return {
            hotspots: parsed.map((row, index) => ({
              id: `firms-${index}-${row.lat}`,
              lat: row.lat,
              lng: row.lng,
              brightness: row.brightness,
              confidence: row.confidence,
              detectedAt: row.acqDate,
              source: "NASA FIRMS" as const,
              status: "real" as const,
            })),
            feed: { status: "real", apiConfigured: true, apiOnline: true },
          };
        }
        return {
          hotspots: [],
          feed: { status: "real", apiConfigured: true, apiOnline: true },
        };
      }
    } catch {
      // fallback abaixo
    }

    return {
      hotspots: buildFallbackHotspots(bounds, "fallback"),
      feed: { status: "fallback", apiConfigured: true, apiOnline: false },
    };
  }

  return {
    hotspots: buildFallbackHotspots(bounds, "planned"),
    feed: { status: "planned", apiConfigured: false },
  };
}

function parseFirmsCsv(csv: string): Array<{
  lat: number;
  lng: number;
  brightness?: number;
  confidence?: number;
  acqDate?: string;
}> {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const latIdx = header.indexOf("latitude");
  const lngIdx = header.indexOf("longitude");
  if (latIdx < 0 || lngIdx < 0) return [];

  const brightIdx = header.indexOf("bright_ti4");
  const confIdx = header.indexOf("confidence");
  const dateIdx = header.indexOf("acq_date");

  return lines.slice(1, 40).flatMap((line) => {
    const cols = line.split(",");
    const lat = Number.parseFloat(cols[latIdx]);
    const lng = Number.parseFloat(cols[lngIdx]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
    return [
      {
        lat,
        lng,
        brightness: brightIdx >= 0 ? Number.parseFloat(cols[brightIdx]) : undefined,
        confidence: confIdx >= 0 ? Number.parseFloat(cols[confIdx]) : undefined,
        acqDate: dateIdx >= 0 ? cols[dateIdx] : undefined,
      },
    ];
  });
}

function buildFallbackHotspots(bounds: MapBounds, status: DataFeedStatus): FireHotspot[] {
  const centerLat = (bounds.south + bounds.north) / 2;
  const centerLng = (bounds.west + bounds.east) / 2;
  const now = new Date().toISOString();

  return [
    {
      id: "fb-1",
      lat: centerLat + 0.012,
      lng: centerLng - 0.018,
      brightness: 320,
      confidence: 78,
      detectedAt: now,
      source: "fallback",
      status,
    },
    {
      id: "fb-2",
      lat: centerLat - 0.008,
      lng: centerLng + 0.022,
      brightness: 290,
      confidence: 65,
      detectedAt: now,
      source: "fallback",
      status,
    },
  ];
}
