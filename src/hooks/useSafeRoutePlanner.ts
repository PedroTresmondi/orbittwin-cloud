import { useCallback, useState } from "react";
import { DEFAULT_DATA_HUB } from "../services/dataHubService";
import { emptyEnvironmentalContext } from "../services/environmentalDataService";
import { isFirmsApiConfigured } from "../services/fireService";
import { EXAMPLE_ROUTE, pickRandomSpRoute } from "../services/geocodingService";
import { buildOperationalEvent, buildSimulationReport, planSafeRoute } from "../services/routeService";
import { clearOperationalHistory, persistOperationalHistory, loadOperationalHistory } from "../services/storageService";
import { formatDateTime } from "../simulation";
import type {
  AppMode,
  EnvironmentalContext,
  GeocodeResult,
  OperationalEvent,
  PlannedRouteResult,
  PlannerProfile,
  ScenarioKind,
  SimulationReport,
} from "../types";

export type PlannerFormState = {
  originQuery: string;
  destinationQuery: string;
  origin: GeocodeResult | null;
  destination: GeocodeResult | null;
  profile: PlannerProfile;
};

export type LoadingPhase = "idle" | "geocoding" | "routing" | "weather" | "risk";

const INITIAL_FORM: PlannerFormState = {
  originQuery: "",
  destinationQuery: "",
  origin: null,
  destination: null,
  profile: "citizen",
};

