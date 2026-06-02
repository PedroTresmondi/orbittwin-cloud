import { useEffect, useRef, useState } from "react";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { ScenarioStatusBadge } from "./components/ScenarioStatusBadge";
import { ManagerView } from "./components/ManagerView";
import { SimulationReportModal } from "./components/SimulationReportModal";
import { SafeRoutePlanner } from "./components/SafeRoutePlanner";
import { useSafeRoutePlanner } from "./hooks/useSafeRoutePlanner";
import { createInitialState } from "./data";
import { computeCityRisk, simulateOrbitalReading } from "./simulation";
import type { AppMode, MapLayerVisibility, OrbitTwinState, RegionKey } from "./types";
import { CITIZEN_MAP_LAYERS, MANAGER_MAP_LAYERS } from "./types";

function App() {
  const [mode, setMode] = useState<AppMode>("citizen");
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
    if (next === "manager") {
      window.setTimeout(() => scrollTo("manager-panel"), 200);
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

  return (
    <>
      <BackgroundLayers />
      <Header mode={mode} onModeChange={handleModeChange} />
      <ScenarioStatusBadge scenario={planner.activeScenario} planned={planner.planned} />

      <main className="dashboard">
        <HeroSection
          onPlanRoute={() => scrollTo("planner-section")}
          onOpenManager={() => handleModeChange("manager")}
          onDemoFlood={() => void planner.demoFloodExample()}
          isLoading={planner.isLoading}
        />

        <SafeRoutePlanner
          mode={mode}
          planner={planner}
          mapLayers={mapLayers}
          onLayersChange={setMapLayers}
          onOpenReport={planner.openReport}
        />

        {mode === "manager" && (
          <div id="manager-panel">
            <ManagerView
              state={state}
              isSimulating={isSimulating}
              plannedRoute={planner.planned?.route ?? null}
              onSimulate={handleSimulateReading}
              onSelectRegion={handleSelectRegion}
            />
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
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-stars" aria-hidden="true" />
      <div className="bg-orbit" aria-hidden="true">
        <span className="bg-orbit__ring" />
        <span className="bg-orbit__satellite" />
      </div>
    </>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <p>OrbitTwin Cloud · Global Solution 2026 · Cloud Solutions &amp; Scalable Infrastructure</p>
      <p className="footer__sub">Nominatim · OSRM · Open-Meteo · Leaflet</p>
    </footer>
  );
}

export default App;
