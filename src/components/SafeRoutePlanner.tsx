import type { AppMode, MapLayerVisibility, PlannerProfile } from "../types";
import { PLANNER_PROFILE_LABELS } from "../types";
import type { useSafeRoutePlanner } from "../hooks/useSafeRoutePlanner";
import { getDefaultDataHub } from "../services/dataHubService";
import type { DataHubBadge, MapLayerId } from "../types";
import { isScenarioActive } from "../services/scenarioService";
import { buildCitizenRouteMessage } from "../utils/routeMessages";
import { AddressSearch } from "./AddressSearch";
import { DataHubPanel } from "./DataHubPanel";
import { LayerControls } from "./LayerControls";
import { OperationalHistory } from "./OperationalHistory";
import { RouteExplanation } from "./RouteExplanation";
import { RouteMap } from "./RouteMap";
import { RouteSummary } from "./RouteSummary";
import { SatelliteLayersPanel } from "./SatelliteLayersPanel";
import { ScenarioSimulator } from "./ScenarioSimulator";
import { WeatherPanel } from "./WeatherPanel";

type PlannerState = ReturnType<typeof useSafeRoutePlanner>;

type SafeRoutePlannerProps = {
  mode: AppMode;
  planner: PlannerState;
  mapLayers: MapLayerVisibility;
  onLayersChange: (layers: MapLayerVisibility) => void;
  onOpenReport: () => void;
};

export function SafeRoutePlanner({ mode, planner, mapLayers, onLayersChange, onOpenReport }: SafeRoutePlannerProps) {
  const {
    form,
    setForm,
    planned,
    history,
    activeScenario,
    isLoading,
    loadingLabel,
    error,
    applyExample,
    calculate,
    applyScenario,
    loadFromHistory,
    clearHistory,
  } = planner;
  const isCitizen = mode === "citizen";
  const dataHub = planned?.dataHub ?? getDefaultDataHub();

  const layerBadges: Partial<Record<MapLayerId, DataHubBadge>> = {
    fireHotspots: dataHub.find((e) => e.id === "nasa-firms")?.badge ?? "Planejado",
    rainStations: dataHub.find((e) => e.id === "cemaden")?.badge ?? "Planejado",
    satelliteLayers: dataHub.find((e) => e.id === "inpe-terrabrasilis")?.badge ?? "Planejado",
    weather: dataHub.find((e) => e.id === "open-meteo")?.badge ?? "Real",
  };

  return (
    <section id="planner-section" className="planner card">
      <header className="section-head">
        <div>
          <h2>Planejar rota segura</h2>
          <p>
            Digite origem e destino como em um app de mapas. O OrbitTwin usa dados reais quando possível e permite
            simular enchentes e bloqueios para a apresentação.
          </p>
        </div>
      </header>

      <DataHubPanel entries={dataHub} mode={mode} />

      <div className="planner__form">
        <AddressSearch
          id="origin"
          label="Origem"
          placeholder="Ex.: Avenida Paulista"
          value={form.originQuery}
          selected={form.origin}
          onQueryChange={(originQuery) => setForm((f) => ({ ...f, originQuery }))}
          onSelect={(origin) => setForm((f) => ({ ...f, origin }))}
        />
        <AddressSearch
          id="destination"
          label="Destino"
          placeholder="Ex.: Estação Santo Amaro"
          value={form.destinationQuery}
          selected={form.destination}
          onQueryChange={(destinationQuery) => setForm((f) => ({ ...f, destinationQuery }))}
          onSelect={(destination) => setForm((f) => ({ ...f, destination }))}
        />

        <div className="planner__actions-row">
          <label className="route-field">
            <span>Perfil operacional</span>
            <select
              value={form.profile}
              disabled={isLoading}
              onChange={(e) => setForm((f) => ({ ...f, profile: e.target.value as PlannerProfile }))}
            >
              {(Object.entries(PLANNER_PROFILE_LABELS) as [PlannerProfile, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <div className="planner__buttons">
            <button type="button" className="btn-secondary" disabled={isLoading} onClick={applyExample}>
              Usar exemplo
            </button>
            <button
              type="button"
              className={`btn-orbit btn-orbit--large${isLoading ? " is-loading" : ""}`}
              disabled={isLoading}
              onClick={() => void calculate()}
            >
              {isLoading ? loadingLabel : "Calcular rota segura"}
            </button>
          </div>
        </div>
      </div>

      <ScenarioSimulator
        activeScenario={activeScenario}
        isLoading={isLoading}
        hasRoute={Boolean(planned)}
        onSelectScenario={(s) => void applyScenario(s)}
        onClear={() => void applyScenario("clear")}
      />

      {error && (
        <p className="route-error" role="alert">
          {error}
        </p>
      )}

      {planned && (
        <div className="planner__results">
          {isCitizen && (
            <div className="citizen-banner card">
              <p>{buildCitizenRouteMessage(planned.route)}</p>
            </div>
          )}

          <RouteSummary planned={planned} compact={isCitizen} />

          {!isCitizen && mapLayers.satelliteLayers && planned.environmental && (
            <SatelliteLayersPanel layers={planned.environmental.satelliteLayers} />
          )}

          <div className="planner__map-layout">
            <div className="planner__map">
              {!isCitizen && (
                <LayerControls layers={mapLayers} onChange={onLayersChange} layerBadges={layerBadges} />
              )}
              <RouteMap
                route={planned.route}
                regionKey="centro"
                layers={mapLayers}
                onLayersChange={onLayersChange}
                environmental={planned.environmental}
                showAllRiskZones
                hideLayerUI
              />
              <p className="planner__map-hint">
                Ciano: rota segura · Vermelho: convencional · Azul: pluviômetro · Laranja: foco de calor
                {isScenarioActive(activeScenario) ? " · Borda pulsante: evento simulado" : ""}
              </p>
            </div>

            <aside className="planner__side">
              <WeatherPanel weather={planned.weather} scenarioActive={isScenarioActive(planned.scenario)} />
              <RouteExplanation planned={planned} compact={isCitizen} />
              <button type="button" className="btn-secondary btn-secondary--full" onClick={onOpenReport}>
                Gerar relatório da simulação
              </button>
            </aside>
          </div>

          <OperationalHistory
            history={history}
            onSelect={loadFromHistory}
            onClear={clearHistory}
            variant={isCitizen ? "cards" : "table"}
          />
        </div>
      )}
    </section>
  );
}
