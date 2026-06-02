import type { GeocodeResult } from "../types";

/** Zona exibida na apresentação GS — Marginal Tietê (alagamento crítico) */
export const GS_SHOWCASE_ZONE_ID = "marginal-tiete";

/**
 * Barra Funda → Tatuapé: trajeto natural tende a cruzar a margem do Tietê.
 * A demo garante passagem pela zona crítica na rota convencional e desvio na rota segura.
 */
export const GS_DETOUR_ROUTE = {
  originQuery: "Barra Funda, São Paulo",
  destinationQuery: "Tatuapé, São Paulo",
  origin: {
    label: "Barra Funda, São Paulo, SP",
    lat: -23.525,
    lng: -46.667,
    type: "suburb",
    importance: 0.85,
    source: "fallback",
  } satisfies GeocodeResult,
  destination: {
    label: "Tatuapé, São Paulo, SP",
    lat: -23.5403,
    lng: -46.5766,
    type: "suburb",
    importance: 0.86,
    source: "fallback",
  } satisfies GeocodeResult,
};

export const GS_SHOWCASE_ZONE_NAME = "Marginal Tietê";
