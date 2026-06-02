import { useCallback, useState } from "react";
import { EXAMPLE_ROUTE } from "../services/geocodingService";
import { buildOperationalEvent, buildSimulationReport, planSafeRoute } from "../services/routeService";
import { persistOperationalHistory, loadOperationalHistory } from "../services/storageService";
import { formatDateTime } from "../simulation";
import type {
  AppMode,
  GeocodeResult,
  OperationalEvent,
  PlannedRouteResult,
  PlannerProfile,
  SimulationReport,
} from "../types";

export type PlannerFormState = {
  originQuery: string;
  destinationQuery: string;
  origin: GeocodeResult | null;
  destination: GeocodeResult | null;
  profile: PlannerProfile;
};

const INITIAL_FORM: PlannerFormState = {
  originQuery: "",
  destinationQuery: "",
  origin: null,
  destination: null,
  profile: "citizen",
};

export function useSafeRoutePlanner(mode: AppMode) {
  const [form, setForm] = useState<PlannerFormState>(INITIAL_FORM);
  const [planned, setPlanned] = useState<PlannedRouteResult | null>(null);
  const [history, setHistory] = useState<OperationalEvent[]>(() => loadOperationalHistory());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<SimulationReport | null>(null);

  const applyExample = useCallback(() => {
    setForm({
      originQuery: EXAMPLE_ROUTE.originQuery,
      destinationQuery: EXAMPLE_ROUTE.destinationQuery,
      origin: EXAMPLE_ROUTE.origin,
      destination: EXAMPLE_ROUTE.destination,
      profile: "citizen",
    });
    setError(null);
  }, []);

  const calculate = useCallback(async () => {
    if (!form.origin || !form.destination) {
      setError("Selecione origem e destino válidos na lista de sugestões.");
      return;
    }

    if (form.origin.lat === form.destination.lat && form.origin.lng === form.destination.lng) {
      setError("Origem e destino devem ser diferentes.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const profile = mode === "citizen" && form.profile !== "citizen" ? "citizen" : form.profile;
      const result = await planSafeRoute(form.origin, form.destination, profile);
      setPlanned(result);

      const event = buildOperationalEvent(
        result,
        form.origin,
        form.destination,
        profile,
        formatDateTime(new Date()),
        createId(),
      );
      setHistory((current) => persistOperationalHistory([event, ...current]));

      if (result.warnings.length > 0) {
        setError(result.warnings.join(" "));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível calcular a rota. Tente novamente.");
      setPlanned(null);
    } finally {
      setIsLoading(false);
    }
  }, [form, mode]);

  const openReport = useCallback(() => {
    if (!planned) {
      setError("Calcule uma rota antes de gerar o relatório.");
      return;
    }
    const profile = mode === "citizen" ? "citizen" : form.profile;
    setReport(buildSimulationReport(planned, profile));
  }, [form.profile, mode, planned]);

  const loadFromHistory = useCallback((event: OperationalEvent) => {
    if (!event.plannerSnapshot) {
      setError("Este registro não possui dados completos para recarregar.");
      return;
    }
    setPlanned(event.plannerSnapshot);
    setForm((current) => ({
      ...current,
      originQuery: event.origin,
      destinationQuery: event.destination,
      profile: event.profile,
    }));
    setError(null);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      window.localStorage.removeItem("orbittwin:operational-history:v2");
    } catch {
      // noop
    }
  }, []);

  return {
    form,
    setForm,
    planned,
    history,
    isLoading,
    error,
    setError,
    report,
    setReport,
    applyExample,
    calculate,
    openReport,
    loadFromHistory,
    clearHistory,
  };
}

function createId(): string {
  if ("crypto" in window && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
