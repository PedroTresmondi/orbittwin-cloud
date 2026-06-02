import type { GeoPoint, WeatherForecast } from "../types";

const OPEN_METEO_ENDPOINT = "https://api.open-meteo.com/v1/forecast";

export async function getWeatherForecast(lat: number, lng: number): Promise<WeatherForecast> {
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      current: "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m",
      hourly: "precipitation,precipitation_probability,temperature_2m,relative_humidity_2m,wind_speed_10m",
      forecast_hours: "3",
      timezone: "America/Sao_Paulo",
    });

    const response = await fetch(`${OPEN_METEO_ENDPOINT}?${params}`, {
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) throw new Error(`Open-Meteo status ${response.status}`);

    const data = (await response.json()) as OpenMeteoResponse;
    const hourly = data.hourly;

    const precipitationNextHour = sumNext(hourly?.precipitation, 1);
    const precipitationNext2Hours = sumNext(hourly?.precipitation, 2);
    const precipitationProbability = maxNext(hourly?.precipitation_probability, 2);

    return {
      precipitationNextHour: round(precipitationNextHour, 1),
      precipitationNext2Hours: round(precipitationNext2Hours, 1),
      precipitationProbability: Math.round(precipitationProbability),
      temperature: round(data.current?.temperature_2m ?? hourly?.temperature_2m?.[0] ?? 24, 1),
      humidity: Math.round(data.current?.relative_humidity_2m ?? hourly?.relative_humidity_2m?.[0] ?? 70),
      windSpeed: round(data.current?.wind_speed_10m ?? hourly?.wind_speed_10m?.[0] ?? 12, 1),
      source: "Open-Meteo",
      fetchedAt: new Date().toISOString(),
      isSimulated: false,
      dataStatus: "real",
    };
  } catch {
    return buildMockForecast(lat, lng);
  }
}

export async function getWeatherForRoute(origin: GeoPoint, destination: GeoPoint): Promise<WeatherForecast> {
  const mid: GeoPoint = [(origin[0] + destination[0]) / 2, (origin[1] + destination[1]) / 2];
  return getWeatherForecast(mid[0], mid[1]);
}

export function parseRainMm(value: number | string): number {
  if (typeof value === "number") return value;
  const match = value.match(/(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 20;
}

function buildMockForecast(lat: number, lng: number): WeatherForecast {
  const seed = Math.abs(Math.sin(lat * 100 + lng * 100));
  const rain = round(8 + seed * 35, 1);

  return {
    precipitationNextHour: round(rain * 0.45, 1),
    precipitationNext2Hours: rain,
    precipitationProbability: Math.round(40 + seed * 50),
    temperature: round(22 + seed * 8, 1),
    humidity: Math.round(65 + seed * 25),
    windSpeed: round(8 + seed * 14, 1),
    source: "OrbitTwin simulado",
    fetchedAt: new Date().toISOString(),
    isSimulated: true,
    dataStatus: "fallback",
  };
}

function sumNext(values: number[] | undefined, hours: number): number {
  if (!values?.length) return 0;
  return values.slice(0, hours).reduce((sum, value) => sum + value, 0);
}

function maxNext(values: number[] | undefined, hours: number): number {
  if (!values?.length) return 0;
  return Math.max(...values.slice(0, hours));
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    precipitation?: number;
    wind_speed_10m?: number;
  };
  hourly?: {
    precipitation?: number[];
    precipitation_probability?: number[];
    temperature_2m?: number[];
    relative_humidity_2m?: number[];
    wind_speed_10m?: number[];
  };
};
