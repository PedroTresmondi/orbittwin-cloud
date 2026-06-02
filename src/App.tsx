import { useEffect, useMemo, useRef, useState } from "react";
import { AppNavDrawer } from "./components/AppNavDrawer";
import { Header } from "./components/Header";
import { DecisionDashboard } from "./components/DecisionDashboard";
import { ManagerView } from "./components/ManagerView";
import { SimulationReportModal } from "./components/SimulationReportModal";
import { SafeRoutePlanner } from "./components/SafeRoutePlanner";
import { useSafeRoutePlanner } from "./hooks/useSafeRoutePlanner";
import { createInitialState } from "./data";
import { buildDecisionDashboard } from "./services/decisionDashboardService";
import { computeCityRisk, simulateOrbitalReading } from "./simulation";
import type { AppMode, MapLayerVisibility, OrbitTwinState, RegionKey } from "./types";
import { CITIZEN_MAP_LAYERS, MANAGER_MAP_LAYERS } from "./types";

function App() {
  const [mode, setMode] = useState<AppMode>("citizen");
  const [navOpen, setNavOpen] = useState(false);
  const [mapLayers, setMapLayers] = useState<MapLayerVisibility>(CITIZEN_MAP_LAYERS);
  const [state, setState] = useState<OrbitTwinState>(() => {
    const initial = createInitialState();
    return {
      ...initial,
      kpis: {
        ...initial.kpis,
        cityRisk: computeCityRisk(initial.regions),
        criticalAlerts: initial.alerts.filter((a) => a.type === "critical").length,
      },
    };
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const planner = useSafeRoutePlanner(mode);
  const prevModeRef = useRef(mode);

  const decisionSnapshot = useMemo(
    () =>
      buildDecisionDashboard({
        planned: planner.planned,
        activeScenario: planner.activeScenario,
      }),
    [planner.planned, planner.activeScenario],
  );

  useEffect(() => {
    if (prevModeRef.current === mode) return;
    prevModeRef.current = mode;
    setMapLayers(mode === "citizen" ? { ...CITIZEN_MAP_LAYERS } : { ...MANAGER_MAP_LAYERS });
  }, [mode]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleModeChange = (next: AppMode) => {
    setMode(next);
    if (next === "manager" && planner.planned) {
      window.setTimeout(() => scrollTo("decision-dashboard"), 300);
    }
  };

  const handleNav = (target: "planner" | "dashboard" | "demo") => {
    if (target === "planner") scrollTo("planner-section");
    if (target === "dashboard") {
      handleModeChange("manager");
      scrollTo("decision-dashboard");
    }
    if (target === "demo") {
      scrollTo("planner-section");
      void planner.demoGsDetourExample();
    }
  };

  const handleSimulateReading = () => {
    setIsSimulating(true);
    window.setTimeout(() => {
      setState((current) => simulateOrbitalReading(current));
      setIsSimulating(false);
    }, 600);
  };

  const handleSelectRegion = (region: RegionKey) => {
    setState((current) => ({ ...current, selectedRegion: region }));
  };

  const isManager = mode === "manager";

  return (
    <>
      <BackgroundLayers />
      <Header mode={mode} onModeChange={handleModeChange} onMenuOpen={() => setNavOpen(true)} />
      <AppNavDrawer
        open={navOpen}
        mode={mode}
        onClose={() => setNavOpen(false)}
        onModeChange={handleModeChange}
        onNavigate={handleNav}
      />

      <main className={`app-main${isManager ? " app-main--stack" : ""}`}>
        <SafeRoutePlanner
          mode={mode}
          planner={planner}
          mapLayers={mapLayers}
          onLayersChange={setMapLayers}
          onOpenReport={planner.openReport}
          onDemoGsDetour={() => void planner.demoGsDetourExample()}
          onDemoFlood={() => void planner.demoFloodExample()}
          onOpenManager={() => handleModeChange("manager")}
          onScrollToIndicators={() => scrollTo("decision-dashboard")}
          onGsDemoComplete={() => {
            handleModeChange("manager");
            scrollTo("decision-dashboard");
          }}
        />

        {isManager && (
          <div id="manager-panel" className="manager-stack">
            {planner.planned ? (
              <DecisionDashboard snapshot={decisionSnapshot} />
            ) : (
              <p className="manager-stack__hint glass-surface" role="status">
                Calcule uma rota para exibir o painel de decisão (KPIs, mapa urbano, alertas).
              </p>
            )}

            <details className="manager-stack__legacy glass-surface">
              <summary>Monitoramento orbital (legado)</summary>
              <ManagerView
                state={state}
                isSimulating={isSimulating}
                plannedRoute={planner.planned?.route ?? null}
                onSimulate={handleSimulateReading}
                onSelectRegion={handleSelectRegion}
              />
            </details>
          </div>
        )}
      </main>

      <SimulationReportModal report={planner.report} onClose={() => planner.setReport(null)} />

      <Footer />
    </>
  );
}

function BackgroundLayers() {
  return (
    <>
      <div className="bg-mesh" aria-hidden="true" />
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-stars" aria-hidden="true" />
    </>
  );
}

function Footer() {
  return (
    <footer className="footer footer--glass">
      <p>OrbitTwin · Global Solution 2026</p>
      <p className="footer__sub">OSRM · Open-Meteo · NASA FIRMS · Leaflet</p>
    </footer>
  );
}

export default App;
