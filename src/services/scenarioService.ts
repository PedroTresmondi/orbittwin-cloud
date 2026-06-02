import { RISK_ZONES, type RiskZone } from "../data/riskZones";
import type { GeoPoint, ScenarioKind, WeatherForecast } from "../types";

export const SCENARIO_LABELS: Record<ScenarioKind, string> = {
  real: "Dados reais ativos",
  heavy_rain: "Chuva forte simulada",
  flood: "Enchente / alagamento simulado",
  blockage: "Bloqueio de vias simulado",
  landslide: "Deslizamento / encosta simulado",
  multiple: "Múltiplos riscos simulados",
  clear: "Dados reais ativos",
};

const FLOOD_ZONE_IDS = ["marginal-tiete", "centro-expandido", "baixada-glicerio", "zona-leste"];
const LANDSLIDE_ZONE_ID = "area-encosta";

export function isScenarioActive(scenario: ScenarioKind): boolean {
  return scenario !== "real" && scenario !== "clear";
}

export function applyScenarioToZones(zones: RiskZone[], scenario: ScenarioKind): RiskZone[] {
  if (!isScenarioActive(scenario)) return zones;

  const elevate = (zone: RiskZone, level: RiskZone["riskLevel"]): RiskZone => ({
    ...zone,
    riskLevel: level,
    description: `${zone.description} (intensificado na simulação)`,
  });

  return zones.map((zone) => {
    if (scenario === "heavy_rain" || scenario === "multiple") {
      if (zone.riskLevel === "medium") return elevate(zone, "high");
      if (zone.riskLevel === "high") return elevate(zone, "critical");
    }

    if (scenario === "flood" || scenario === "multiple") {
      if (FLOOD_ZONE_IDS.includes(zone.id)) {
        return elevate(zone, "critical");
      }
    }

    if (scenario === "landslide" || scenario === "multiple") {
      if (zone.id === LANDSLIDE_ZONE_ID) {
        return elevate(zone, "critical");
      }
    }

    if (scenario === "blockage") {
      if (zone.riskLevel === "low") return elevate(zone, "medium");
    }

    return zone;
  });
}

export function getSimulatedZoneIds(scenario: ScenarioKind): string[] {
  if (!isScenarioActive(scenario)) return [];

  if (scenario === "flood") return [...FLOOD_ZONE_IDS];
  if (scenario === "landslide") return [LANDSLIDE_ZONE_ID];
  if (scenario === "heavy_rain") return RISK_ZONES.filter((z) => z.riskLevel !== "low").map((z) => z.id);
  if (scenario === "blockage") return ["centro-expandido", "marginal-tiete"];
  if (scenario === "multiple") {
    return [...new Set([...FLOOD_ZONE_IDS, LANDSLIDE_ZONE_ID, "centro-expandido"])];
  }
  return [];
}

export function getScenarioExtraBlocks(scenario: ScenarioKind, path: GeoPoint[]): GeoPoint[] {
  if (!isScenarioActive(scenario) || path.length < 2) return [];

  const blocks: GeoPoint[] = [];
  const mid = Math.floor(path.length / 2);
  const nearMid = path[mid] ?? path[0];

  if (scenario === "blockage" || scenario === "multiple" || scenario === "flood") {
    blocks.push([nearMid[0] + 0.004, nearMid[1] - 0.003]);
    blocks.push([nearMid[0] - 0.003, nearMid[1] + 0.004]);
  }

  if (scenario === "multiple") {
    const quarter = path[Math.floor(path.length / 4)] ?? path[0];
    blocks.push([quarter[0] + 0.002, quarter[1] + 0.002]);
  }

  return blocks;
}

export function applyScenarioToWeather(base: WeatherForecast, scenario: ScenarioKind): WeatherForecast {
  if (!isScenarioActive(scenario)) return base;

  const boosted: WeatherForecast = {
    ...base,
    isSimulated: true,
    dataStatus: "fallback",
    source: base.isSimulated ? "OrbitTwin simulado" : `${base.source} + cenário`,
  };

  if (scenario === "heavy_rain" || scenario === "multiple" || scenario === "flood") {
    boosted.precipitationNextHour = Math.max(boosted.precipitationNextHour, 18);
    boosted.precipitationNext2Hours = Math.max(boosted.precipitationNext2Hours, 42);
    boosted.precipitationProbability = Math.max(boosted.precipitationProbability, 88);
    boosted.humidity = Math.max(boosted.humidity, 90);
  }

  if (scenario === "flood" || scenario === "multiple") {
    boosted.precipitationNext2Hours = Math.max(boosted.precipitationNext2Hours, 55);
    boosted.precipitationProbability = Math.max(boosted.precipitationProbability, 92);
  }

  return boosted;
}

export function buildScenarioExplanations(scenario: ScenarioKind, realWeatherUsed: boolean): string[] {
  if (!isScenarioActive(scenario)) {
    return realWeatherUsed
      ? ["Análise baseada em clima real (Open-Meteo) e rotas reais (OSRM)."]
      : ["Clima em modo simulado por indisponibilidade da API; rotas seguem OSRM quando disponível."];
  }

  const lines: string[] = [`Simulação de ${SCENARIO_LABELS[scenario].toLowerCase()} ativada para demonstração.`];

  switch (scenario) {
    case "heavy_rain":
      lines.push("Precipitação simulada elevada nas próximas 2 horas para testar o modelo de risco.");
      break;
    case "flood":
      lines.push("Polígonos de alagamento simulados ativos no mapa (borda pulsante).");
      lines.push("A rota convencional tende a cruzar áreas alagadas simuladas.");
      break;
    case "blockage":
      lines.push("Bloqueios simulados adicionados ao trajeto convencional.");
      break;
    case "landslide":
      lines.push("Área de encosta simulada com risco crítico de deslizamento.");
      break;
    case "multiple":
      lines.push("Cenário crítico combinando chuva forte, alagamento e bloqueios para apresentação.");
      break;
    default:
      break;
  }

  lines.push("O OrbitTwin recalculou a rota alternativa para evitar os trechos mais críticos.");
  return lines;
}

export function computeDataMode(
  scenario: ScenarioKind,
  weather: WeatherForecast,
  routeSource: "osrm" | "fallback",
): "real" | "simulated" | "hybrid" {
  const scenarioOn = isScenarioActive(scenario);
  const realWeather = !weather.isSimulated && !scenarioOn;
  const realRoutes = routeSource === "osrm";

  if (scenarioOn && realRoutes) return "hybrid";
  if (scenarioOn) return "simulated";
  if (realWeather && realRoutes) return "real";
  return "hybrid";
}
