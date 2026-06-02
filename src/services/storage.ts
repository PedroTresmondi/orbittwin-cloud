import type { OperationalEvent } from "../types";

const HISTORY_KEY = "orbittwin:operational-history:v1";
const MAX_HISTORY_ITEMS = 8;

export function loadOperationalHistory(): OperationalEvent[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isOperationalEvent).slice(0, MAX_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

export function persistOperationalHistory(history: OperationalEvent[]): OperationalEvent[] {
  const nextHistory = history.slice(0, MAX_HISTORY_ITEMS);

  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
  } catch {
    // Local persistence is helpful, but the route workflow must continue without it.
  }

  return nextHistory;
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
    typeof candidate.decision === "string" &&
    typeof candidate.riskReduction === "number" &&
    typeof candidate.confidence === "number"
  );
}
