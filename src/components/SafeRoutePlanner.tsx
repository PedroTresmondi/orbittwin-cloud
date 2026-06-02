import type { AppMode, MapLayerVisibility, PlannerProfile } from "../types";
import { PLANNER_PROFILE_LABELS } from "../types";
import type { useSafeRoutePlanner } from "../hooks/useSafeRoutePlanner";
import { getDefaultDataHub } from "../services/dataHubService";
import type { DataHubBadge, MapLayerId } from "../types";
import { isScenarioActive } from "../services/scenarioService";
import { buildCitizenRouteMessage } from "../utils/routeMessages";
import { AddressSearch } from "./AddressSearch";
import { DataHubPanel } from "./DataHubPanel";
import { HomeStart } from "./HomeStart";
import { LayerControls } from "./LayerControls";
import { OperationalHistory } from "./OperationalHistory";
import { RouteExplanation } from "./RouteExplanation";
import { RouteMap } from "./RouteMap";
import { RouteSummary } from "./RouteSummary";
import { SatelliteLayersPanel } from "./SatelliteLayersPanel";
import { ScenarioSimulator } from "./ScenarioSimulator";
import { WeatherPanel } from "./WeatherPanel";
import { MapFeedNotice } from "./MapFeedNotice";
import { RouteOperationalBridge } from "./RouteOperationalBridge";

type PlannerState = ReturnType<typeof useSafeRoutePlanner>;

type SafeRoutePlannerProps = {
  mode: AppMode;
  planner: PlannerState;
  mapLayers: MapLayerVisibility;
  onLayersChange: (layers: MapLayerVisibility) => void;
  onOpenReport: () => void;
  onDemoFlood: () => void;
  onOpenManager: () => void;
};

export function SafeRoutePlanner({
  mode,
  planner,
  mapLayers,
  onLayersChange,
  onOpenReport,
  onDemoFlood,
  onOpenManager,
}: SafeRoutePlannerProps) {
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
    applyRandomRoute,
    applyRandomAndCalculate,
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

  const canCalculate = Boolean(form.origin && form.destination);

  const firmsEmptyNotice =
    planned?.environmental?.firesFeed?.status === "real" &&
    planned.environmental.firesFeed.apiOnline &&
    planned.environmental.fireHotspots.length === 0;

  return (
    <section id="planner-section" className="planner card home-planner">
      <HomeStart
        hasOrigin={Boolean(form.origin)}
        hasDestination={Boolean(form.destination)}
        hasRoute={Boolean(planned)}
      />

      <div className="planner__form home-form">
        <div className="home-form__fields">
          <AddressSearch
            id="origin"
            label="Origem"
            placeholder="Avenida Paulista"
            value={form.originQuery}
            selected={form.origin}
            onQueryChange={(originQuery) => setForm((f) => ({ ...f, originQuery }))}
            onSelect={(origin) => setForm((f) => ({ ...f, origin }))}
          />
          <AddressSearch
            id="destination"
            label="Destino"
            placeholder="Estação Santo Amaro"
            value={form.destinationQuery}
            selected={form.destination}
            onQueryChange={(destinationQuery) => setForm((f) => ({ ...f, destinationQuery }))}
            onSelect={(destination) => setForm((f) => ({ ...f, destination }))}
          />
        </div>

        <button
          type="button"
          className={`btn-orbit btn-orbit--large btn-orbit--block${isLoading ? " is-loading" : ""}`}
          disabled={isLoading || !canCalculate}
          onClick={() => void calculate()}
        >
          {isLoading ? loadingLabel : "Calcular rota segura"}
        </button>

        {!planned && (
          <div className="home-form__quick">
            <button
              type="button"
              className="btn-secondary btn-secondary--quick"
              disabled={isLoading}
              onClick={() => void applyRandomAndCalculate()}
            >
              {isLoading ? "Calculando…" : "Aleatório e calcular"}
            </button>
            <div className="home-form__secondary">
              <button type="button" className="btn-link" disabled={isLoading} onClick={onDemoFlood}>
                {isLoading ? "…" : "Exemplo com enchente"}
              </button>
              <span className="home-form__sep" aria-hidden="true">
                ·
              </span>
              <button type="button" className="btn-link" disabled={isLoading} onClick={applyExample}>
                Paulista → Santo Amaro
              </button>
              <span className="home-form__sep" aria-hidden="true">
                ·
              </span>
              <button type="button" className="btn-link" disabled={isLoading} onClick={applyRandomRoute}>
                Só preencher aleatório
              </button>
            </div>
          </div>
        )}

        {!isCitizen && (
          <details className="planner__advanced">
            <summary>Opções avançadas</summary>
            <label className="route-field">
              <span>Perfil</span>
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
          </details>
        )}
      </div>

      {error && (
        <p className="route-error" role="alert">
          {error}
        </p>
      )}

      {planned && (
        <div className="planner__results">
          <RouteSummary planned={planned} compact={isCitizen} />

          <RouteOperationalBridge planned={planned} onOpenManager={onOpenManager} />

          {isCitizen && (
            <div className="citizen-banner card">
              <p>{buildCitizenRouteMessage(planned.route)}</p>
            </div>
          )}

          <ScenarioSimulator
            activeScenario={activeScenario}
            isLoading={isLoading}
            hasRoute={Boolean(planned)}
            onSelectScenario={(s) => void applyScenario(s)}
            onClear={() => void applyScenario("clear")}
          />

          <DataHubPanel entries={dataHub} mode={mode} collapsible />

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
              {firmsEmptyNotice && (
                <MapFeedNotice variant="info">
                  NASA FIRMS consultado: nenhum foco de calor ativo nesta área nas últimas 24h (dado real).
                  {!mapLayers.fireHotspots && isCitizen && " No Modo Gestor, ative a camada Focos de calor no mapa."}
                </MapFeedNotice>
              )}
              <p className="planner__map-hint">
                Ciano = segura · Vermelho = convencional
                {isScenarioActive(activeScenario) ? " · Simulação ativa" : ""}
              </p>
            </div>

            <aside className="planner__side">
              <WeatherPanel weather={planned.weather} scenarioActive={isScenarioActive(planned.scenario)} />
              <RouteExplanation planned={planned} compact={isCitizen} />
              <button type="button" className="btn-secondary btn-secondary--full" onClick={onOpenReport}>
                Relatório
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
