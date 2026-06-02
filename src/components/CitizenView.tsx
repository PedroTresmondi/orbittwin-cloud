import type { Dispatch, SetStateAction } from "react";
import { OPERATIONAL_PLACES } from "../data";
import { routeRiskLabel } from "../simulation";
import type { OperationalPlace, RouteData, RouteInputs } from "../types";
import { RouteMap } from "./RouteMap";
import type { MapLayerVisibility, RegionKey } from "../types";

type CitizenViewProps = {
  regionKey: RegionKey;
  route: RouteData;
  inputs: RouteInputs;
  layers: MapLayerVisibility;
  citizenMessage: string;
  isRouting: boolean;
  routeError: string | null;
  onInputsChange: Dispatch<SetStateAction<RouteInputs>>;
  onLayersChange: (layers: MapLayerVisibility) => void;
  onCalculate: () => void;
};

export function CitizenView({
  regionKey,
  route,
  inputs,
  layers,
  citizenMessage,
  isRouting,
  routeError,
  onInputsChange,
  onLayersChange,
  onCalculate,
}: CitizenViewProps) {
  const places = OPERATIONAL_PLACES;

  return (
    <section className="citizen card">
      <header className="section-head">
        <div>
          <h2>Rota segura para cidadãos</h2>
          <p>Informe origem e destino para receber a melhor rota com menor risco de alagamento.</p>
        </div>
      </header>

      <div className="citizen__form">
        <label className="route-field">
          <span>Origem</span>
          <select
            value={inputs.originId}
            onChange={(event) => onInputsChange((current) => ({ ...current, originId: event.target.value }))}
          >
            {places.map((place) => (
              <PlaceOption key={place.id} place={place} />
            ))}
          </select>
        </label>

        <label className="route-field">
          <span>Destino</span>
          <select
            value={inputs.destinationId}
            onChange={(event) => onInputsChange((current) => ({ ...current, destinationId: event.target.value }))}
          >
            {places.map((place) => (
              <PlaceOption key={place.id} place={place} />
            ))}
          </select>
        </label>

        <button
          type="button"
          className={`btn-orbit btn-orbit--large${isRouting ? " is-loading" : ""}`}
          onClick={onCalculate}
          disabled={isRouting}
        >
          {isRouting ? "Calculando rota segura..." : "Calcular rota segura"}
        </button>
      </div>

      {routeError && <p className="route-error">{routeError}</p>}

      <div className="citizen__result">
        <article className="citizen-result card">
          <span className="citizen-result__label">Rota recomendada</span>
          <strong className="citizen-result__title">OrbitTwin — rota segura</strong>
          <p className="citizen-result__message">{citizenMessage}</p>
          <dl className="citizen-result__metrics">
            <div>
              <dt>Nível de risco</dt>
              <dd>{routeRiskLabel(route.safeRisk)}</dd>
            </div>
            <div>
              <dt>Tempo estimado</dt>
              <dd>{route.safeTime} min</dd>
            </div>
            <div>
              <dt>vs. rota convencional</dt>
              <dd>
                +{Math.max(route.safeTime - route.conventionalTime, 0)} min · risco {route.conventionalRisk} →{" "}
                {route.safeRisk}
              </dd>
            </div>
          </dl>
        </article>

        <RouteMap route={route} regionKey={regionKey} layers={layers} onLayersChange={onLayersChange} compact />
      </div>
    </section>
  );
}

function PlaceOption({ place }: { place: OperationalPlace }) {
  return <option value={place.id}>{place.name}</option>;
}
