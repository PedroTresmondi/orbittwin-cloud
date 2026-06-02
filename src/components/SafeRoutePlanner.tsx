import { useEffect, useState } from "react";
import type { AppMode, MapLayerVisibility, PlannerProfile } from "../types";
import { PLANNER_PROFILE_LABELS } from "../types";
import type { useSafeRoutePlanner } from "../hooks/useSafeRoutePlanner";
import { getDefaultDataHub } from "../services/dataHubService";
import type { DataHubBadge, MapLayerId } from "../types";
import { isScenarioActive } from "../services/scenarioService";
import { AddressSearch } from "./AddressSearch";
import { DataHubPanel } from "./DataHubPanel";
import { DemoQuickActions } from "./DemoQuickActions";
import { HomeStart } from "./HomeStart";
import { GlassAccordion } from "./GlassAccordion";
import { MapLayersDrawer } from "./MapLayersDrawer";
import { OperationalHistory } from "./OperationalHistory";
import { PlannerTabNav, type PlannerTabId } from "./PlannerTabNav";
import { RouteCompareCompact } from "./RouteCompareCompact";
import { RouteExplanation } from "./RouteExplanation";
import { MapDecisionCard } from "./MapDecisionCard";
import { RouteMap } from "./RouteMap";
import { RouteResultStrip } from "./RouteResultStrip";
import { RouteSummary } from "./RouteSummary";
import { ScenarioSimulator } from "./ScenarioSimulator";
import { WeatherPanel } from "./WeatherPanel";
import { MapFeedNotice } from "./MapFeedNotice";
import { GsPresenterBar } from "./GsPresenterBar";
import { GS_SHOWCASE_ZONE_ID, GS_SHOWCASE_ZONE_NAME } from "../data/gsDetourDemo";

type PlannerState = ReturnType<typeof useSafeRoutePlanner>;

type SafeRoutePlannerProps = {
  mode: AppMode;
  planner: PlannerState;
  mapLayers: MapLayerVisibility;
  onLayersChange: (layers: MapLayerVisibility) => void;
  onOpenReport: () => void;
  onDemoFlood: () => void;
  onDemoGsDetour: () => void;
  onOpenManager: () => void;
  onScrollToIndicators?: () => void;
  onGsDemoComplete?: () => void;
};

