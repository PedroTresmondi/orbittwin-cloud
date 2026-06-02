import type { AlertType, OperationalPlace, OrbitTwinState, RegionKey, RiskLevel, SpatialKey, TravelProfile } from "./types";

export const REGION_KEYS: RegionKey[] = ["centro", "oeste", "leste", "tiete", "encosta", "sul"];

export const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high", "critical"];

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Baixo",
  medium: "Médio",
  high: "Alto",
  critical: "Crítico",
};

export const RISK_SCORE: Record<RiskLevel, number> = {
  low: 25,
  medium: 50,
  high: 75,
  critical: 95,
};

export const ALERT_LABELS: Record<AlertType, string> = {
  critical: "Crítico",
  warning: "Atenção",
  info: "Informativo",
};

export const SPATIAL_LABELS: Record<SpatialKey, string> = {
  ndwi: "NDWI urbano",
  precipitation: "Precipitação acumulada",
  surfaceTemp: "Temperatura de superfície",
  humidity: "Umidade estimada",
  cloudCover: "Cobertura de nuvens",
};

export const SATELLITES = ["GOES-16", "Sentinel-2", "Landsat-9", "COSMO-SkyMed", "SAOCOM-1A"] as const;

export const TRAVEL_PROFILE_LABELS: Record<TravelProfile, string> = {
  emergency: "Viatura emergencial",
  public_transport: "Transporte público",
  utility: "Equipe técnica",
  pedestrian: "Pedestre",
};

export const OPERATIONAL_PLACES: OperationalPlace[] = [
  { id: "praca-roosevelt", name: "Praça Roosevelt", region: "centro", coords: [-23.5444, -46.6466] },
  { id: "av-paulista", name: "Av. Paulista", region: "centro", coords: [-23.5614, -46.6559] },
  { id: "butanta", name: "Butantã", region: "oeste", coords: [-23.5719, -46.7081] },
  { id: "vila-leopoldina", name: "Vila Leopoldina", region: "oeste", coords: [-23.5278, -46.732] },
  { id: "itaquera", name: "Itaquera", region: "leste", coords: [-23.5401, -46.4705] },
  { id: "tatuape", name: "Tatuapé", region: "leste", coords: [-23.5403, -46.5766] },
  { id: "ponte-bandeiras", name: "Ponte das Bandeiras", region: "tiete", coords: [-23.518, -46.6318] },
  { id: "ceagesp", name: "CEAGESP", region: "tiete", coords: [-23.5378, -46.7354] },
  { id: "base-defesa-civil", name: "Base Defesa Civil", region: "encosta", coords: [-23.459, -46.633] },
  { id: "comunidade-encosta", name: "Comunidade da Encosta", region: "encosta", coords: [-23.431, -46.618] },
  { id: "terminal-grajau", name: "Terminal Grajaú", region: "sul", coords: [-23.7361, -46.6909] },
  { id: "interlagos", name: "Interlagos", region: "sul", coords: [-23.7035, -46.6995] },
  { id: "defesa-civil-central", name: "Defesa Civil Central", region: "centro", coords: [-23.5489, -46.6388] },
  { id: "hospital-tatuape", name: "Hospital Municipal Tatuapé", region: "leste", coords: [-23.5358, -46.5744] },
];

export const ROUTE_CRITICAL_SEGMENTS: Record<RegionKey, string[]> = {
  centro: ["Baixada do Anhangabaú", "Av. Nove de Julho", "Túnel com drenagem saturada", "Cruzamento República"],
  oeste: ["Ponte Cidade Universitária", "Av. Jaguaré", "Corredor Butantã", "Baixada da Vila Leopoldina"],
  leste: ["Av. Aricanduva", "Várzea ribeirinha", "Radial Leste", "Passagem sob trilhos"],
  tiete: ["Pista expressa Tietê", "Acesso Ponte das Bandeiras", "Trecho 3 de recalque", "Ciclovia marginal"],
  encosta: ["Estrada da encosta", "Curva de talude saturado", "Rua com trinca ativa", "Acesso geotécnico"],
  sul: ["Av. Interlagos", "Córrego canalizado", "Trecho junto ao piscinão", "Ponte local"],
};

export const ROUTE_AVOIDED_BLOCKS: Record<RegionKey, string[]> = {
  centro: ["Bloqueio preventivo no Anhangabaú", "Faixa com lâmina d'água", "Semáforo em contingência"],
  oeste: ["Alça com acúmulo hídrico", "Retorno interditado", "Ponto de erosão superficial"],
  leste: ["Baixada ribeirinha isolada", "Galeria pluvial no limite", "Travessia sob trilhos"],
  tiete: ["Pista junto ao rio", "Bomba de recalque em falha", "Acesso operacional bloqueado"],
  encosta: ["Talude instável", "Rua com queda de barreira", "Curva sem drenagem"],
  sul: ["Ponto de alagamento recorrente", "Passagem baixa monitorada", "Córrego em elevação"],
};