export function useSafeRoutePlanner(_mode: AppMode) {
  const [form, setForm] = useState<PlannerFormState>(INITIAL_FORM);
  const [planned, setPlanned] = useState<PlannedRouteResult | null>(null);
  const [history, setHistory] = useState<OperationalEvent[]>(() => loadOperationalHistory());
  const [activeScenario, setActiveScenario] = useState<ScenarioKind>("real");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<SimulationReport | null>(null);

  const runPlan = useCallback(
    async (origin: GeocodeResult, destination: GeocodeResult, profile: PlannerProfile, scenario: ScenarioKind) => {
      setLoadingPhase("routing");
      const result = await planSafeRoute(origin, destination, profile, { scenario });
      setLoadingPhase("risk");
      setPlanned(result);
      setActiveScenario(scenario);

      const event = buildOperationalEvent(
        result,
        origin,
        destination,
        profile,
        formatDateTime(new Date()),
        createId(),
      );
      setHistory((current) => persistOperationalHistory([event, ...current]));
      return result;
    },
    [],
  );

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

  const applyRandomRoute = useCallback(() => {
    const random = pickRandomSpRoute();
    setForm((current) => ({
      ...current,
      originQuery: random.originQuery,
      destinationQuery: random.destinationQuery,
      origin: random.origin,
      destination: random.destination,
    }));
    setError(null);
  }, []);

  const executePlan = useCallback(
    async (
      origin: GeocodeResult,
      destination: GeocodeResult,
      profile: PlannerProfile,
      scenario: ScenarioKind,
    ) => {
      setIsLoading(true);
      setLoadingPhase("weather");
      setError(null);

      try {
        const result = await runPlan(origin, destination, profile, scenario);
        if (result.warnings.length > 0) {
          setError(result.warnings.join(" "));
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Não foi possível calcular a rota. Tente novamente.";
        setError(message);
        setPlanned(null);
        return null;
      } finally {
        setIsLoading(false);
        setLoadingPhase("idle");
      }
    },
    [runPlan],
  );

  const calculate = useCallback(
    async (scenarioOverride?: ScenarioKind) => {
      if (!form.originQuery.trim()) {
        setError("Informe o endereço de origem.");
        return;
      }
      if (!form.destinationQuery.trim()) {
        setError("Informe o endereço de destino.");
        return;
      }
      if (!form.origin) {
        setError(
          "Não encontramos esse endereço de origem. Selecione uma sugestão na lista ou tente incluir bairro e cidade.",
        );
        return;
      }
      if (!form.destination) {
        setError(
          "Não encontramos esse endereço de destino. Selecione uma sugestão na lista ou tente incluir bairro e cidade.",
        );
        return;
      }

      if (form.origin.lat === form.destination.lat && form.origin.lng === form.destination.lng) {
        setError("Origem e destino devem ser diferentes.");
        return;
      }

      const scenario = scenarioOverride ?? (activeScenario === "clear" ? "real" : activeScenario);
      await executePlan(form.origin, form.destination, form.profile, scenario);
    },
    [activeScenario, executePlan, form],
  );

  const applyRandomAndCalculate = useCallback(async () => {
    const random = pickRandomSpRoute();
    setForm((current) => ({
      ...current,
      originQuery: random.originQuery,
      destinationQuery: random.destinationQuery,
      origin: random.origin,
      destination: random.destination,
    }));
    setError(null);
    const scenario = activeScenario === "clear" ? "real" : activeScenario;
    await executePlan(random.origin, random.destination, form.profile, scenario);
  }, [activeScenario, executePlan, form.profile]);

  const applyScenario = useCallback(
    async (scenario: ScenarioKind) => {
      if (scenario === "clear") {
        setActiveScenario("real");
        if (!form.origin || !form.destination) {
          setError(null);
          return;
        }
        setIsLoading(true);
        setError(null);
        try {
          const result = await runPlan(form.origin, form.destination, form.profile, "real");
          if (result.warnings.length) setError(result.warnings.join(" "));
        } catch (err) {
          setError(err instanceof Error ? err.message : "Falha ao restaurar dados reais.");
        } finally {
          setIsLoading(false);
          setLoadingPhase("idle");
        }
        return;
      }

      setActiveScenario(scenario);
      if (!form.origin || !form.destination) {
        setError("Defina uma origem e um destino para visualizar o impacto da simulação na rota.");
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const result = await runPlan(form.origin, form.destination, form.profile, scenario);
        if (result.warnings.length) setError(result.warnings.join(" "));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao aplicar cenário simulado.");
      } finally {
        setIsLoading(false);
        setLoadingPhase("idle");
      }
    },
    [form, runPlan],
  );

  const demoFloodExample = useCallback(async () => {
    setForm({
      originQuery: EXAMPLE_ROUTE.originQuery,
      destinationQuery: EXAMPLE_ROUTE.destinationQuery,
      origin: EXAMPLE_ROUTE.origin,
      destination: EXAMPLE_ROUTE.destination,
      profile: "citizen",
    });
    setError(null);
    setIsLoading(true);
    try {
      const result = await runPlan(EXAMPLE_ROUTE.origin, EXAMPLE_ROUTE.destination, "citizen", "flood");
      setActiveScenario("flood");
      if (result.warnings.length) setError(result.warnings.join(" "));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no exemplo de enchente.");
    } finally {
      setIsLoading(false);
      setLoadingPhase("idle");
    }
  }, [runPlan]);

  const openReport = useCallback(() => {
    if (!planned) {
      setError("Calcule uma rota antes de gerar o relatório.");
      return;
    }
    setReport(buildSimulationReport(planned, form.profile));
  }, [form.profile, planned]);

  const loadFromHistory = useCallback((event: OperationalEvent) => {
    if (!event.plannerSnapshot) {
      setError("Este registro não possui dados completos para recarregar.");
      return;
    }
    const raw = event.plannerSnapshot;
    const snapshot: PlannedRouteResult = {
      ...raw,
      dataHub: raw.dataHub ?? DEFAULT_DATA_HUB,
      environmental: normalizeEnvironmentalSnapshot(raw.environmental),
    };
    setPlanned(snapshot);
    setActiveScenario(snapshot.scenario ?? "real");
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
    clearOperationalHistory();
  }, []);

  const loadingLabel =
    loadingPhase === "routing"
      ? "Calculando rotas com OSRM…"
      : loadingPhase === "weather"
        ? "Consultando clima (Open-Meteo)…"
        : loadingPhase === "risk"
          ? "Avaliando áreas de risco…"
          : "Calculando rota segura…";

  return {
    form,
    setForm,
    planned,
    history,
    activeScenario,
    isLoading,
    loadingPhase,
    loadingLabel,
    error,
    setError,
    report,
    setReport,
    applyExample,
    applyRandomRoute,
    applyRandomAndCalculate,
    calculate,
    applyScenario,
    demoFloodExample,
    openReport,
    loadFromHistory,
    clearHistory,
  };
}

function normalizeEnvironmentalSnapshot(env?: EnvironmentalContext): EnvironmentalContext {
  if (!env) return emptyEnvironmentalContext();
  if (env.firesFeed) return env;

  const apiConfigured = isFirmsApiConfigured();
  const hasReal = env.fireHotspots.some((h) => h.status === "real");
  const hasFallback = env.fireHotspots.some((h) => h.status === "fallback");

  return {
    ...env,
    firesFeed: {
      status: hasReal ? "real" : hasFallback ? "fallback" : apiConfigured ? "real" : "planned",
      apiConfigured,
      apiOnline: hasReal || (apiConfigured && env.fireHotspots.length === 0),
    },
  };
}

function createId(): string {
  if ("crypto" in window && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
