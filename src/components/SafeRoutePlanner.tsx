import type { AppMode, MapLayerVisibility, PlannerProfile } from "../types";
import { PLANNER_PROFILE_LABELS } from "../types";
import type { useSafeRoutePlanner } from "../hooks/useSafeRoutePlanner";
import { AddressSearch } from "./AddressSearch";
import { LayerControls } from "./LayerControls";
import { OperationalHistory } from "./OperationalHistory";
import { RouteExplanation } from "./RouteExplanation";
import { RouteMap } from "./RouteMap";
import { RouteSummary } from "./RouteSummary";
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
  const { form, setForm, planned, history, isLoading, error, applyExample, calculate, loadFromHistory, clearHistory } =
    planner;
  const isCitizen = mode === "citizen";

  return (
    <section className="planner card">
      <header className="section-head">
        <div>
          <h2>Planejar rota segura</h2>
          <p>Digite origem e destino como em um app de mapas — o OrbitTwin calcula a rota mais segura.</p>
        </div>
      </header>

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
          {!isCitizen && (
            <label className="route-field">
              <span>Perfil operacional</span>
              <select
                value={form.profile}
                onChange={(e) =>
                  setForm((f) => ({ ...f, profile: e.target.value as PlannerProfile }))
                }
              >
                {(Object.entries(PLANNER_PROFILE_LABELS) as [PlannerProfile, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </label>
          )}

          <div className="planner__buttons">
            <button type="button" className="btn-secondary" onClick={applyExample}>
              Usar exemplo
            </button>
            <button
              type="button"
              className={`btn-orbit btn-orbit--large${isLoading ? " is-loading" : ""}`}
              disabled={isLoading}
              onClick={calculate}
            >
              {isLoading ? "Calculando rota segura…" : "Calcular rota segura"}
            </button>
          </div>
        </div>
      </div>

      {error && <p className="route-error">{error}</p>}

      {planned && (
        <div className="planner__results">
          <RouteSummary planned={planned} compact={isCitizen} />

          <div className="planner__map-layout">
            <div className="planner__map">
              <LayerControls layers={mapLayers} onChange={onLayersChange} />
              <RouteMap
                route={planned.route}
                regionKey="centro"
                layers={mapLayers}
                onLayersChange={onLayersChange}
                showAllRiskZones
                hideLayerUI
              />
            </div>

            <aside className="planner__side">
              <WeatherPanel weather={planned.weather} />
              <RouteExplanation planned={planned} />
              {!isCitizen && (
                <button type="button" className="btn-secondary btn-secondary--full" onClick={onOpenReport}>
                  Gerar relatório da simulação
                </button>
              )}
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
