import type { SatelliteLayer } from "../types";

/**
 * Camadas espaciais — roadmap INPE TerraBrasilis (PRODES, DETER, etc.).
 * @see https://terrabrasilis.dpi.inpe.br/
 */
export async function getSatelliteLayers(): Promise<SatelliteLayer[]> {
  const updatedAt = new Date().toISOString();

  return [
    {
      id: "urban-water-index",
      name: "Índice de água urbana",
      type: "flood_index",
      source: "fallback",
      status: "planned",
      description: "Detecção de acúmulo hídrico em vias e baixadas — integração TerraBrasilis planejada.",
      updatedAt,
    },
    {
      id: "land-use",
      name: "Uso e ocupação do solo",
      type: "land_use",
      source: "fallback",
      status: "planned",
      description: "Classificação de impermeabilização e áreas verdes urbanas.",
      updatedAt,
    },
    {
      id: "vegetation-urban",
      name: "Vegetação urbana",
      type: "vegetation",
      source: "fallback",
      status: "planned",
      description: "Cobertura vegetal e sombreamento para microclima local.",
      updatedAt,
    },
    {
      id: "risk-territory",
      name: "Áreas sensíveis territoriais",
      type: "risk_area",
      source: "fallback",
      status: "planned",
      description: "Camadas ambientais nacionais para o gêmeo digital urbano.",
      updatedAt,
    },
  ];
}