export const ZONE_CLASS_BY_REGION: Record<RegionKey, string> = {
  centro: "zone--centro",
  oeste: "zone--oeste",
  leste: "zone--leste",
  tiete: "zone--tiete",
  encosta: "zone--encosta",
  sul: "zone--sul",
};

export const INITIAL_STATE: OrbitTwinState = {
  lastReading: new Date(),
  selectedRegion: "centro",
  kpis: {
    cityRisk: { label: "Alto", score: 72 },
    regions: { active: 6, total: 6 },
    sensors: { active: 128, total: 132 },
    satellites: { count: 4, names: "GOES-16 · Sentinel-2" },
    criticalAlerts: 2,
  },
  regions: {
    centro: {
      name: "Centro Expandido",
      risk: "high",
      rain: "38 mm",
      sensors: "24 / 25",
      source: "Sentinel-2 · NDWI urbano",
      recommendation:
        "Ativar equipes de drenagem nas vias principais. Reforçar monitoramento de bueiros e alertar comércios em áreas baixas.",
    },
    leste: {
      name: "Zona Leste",
      risk: "critical",
      rain: "52 mm",
      sensors: "18 / 20",
      source: "GOES-16 · precipitação IR",
      recommendation:
        "Evacuação preventiva em bairros ribeirinhos. Acionar sirenes IoT e bloquear vias de acesso à margem do rio.",
    },
    oeste: {
      name: "Zona Oeste",
      risk: "medium",
      rain: "22 mm",
      sensors: "31 / 32",
      source: "Landsat-9 · umidade de superfície",
      recommendation:
        "Manter observação ativa. Preparar barreiras de contenção em pontos de alagamento recorrente.",
    },
    sul: {
      name: "Zona Sul",
      risk: "low",
      rain: "12 mm",
      sensors: "28 / 28",
      source: "SAOCOM-1A · radar SAR",
      recommendation: "Condições estáveis. Manter rotina de inspeção. Próxima passagem orbital em 12 minutos.",
    },
    tiete: {
      name: "Marginal Tietê",
      risk: "critical",
      rain: "48 mm",
      sensors: "15 / 18",
      source: "COSMO-SkyMed · nível hídrico",
      recommendation:
        "Nível do rio acima do limiar operacional. Fechar ciclovia marginal e acionar bombas de recalque nos trechos 3 e 7.",
    },
    encosta: {
      name: "Área de Encosta",
      risk: "high",
      rain: "41 mm",
      sensors: "12 / 15",
      source: "Sentinel-2 · inclinação + NDWI",
      recommendation:
        "Risco de deslizamento em encostas saturadas. Interditar trilhas e acionar monitoramento geotécnico contínuo.",
    },
  },
  routes: {
    centro: {
      originPlaceId: "praca-roosevelt",
      destinationPlaceId: "av-paulista",
      origin: "Praça Roosevelt",
      destination: "Av. Paulista",
      conventionalTime: 18,
      safeTime: 24,
      conventionalRisk: 78,
      safeRisk: 28,
      conventionalDistanceKm: 3.2,
      safeDistanceKm: 4.1,
      confidence: 86,
      source: "fallback",
      criticalSegments: ["Baixada do Anhangabaú", "Av. Nove de Julho", "Túnel com drenagem saturada"],
      avoidedBlocks: ["Bloqueio preventivo no Anhangabaú", "Faixa com lâmina d'água"],
      recommendation: "Priorizar eixo Consolação e evitar a baixada central até a drenagem voltar ao nível operacional.",
      map: {
        center: [-23.5505, -46.6502],
        originCoords: [-23.5444, -46.6466],
        destinationCoords: [-23.5614, -46.6559],
        conventionalPath: [
          [-23.5444, -46.6466],
          [-23.5482, -46.6481],
          [-23.5528, -46.6507],
          [-23.5571, -46.6534],
          [-23.5614, -46.6559],
        ],
        safePath: [
          [-23.5444, -46.6466],
          [-23.5448, -46.6594],
          [-23.5518, -46.6656],
          [-23.5588, -46.6624],
          [-23.5614, -46.6559],
        ],
        riskArea: [
          [-23.5486, -46.6445],
          [-23.5462, -46.6545],
          [-23.5548, -46.6598],
          [-23.5591, -46.6501],
        ],
        blocks: [
          [-23.5528, -46.6507],
          [-23.5571, -46.6534],
        ],
      },
    },
    oeste: {
      originPlaceId: "butanta",
      destinationPlaceId: "vila-leopoldina",
      origin: "Butantã",
      destination: "Vila Leopoldina",
      conventionalTime: 22,
      safeTime: 29,
      conventionalRisk: 58,
      safeRisk: 24,
      conventionalDistanceKm: 6.4,
      safeDistanceKm: 7.8,
      confidence: 82,
      source: "fallback",
      criticalSegments: ["Ponte Cidade Universitária", "Av. Jaguaré", "Baixada da Vila Leopoldina"],
      avoidedBlocks: ["Alça com acúmulo hídrico", "Retorno interditado"],
      recommendation: "Usar corredor elevado pela rota segura e manter distância dos retornos junto ao canal.",
      map: {
        center: [-23.548, -46.72],
        originCoords: [-23.5719, -46.7081],
        destinationCoords: [-23.5278, -46.732],
        conventionalPath: [
          [-23.5719, -46.7081],
          [-23.561, -46.7108],
          [-23.5488, -46.7165],
          [-23.5362, -46.7241],
          [-23.5278, -46.732],
        ],
        safePath: [
          [-23.5719, -46.7081],
          [-23.5625, -46.699],
          [-23.544, -46.7024],
          [-23.5315, -46.7158],
          [-23.5278, -46.732],
        ],
        riskArea: [
          [-23.5538, -46.7115],
          [-23.5445, -46.7078],
          [-23.5336, -46.7227],
          [-23.5425, -46.7315],
        ],
        blocks: [
          [-23.5488, -46.7165],
          [-23.5362, -46.7241],
        ],
      },
    },
    leste: {
      originPlaceId: "itaquera",
      destinationPlaceId: "tatuape",
      origin: "Itaquera",
      destination: "Tatuapé",
      conventionalTime: 27,
      safeTime: 35,
      conventionalRisk: 88,
      safeRisk: 34,
      conventionalDistanceKm: 11.1,
      safeDistanceKm: 13.4,
      confidence: 88,
      source: "fallback",
      criticalSegments: ["Av. Aricanduva", "Várzea ribeirinha", "Passagem sob trilhos"],
      avoidedBlocks: ["Baixada ribeirinha isolada", "Galeria pluvial no limite"],
      recommendation: "Priorizar rota segura pelo eixo norte e bloquear travessias sob trilhos até nova leitura orbital.",
      map: {
        center: [-23.5408, -46.5268],
        originCoords: [-23.5401, -46.4705],
        destinationCoords: [-23.5403, -46.5766],
        conventionalPath: [
          [-23.5401, -46.4705],
          [-23.5384, -46.4946],
          [-23.5396, -46.5204],
          [-23.5413, -46.5481],
          [-23.5403, -46.5766],
        ],
        safePath: [
          [-23.5401, -46.4705],
          [-23.5268, -46.4918],
          [-23.5234, -46.5288],
          [-23.531, -46.5582],
          [-23.5403, -46.5766],
        ],
        riskArea: [
          [-23.5328, -46.5066],
          [-23.532, -46.545],
          [-23.5482, -46.5548],
          [-23.5508, -46.515],
        ],
        blocks: [
          [-23.5396, -46.5204],
          [-23.5413, -46.5481],
        ],
      },
    },
    tiete: {
      originPlaceId: "ponte-bandeiras",
      destinationPlaceId: "ceagesp",
      origin: "Ponte das Bandeiras",
      destination: "CEAGESP",
      conventionalTime: 31,
      safeTime: 39,
      conventionalRisk: 92,
      safeRisk: 38,
      conventionalDistanceKm: 10.8,
      safeDistanceKm: 12.9,
      confidence: 90,
      source: "fallback",
      criticalSegments: ["Pista expressa Tietê", "Acesso Ponte das Bandeiras", "Trecho 3 de recalque"],
      avoidedBlocks: ["Pista junto ao rio", "Bomba de recalque em falha"],
      recommendation: "Desviar para vias internas e evitar todo trecho junto ao rio até estabilização dos sensores hídricos.",
      map: {
        center: [-23.5265, -46.6845],
        originCoords: [-23.518, -46.6318],
        destinationCoords: [-23.5378, -46.7354],
        conventionalPath: [
          [-23.518, -46.6318],
          [-23.5206, -46.6538],
          [-23.5238, -46.68],
          [-23.5298, -46.7078],
          [-23.5378, -46.7354],
        ],
        safePath: [
          [-23.518, -46.6318],
          [-23.5088, -46.6582],
          [-23.5075, -46.6884],
          [-23.52, -46.7188],
          [-23.5378, -46.7354],
        ],
        riskArea: [
          [-23.5188, -46.6625],
          [-23.515, -46.7068],
          [-23.5356, -46.716],
          [-23.5382, -46.6768],
        ],
        blocks: [
          [-23.5238, -46.68],
          [-23.5298, -46.7078],
        ],
      },
    },
    encosta: {
      originPlaceId: "base-defesa-civil",
      destinationPlaceId: "comunidade-encosta",
      origin: "Base Defesa Civil",
      destination: "Comunidade da Encosta",
      conventionalTime: 19,
      safeTime: 28,
      conventionalRisk: 82,
      safeRisk: 31,
      conventionalDistanceKm: 4.7,
      safeDistanceKm: 6.3,
      confidence: 84,
      source: "fallback",
      criticalSegments: ["Estrada da encosta", "Curva de talude saturado", "Rua com trinca ativa"],
      avoidedBlocks: ["Talude instável", "Rua com queda de barreira"],
      recommendation: "Subir pela rota segura de menor declividade e manter equipe fora do talude saturado.",
      map: {
        center: [-23.4448, -46.6245],
        originCoords: [-23.459, -46.633],
        destinationCoords: [-23.431, -46.618],
        conventionalPath: [
          [-23.459, -46.633],
          [-23.4515, -46.6296],
          [-23.4446, -46.626],
          [-23.437, -46.6215],
          [-23.431, -46.618],
        ],
        safePath: [
          [-23.459, -46.633],
          [-23.458, -46.6458],
          [-23.4478, -46.651],
          [-23.435, -46.6375],
          [-23.431, -46.618],
        ],
        riskArea: [
          [-23.4495, -46.6328],
          [-23.4388, -46.6335],
          [-23.4332, -46.6204],
          [-23.445, -46.6148],
        ],
        blocks: [
          [-23.4446, -46.626],
          [-23.437, -46.6215],
        ],
      },
    },
    sul: {
      originPlaceId: "terminal-grajau",
      destinationPlaceId: "interlagos",
      origin: "Terminal Grajaú",
      destination: "Interlagos",
      conventionalTime: 24,
      safeTime: 30,
      conventionalRisk: 36,
      safeRisk: 18,
      conventionalDistanceKm: 5.5,
      safeDistanceKm: 6.7,
      confidence: 76,
      source: "fallback",
      criticalSegments: ["Av. Interlagos", "Córrego canalizado", "Ponte local"],
      avoidedBlocks: ["Ponto de alagamento recorrente", "Passagem baixa monitorada"],
      recommendation: "Rota segura recomendada como contingência, com monitoramento leve dos corredores junto ao córrego.",
      map: {
        center: [-23.718, -46.6965],
        originCoords: [-23.7361, -46.6909],
        destinationCoords: [-23.7035, -46.6995],
        conventionalPath: [
          [-23.7361, -46.6909],
          [-23.728, -46.6932],
          [-23.72, -46.6968],
          [-23.7118, -46.699],
          [-23.7035, -46.6995],
        ],
        safePath: [
          [-23.7361, -46.6909],
          [-23.7312, -46.7066],
          [-23.7185, -46.711],
          [-23.7085, -46.7064],
          [-23.7035, -46.6995],
        ],
        riskArea: [
          [-23.724, -46.6905],
          [-23.715, -46.6908],
          [-23.7108, -46.701],
          [-23.7226, -46.7042],
        ],
        blocks: [
          [-23.72, -46.6968],
          [-23.7118, -46.699],
        ],
      },
    },
  },
  spatial: {
    ndwi: { value: 0.42, unit: "índice", bars: [30, 55, 42, 68, 45, 50, 42] },
    precipitation: { value: 45, unit: "mm", bars: [20, 35, 28, 45, 38, 42, 45] },
    surfaceTemp: { value: 28.4, unit: "°C", bars: [60, 55, 58, 62, 65, 63, 58] },
    humidity: { value: 82, unit: "%", bars: [70, 75, 78, 80, 82, 79, 82] },
    cloudCover: { value: 67, unit: "%", bars: [40, 50, 55, 60, 67, 65, 67] },
  },
  alerts: [
    {
      type: "critical",
      time: "14:32",
      region: "Marginal Tietê",
      recommendation: "Acionar protocolo de contenção hídrica. Nível do rio 1,2 m acima do limiar.",
    },
    {
      type: "critical",
      time: "14:28",
      region: "Zona Leste",
      recommendation: "Evacuação preventiva recomendada. IA indica 87% de probabilidade de alagamento severo.",
    },
    {
      type: "warning",
      time: "14:15",
      region: "Centro Expandido",
      recommendation: "Mobilizar equipes de drenagem. Acúmulo hídrico detectado em 3 pontos críticos.",
    },
    {
      type: "warning",
      time: "13:58",
      region: "Área de Encosta",
      recommendation: "Umidade do solo acima de 90%. Interditar trilhas e monitorar inclinômetros.",
    },
    {
      type: "info",
      time: "13:41",
      region: "Global",
      recommendation: "Nova leitura orbital processada. Resolução espacial de 10 m aplicada ao gêmeo digital.",
    },
  ],
};

export function createInitialState(): OrbitTwinState {
  return structuredClone(INITIAL_STATE);
}