export function SafeRoutePlanner({
  mode,
  planner,
  mapLayers,
  onLayersChange,
  onOpenReport,
  onDemoFlood,
  onDemoGsDetour,
  onOpenManager,
  onScrollToIndicators,
  onGsDemoComplete,
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
    applyRandomAndCalculate,
    calculate,
    applyScenario,
    loadFromHistory,
    clearHistory,
  } = planner;

  const isCitizen = mode === "citizen";
  const dataHub = planned?.dataHub ?? getDefaultDataHub();
  const [activeTab, setActiveTab] = useState<PlannerTabId>("map");
  const [layersDrawerOpen, setLayersDrawerOpen] = useState(false);
  const [presenterStep, setPresenterStep] = useState(1);

  useEffect(() => {
    if (planned?.gsDetourDemo) setPresenterStep(2);
    if (!planned) setPresenterStep(1);
  }, [planned?.gsDetourDemo, planned]);

  useEffect(() => {
    if (!planned) setActiveTab("map");
  }, [planned]);

  useEffect(() => {
    if (isScenarioActive(activeScenario) && planned) {
      setActiveTab("map");
    }
  }, [activeScenario, planned]);

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
    <section
      id="planner-section"
      className={`planner-shell glass-surface${planned ? " planner-shell--results" : ""}${!isCitizen ? " planner-shell--manager" : ""}`}
    >
      <HomeStart
        hasOrigin={Boolean(form.origin)}
        hasDestination={Boolean(form.destination)}
        hasRoute={Boolean(planned)}
      />

      <div className="trip-card">
        <div className="trip-card__fields">
          <AddressSearch
            id="origin"
            label="Origem"
            placeholder="Avenida Paulista"
            value={form.originQuery}
            selected={form.origin}
            onQueryChange={(originQuery) => setForm((f) => ({ ...f, originQuery }))}
            onSelect={(origin) => setForm((f) => ({ ...f, origin }))}
          />
          <span className="trip-card__arrow" aria-hidden="true">
            →
          </span>
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

        <div className="trip-card__actions">
          <button
            type="button"
            className={`btn-orbit btn-orbit--large${isLoading ? " is-loading" : ""}`}
            disabled={isLoading || !canCalculate}
            onClick={() => void calculate()}
          >
            {isLoading ? loadingLabel : planned ? "Recalcular rota" : "Calcular rota segura"}
          </button>
          {planned && !isCitizen && (
            <button type="button" className="btn-secondary" onClick={onOpenReport}>
              Relatório
            </button>
          )}
        </div>

        {!planned && (
          <DemoQuickActions
            isLoading={isLoading}
            onRandomAndCalculate={() => void applyRandomAndCalculate()}
            onGsDetourDemo={onDemoGsDetour}
            onFloodDemo={onDemoFlood}
            onFillExample={applyExample}
          />
        )}

        {!isCitizen && !planned && (
          <label className="trip-card__profile route-field">
            <span>Perfil de rota</span>
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
        )}
      </div>

      {error && (
        <p className="route-error" role="alert">
          {error}
        </p>
      )}

      {planned && (
        <div className="planner-shell__results">
          <RouteResultStrip
            planned={planned}
            activeScenario={activeScenario}
            isCitizen={isCitizen}
            onOpenReport={onOpenReport}
            onOpenManager={onOpenManager}
          />

          <PlannerTabNav
            active={activeTab}
            isManager={!isCitizen}
            simulateActive={isScenarioActive(activeScenario)}
            onChange={setActiveTab}
            onScrollToIndicators={!isCitizen ? onScrollToIndicators : undefined}
          />

          <div className="planner-shell__panel" role="tabpanel">
            {activeTab === "map" && (
              <div className="map-panel map-panel--hero map-panel--framed">
                {planned.gsDetourDemo && (
                  <div className="map-callouts" aria-hidden="true">
                    <span className="map-callout map-callout--risk">● Convencional — passa por {GS_SHOWCASE_ZONE_NAME}</span>
                    <span className="map-callout map-callout--safe">◇ OrbitTwin — contorna a zona crítica</span>
                  </div>
                )}
                {!isCitizen && (
                  <>
                    <div className="map-panel__toolbar">
                      <button
                        type="button"
                        className="btn-secondary btn-secondary--sm"
                        onClick={() => setLayersDrawerOpen(true)}
                      >
                        Camadas
                      </button>
                    </div>
                    <MapLayersDrawer
                      open={layersDrawerOpen}
                      onClose={() => setLayersDrawerOpen(false)}
                      layers={mapLayers}
                      onChange={onLayersChange}
                      layerBadges={layerBadges}
                    />
                  </>
                )}
                <div className="map-panel__map-stack">
                  <MapDecisionCard
                    extraMinutes={Math.max(planned.route.safeTime - planned.route.conventionalTime, 0)}
                    exposureReductionPercent={planned.risk.exposureReductionPercent}
                    blocksAvoided={planned.route.avoidedBlocks.length}
                    confidence={planned.route.confidence}
                    dataMode={planned.dataMode}
                  />
                  <RouteMap
                    route={planned.route}
                    regionKey="centro"
                    layers={mapLayers}
                    onLayersChange={onLayersChange}
                    environmental={planned.environmental}
                    showAllRiskZones
                    hideLayerUI
                    highlightZoneId={planned.gsDetourDemo ? GS_SHOWCASE_ZONE_ID : undefined}
                  />
                </div>
                {firmsEmptyNotice && (
                  <MapFeedNotice variant="info">
                    NASA FIRMS: nenhum foco nesta área (24h).
                  </MapFeedNotice>
                )}
                {isScenarioActive(activeScenario) && (
                  <p className="map-panel__scenario-hint">Cenário simulado ativo — zonas e alertas reforçados no mapa.</p>
                )}
              </div>
            )}

            {activeTab === "simulate" && (
              <ScenarioSimulator
                variant="panel"
                activeScenario={activeScenario}
                isLoading={isLoading}
                hasRoute
                onSelectScenario={(s) => void applyScenario(s)}
                onClear={() => void applyScenario("clear")}
              />
            )}

            {activeTab === "details" && (
              <div className="details-panel">
                {isCitizen ? (
                  <>
                    <RouteSummary planned={planned} showComparison />
                    <WeatherPanel weather={planned.weather} scenarioActive={isScenarioActive(planned.scenario)} />
                    <RouteExplanation planned={planned} compact />
                    <DataHubPanel entries={dataHub} mode={mode} collapsible={false} />
                  </>
                ) : (
                  <>
                    <RouteCompareCompact planned={planned} />
                    <WeatherPanel weather={planned.weather} scenarioActive={isScenarioActive(planned.scenario)} />
                  </>
                )}
              </div>
            )}
          </div>

          {planned.gsDetourDemo && (
            <GsPresenterBar
              step={presenterStep}
              onStepChange={(s) => {
                setPresenterStep(s);
                if (s === 2) setActiveTab("map");
                if (s === 3) onGsDemoComplete?.();
                if (s === 4) {
                  setActiveTab("simulate");
                  void applyScenario("flood");
                }
              }}
            />
          )}

          {isCitizen && (
            <GlassAccordion
              title="Histórico"
              subtitle={history.length > 0 ? `${history.length} rotas` : undefined}
              badge={history.length > 0 ? String(history.length) : undefined}
            >
              <OperationalHistory
                history={history}
                onSelect={loadFromHistory}
                onClear={clearHistory}
                variant="cards"
              />
            </GlassAccordion>
          )}
        </div>
      )}
    </section>
  );
}
