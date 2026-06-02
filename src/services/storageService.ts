import type { OperationalEvent } from "../types";

const HISTORY_KEY = "orbittwin:operational-history:v2";
const MAX_HISTORY_ITEMS = 20;

export function loadOperationalHistory(): OperationalEvent[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(isOperationalEvent).slice(0, MAX_HISTORY_ITEMS);
      }
    }

    return migrateLegacyHistory();
  } catch {
    return [];
  }
}

export function persistOperationalHistory(history: OperationalEvent[]): OperationalEvent[] {
  const nextHistory = history.slice(0, MAX_HISTORY_ITEMS);

  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
  } catch {
    // Persistência local é opcional; fluxo segue sem bloquear.
  }

  return nextHistory;
}

export function clearOperationalHistory(): void {
  try {
    window.localStorage.removeItem(HISTORY_KEY);
    window.localStorage.removeItem("orbittwin:operational-history:v1");
  } catch {
    // noop
  }
}

function migrateLegacyHistory(): OperationalEvent[] {
  try {
    const legacyRaw = window.localStorage.getItem("orbittwin:operational-history:v1");
    if (!legacyRaw) return [];

    const parsed = JSON.parse(legacyRaw);
    if (!Array.isArray(parsed)) return [];

    const migrated = parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => normalizeLegacyEvent(item as Record<string, unknown>))
      .filter(isOperationalEvent);

    if (migrated.length > 0) {
      persistOperationalHistory(migrated);
    }

    return migrated;
  } catch {
    return [];
  }
}

function normalizeLegacyEvent(raw: Record<string, unknown>): OperationalEvent | null {
  if (
    typeof raw.id !== "string" ||
    typeof raw.timestamp !== "string" ||
    typeof raw.origin !== "string" ||
    typeof raw.destination !== "string"
  ) {
    return null;
  }

  const conventionalRisk = typeof raw.conventionalRisk === "number" ? raw.conventionalRisk : 70;
  const safeRisk = typeof raw.safeRisk === "number" ? raw.safeRisk : 30;
  const riskReduction =
    typeof raw.riskReduction === "number" ? raw.riskReduction : Math.max(conventionalRisk - safeRisk, 0);

  return {
    id: raw.id,
    timestamp: raw.timestamp,
    region: typeof raw.region === "string" ? raw.region : "—",
    origin: raw.origin,
    destination: raw.destination,
    profile: isTravelProfile(raw.profile) ? raw.profile : "emergency",
    source: raw.source === "osrm" ? "osrm" : "fallback",
    conventionalRisk,
    safeRisk,
    conventionalTime: typeof raw.conventionalTime === "number" ? raw.conventionalTime : 0,
    safeTime: typeof raw.safeTime === "number" ? raw.safeTime : 0,
    conventionalDistanceKm: typeof raw.conventionalDistanceKm === "number" ? raw.conventionalDistanceKm : 0,
    safeDistanceKm: typeof raw.safeDistanceKm === "number" ? raw.safeDistanceKm : 0,
    exposureReduction: typeof raw.exposureReduction === "number" ? raw.exposureReduction : riskReduction,
    finalRecommendation:
      typeof raw.finalRecommendation === "string"
        ? raw.finalRecommendation
        : typeof raw.decision === "string"
          ? raw.decision
          : "Rota segura recomendada",
    riskReduction,
    confidence: typeof raw.confidence === "number" ? raw.confidence : 80,
    weatherSource: typeof raw.weatherSource === "string" ? raw.weatherSource : "—",
    geocodeSource: typeof raw.geocodeSource === "string" ? raw.geocodeSource : "—",
  };
}

function isOperationalEvent(value: unknown): value is OperationalEvent {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<OperationalEvent>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.timestamp === "string" &&
    typeof candidate.region === "string" &&
    typeof candidate.origin === "string" &&
    typeof candidate.destination === "string" &&
    typeof candidate.source === "string" &&
    typeof candidate.finalRecommendation === "string" &&
    typeof candidate.conventionalRisk === "number" &&
    typeof candidate.safeRisk === "number" &&
    typeof candidate.conventionalTime === "number" &&
    typeof candidate.safeTime === "number" &&
    typeof candidate.conventionalDistanceKm === "number" &&
    typeof candidate.safeDistanceKm === "number" &&
    typeof candidate.exposureReduction === "number" &&
    typeof candidate.riskReduction === "number" &&
    typeof candidate.confidence === "number" &&
    typeof candidate.weatherSource === "string" &&
    typeof candidate.geocodeSource === "string"
  );
}

function isTravelProfile(value: unknown): value is OperationalEvent["profile"] {
  return (
    value === "emergency" ||
    value === "public_transport" ||
    value === "utility" ||
    value === "pedestrian" ||
    value === "citizen" ||
    value === "driver"
  );
}
