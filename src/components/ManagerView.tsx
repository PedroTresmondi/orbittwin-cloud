import { useMemo } from "react";
import {
  ALERT_LABELS,
  REGION_KEYS,
  RISK_LABELS,
  RISK_SCORE,
  SPATIAL_LABELS,
  ZONE_CLASS_BY_REGION,
} from "../data";
import { formatDateTime, parseSensorActivity, riskClass } from "../simulation";
import type { Alert, Kpis, OrbitTwinState, Region, RegionKey, RouteData, SpatialMetric } from "../types";
import { AIJustification } from "./AIJustification";

type ManagerViewProps = {
  state: OrbitTwinState;
  isSimulating: boolean;
  plannedRoute: RouteData | null;
  onSimulate: () => void;
  onSelectRegion: (region: RegionKey) => void;
};

export function ManagerView({ state, isSimulating, plannedRoute, onSimulate, onSelectRegion }: ManagerViewProps) {
  const selectedRegion = state.regions[state.selectedRegion];
  const routeForAnalysis = plannedRoute ?? state.routes[state.selectedRegion];

  return (
    <>
      <Toolbar lastReading={state.lastReading} isSimulating={isSimulating} onSimulate={onSimulate} />
      <KpiGrid kpis={state.kpis} isUpdating={isSimulating} />

      <section className="main-grid">
        <UrbanMap regions={state.regions} selectedRegion={state.selectedRegion} onSelectRegion={onSelectRegion} />
        <AnalysisPanel region={selectedRegion} />
      </section>

      {plannedRoute && (
        <AIJustification route={routeForAnalysis} rainForecast={`${state.spatial.precipitation.value} mm (painel orbital)`} />
      )}

      <SpatialData spatial={state.spatial} isUpdating={isSimulating} />
      <AlertsSection alerts={state.alerts} />
      <InfrastructureSection />
    </>
  );
}

function Toolbar({
  lastReading,
  isSimulating,
  onSimulate,
}: {
  lastReading: Date;
  isSimulating: boolean;
  onSimulate: () => void;
}) {
  return (
    <section className="toolbar">
      <div className="toolbar__info">
        <span className="toolbar__label">Última leitura orbital</span>
        <span className="toolbar__time">{formatDateTime(lastReading)} UTC-3</span>
      </div>
      <button type="button" className={`btn-orbit${isSimulating ? " is-loading" : ""}`} onClick={onSimulate} disabled={isSimulating}>
        Simular nova leitura orbital
      </button>
    </section>
  );
}

function KpiGrid({ kpis, isUpdating }: { kpis: Kpis; isUpdating: boolean }) {
  const sensorPercent = Math.round((kpis.sensors.active / kpis.sensors.total) * 100);
  const items = [
    { label: "Risco médio da cidade", value: kpis.cityRisk.label, percent: kpis.cityRisk.score, critical: false },
    { label: "Regiões monitoradas", value: `${kpis.regions.active}/${kpis.regions.total}`, percent: 100, critical: false },
    { label: "Sensores ativos", value: `${kpis.sensors.active}/${kpis.sensors.total}`, percent: sensorPercent, critical: false },
    { label: "Satélites", value: String(kpis.satellites.count), percent: (kpis.satellites.count / 5) * 100, critical: false },
    { label: "Alertas críticos", value: String(kpis.criticalAlerts), percent: Math.min(kpis.criticalAlerts * 25, 100), critical: true },
  ];

  return (
    <section className="kpis">
      {items.map((item) => (
        <article key={item.label} className={`kpi card${item.critical ? " kpi--critical" : ""}${isUpdating ? " is-updating" : ""}`}>
          <span className="kpi__label">{item.label}</span>
          <p className="kpi__value">{item.value}</p>
          <div className="progress-bar"><span className="progress-bar__fill" style={{ width: `${item.percent}%` }} /></div>
        </article>
      ))}
    </section>
  );
}

function UrbanMap({
  regions,
  selectedRegion,
  onSelectRegion,
}: {
  regions: OrbitTwinState["regions"];
  selectedRegion: RegionKey;
  onSelectRegion: (region: RegionKey) => void;
}) {
  return (
    <div className="map-card card">
      <header className="section-head">
        <div>
          <h2>Mapa urbano de risco</h2>
          <p>Monitoramento por região · Defesa Civil</p>
        </div>
      </header>
      <div className="urban-map" role="group">
        {REGION_KEYS.map((key) => {
          const region = regions[key];
          return (
            <button
              key={key}
              type="button"
              className={`zone ${ZONE_CLASS_BY_REGION[key]}`}
              data-risk={region.risk}
              aria-pressed={selectedRegion === key}
              onClick={() => onSelectRegion(key)}
            >
              <span className="zone__name">{region.name}</span>
              <span className={`zone__badge ${riskClass(region.risk)}`}>{RISK_LABELS[region.risk]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AnalysisPanel({ region }: { region: Region }) {
  const sensors = useMemo(() => parseSensorActivity(region.sensors), [region.sensors]);
  return (
    <aside className="analysis card">
      <header className="section-head section-head--compact">
        <h2>Análise da região</h2>
        <p>{region.name}</p>
      </header>
      <p className="analysis-rec">{region.recommendation}</p>
      <p className="kpi__meta">Sensores: {region.sensors} ({sensors.percent}%) · {region.source}</p>
    </aside>
  );
}

function SpatialData({ spatial, isUpdating }: { spatial: Record<string, SpatialMetric>; isUpdating: boolean }) {
  return (
    <section className="spatial card">
      <header className="section-head"><h2>Dados espaciais</h2></header>
      <div className="spatial-grid">
        {Object.entries(spatial).map(([key, item]) => (
          <div key={key} className={`spatial-item${isUpdating ? " is-updating" : ""}`}>
            <div className="spatial-item__label">{SPATIAL_LABELS[key as keyof typeof SPATIAL_LABELS]}</div>
            <div className="spatial-item__value">{item.value} <span className="spatial-item__unit">{item.unit}</span></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AlertsSection({ alerts }: { alerts: Alert[] }) {
  return (
    <section className="alerts card">
      <header className="section-head"><h2>Alertas inteligentes</h2><span className="alerts-count">{alerts.length} ativos</span></header>
      <div className="alerts-grid">
        {alerts.map((alert) => (
          <article key={`${alert.time}-${alert.region}`} className={`alert-card alert-card--${alert.type}`}>
            <p className="alert-card__region">{alert.region}</p>
            <p className="alert-card__rec">{alert.recommendation}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function InfrastructureSection() {
  return (
    <section className="infra card">
      <header className="section-head"><h2>Infraestrutura Cloud</h2></header>
      <p className="architecture__intro">Docker → ACR → ACI → Nginx :80 → DNS público</p>
    </section>
  );
}
