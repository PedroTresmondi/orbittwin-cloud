import { useState } from "react";
import { Header } from "./components/Header";
import { ManagerView } from "./components/ManagerView";
import { ReportModal } from "./components/ReportModal";
import { SafeRoutePlanner } from "./components/SafeRoutePlanner";
import { useSafeRoutePlanner } from "./hooks/useSafeRoutePlanner";
import { createInitialState } from "./data";
import { computeCityRisk, simulateOrbitalReading } from "./simulation";
import type { AppMode, MapLayerVisibility, OrbitTwinState, RegionKey } from "./types";
import { DEFAULT_MAP_LAYERS } from "./types";

function App() {
  const [mode, setMode] = useState<AppMode>("citizen");
  const [mapLayers, setMapLayers] = useState<MapLayerVisibility>(DEFAULT_MAP_LAYERS);
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
      <Header mode={mode} onModeChange={setMode} />

      <main className="dashboard">
        <SafeRoutePlanner
          mode={mode}
          planner={planner}
          mapLayers={mapLayers}
          onLayersChange={setMapLayers}
          onOpenReport={planner.openReport}
        />

        {mode === "manager" && (
          <ManagerView
            state={state}
            isSimulating={isSimulating}
            plannedRoute={planner.planned?.route ?? null}
            onSimulate={handleSimulateReading}
            onSelectRegion={handleSelectRegion}
          />
        )}
      </main>

      <ReportModal report={planner.report} onClose={() => planner.setReport(null)} />

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
      <p className="footer__sub">Google Maps climático · Nominatim · OSRM · Open-Meteo</p>
    </footer>
  );
}

export default App;
