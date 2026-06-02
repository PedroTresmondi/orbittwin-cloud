import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import L from "leaflet";
import {
  ALERT_LABELS,
  createInitialState,
  OPERATIONAL_PLACES,
  REGION_KEYS,
  RISK_LABELS,
  RISK_SCORE,
  SPATIAL_LABELS,
  TRAVEL_PROFILE_LABELS,
  ZONE_CLASS_BY_REGION,
} from "./data";
import {
  buildRouteRecommendation,
  computeCityRisk,
  formatDateTime,
  parseSensorActivity,
  riskClass,
  routeRiskLabel,
  simulateOrbitalReading,
} from "./simulation";
import { calculateSafeRoute } from "./services/routeEngine";
import { loadOperationalHistory, persistOperationalHistory } from "./services/storage";
import type {
  Alert,
  Kpis,
  OperationalEvent,
  OperationalPlace,
  OrbitTwinState,
  Region,
  RegionKey,
  RouteData,
  RouteInputs,
  SpatialMetric,
} from "./types";

const infrastructureNodes = [
  { icon: "▣", title: "Docker", description: "Imagem orbittwin-cloud:v2", tag: "Build React" },
  { icon: "◈", title: "Vite", description: "Build estático otimizado", tag: "TypeScript" },
  { icon: "◆", title: "Azure Container Registry", description: "Armazena e versiona a imagem", tag: "ACR" },
  { icon: "☁", title: "Azure Container Instances", description: "Executa o container em nuvem", tag: "ACI · Ativo", highlight: true },
  { icon: "◎", title: "Nginx", description: "Serve os artefatos dist/", tag: "Porta 80" },
];

function App() {
  const [state, setState] = useState<OrbitTwinState>(() => {
    const initial = createInitialState();
    return {
      ...initial,
      kpis: {
        ...initial.kpis,
        cityRisk: computeCityRisk(initial.regions),
        criticalAlerts: initial.alerts.filter((alert) => alert.type === "critical").length,
      },
    };
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [operationalHistory, setOperationalHistory] = useState<OperationalEvent[]>(() => loadOperationalHistory());
  const simulateTimer = useRef<number | undefined>(undefined);

  const selectedRegion = state.regions[state.selectedRegion];
  const selectedRoute = state.routes[state.selectedRegion];
  const [routeInputs, setRouteInputs] = useState<RouteInputs>(() => ({
    originId: selectedRoute.originPlaceId,
    destinationId: selectedRoute.destinationPlaceId,
    profile: "emergency",
  }));

  const handleSelectRegion = useCallback((region: RegionKey) => {
    setState((current) => ({ ...current, selectedRegion: region }));
  }, []);

  const handleSimulateReading = useCallback(() => {
    setIsSimulating(true);
    window.clearTimeout(simulateTimer.current);

    simulateTimer.current = window.setTimeout(() => {
      setState((current) => simulateOrbitalReading(current));
      setIsSimulating(false);
    }, 600);
  }, []);

  const handleGenerateRoute = useCallback(() => {
    if (routeInputs.originId === routeInputs.destinationId) {
      setRouteError("Selecione origem e destino diferentes para calcular uma rota operacional.");
      return;
    }

    const regionKey = state.selectedRegion;
    const region = state.regions[regionKey];
    const currentRoute = state.routes[regionKey];

    setIsRouting(true);
    setRouteError(null);

    void calculateSafeRoute(regionKey, region, currentRoute, routeInputs)
      .then((result) => {
        setState((current) => ({
          ...current,
          routes: {
            ...current.routes,
            [regionKey]: result.route,
          },
        }));

        const event: OperationalEvent = {
          id: createOperationId(),
          timestamp: formatDateTime(new Date()),
          region: region.name,
          origin: result.route.origin,
          destination: result.route.destination,
          profile: routeInputs.profile,
          source: result.route.source,
          decision: result.route.recommendation,
          riskReduction: Math.max(result.route.conventionalRisk - result.route.safeRisk, 0),
          confidence: result.route.confidence,
        };

        setOperationalHistory((current) => persistOperationalHistory([event, ...current]));

        if (result.usedFallback) {
          setRouteError(`${result.error ?? "OSRM indisponível."} Usando motor local de contingência.`);
        }
      })
      .catch((error: unknown) => {
        setRouteError(error instanceof Error ? error.message : "Falha ao calcular rota segura.");
      })
      .finally(() => {
      setIsRouting(false);
      });
  }, [routeInputs, state]);

  useEffect(() => {
    const route = state.routes[state.selectedRegion];
    setRouteInputs((current) => ({
      originId: route.originPlaceId,
      destinationId: route.destinationPlaceId,
      profile: current.profile,
    }));
    setRouteError(null);
  }, [state.selectedRegion]);

  useEffect(() => {
    return () => {
      window.clearTimeout(simulateTimer.current);
    };
  }, []);

  return (
    <>
      <BackgroundLayers />
      <Header />

      <main className="dashboard">
        <Toolbar lastReading={state.lastReading} isSimulating={isSimulating} onSimulate={handleSimulateReading} />
        <KpiGrid kpis={state.kpis} isUpdating={isSimulating} />

        <section className="main-grid">
          <UrbanMap
            regions={state.regions}
            selectedRegion={state.selectedRegion}
            onSelectRegion={handleSelectRegion}
          />
          <AnalysisPanel region={selectedRegion} />
        </section>

        <RoutesSection
          region={selectedRegion}
          route={selectedRoute}
          places={OPERATIONAL_PLACES}
          inputs={routeInputs}
          history={operationalHistory}
          isRouting={isRouting}
          routeError={routeError}
          onInputsChange={setRouteInputs}
          onGenerateRoute={handleGenerateRoute}
        />
        <SpatialData spatial={state.spatial} isUpdating={isSimulating} />
        <AlertsSection alerts={state.alerts} />
        <InfrastructureSection />
      </main>

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

function Header() {
  return (
    <header className="header">
      <div className="header__inner">
        <div className="header__brand">
          <div className="header__logo" aria-hidden="true">
            <span className="logo-orbit" />
            <span className="logo-core" />
            <span className="logo-satellite" />
          </div>
          <div className="header__titles">
            <h1>OrbitTwin Cloud</h1>
            <p className="header__subtitle">Gêmeo digital urbano com dados espaciais, sensores IoT e IA</p>
          </div>
        </div>
        <div className="header__meta">
          <span className="badge badge--gs">Global Solution 2026 | Indústria Espacial</span>
          <span className="badge badge--azure">
            <span className="status-dot" />
            Publicado em Azure Container Instances
          </span>
        </div>
      </div>
    </header>
  );
}

type ToolbarProps = {
  lastReading: Date;
  isSimulating: boolean;
  onSimulate: () => void;
};

function Toolbar({ lastReading, isSimulating, onSimulate }: ToolbarProps) {
  return (
    <section className="toolbar">
      <div className="toolbar__info">
        <span className="toolbar__label">Última leitura orbital</span>
        <span className="toolbar__time">{formatDateTime(lastReading)} UTC-3</span>
      </div>
      <button
        type="button"
        className={`btn-orbit${isSimulating ? " is-loading" : ""}`}
        onClick={onSimulate}
        disabled={isSimulating}
      >
        <span className="btn-orbit__icon" aria-hidden="true">◌</span>
        Simular nova leitura orbital
      </button>
    </section>
  );
}

type KpiGridProps = {
  kpis: Kpis;
  isUpdating: boolean;
};

function KpiGrid({ kpis, isUpdating }: KpiGridProps) {
  const sensorPercent = Math.round((kpis.sensors.active / kpis.sensors.total) * 100);

  const items = [
    {
      icon: "≈",
      label: "Risco médio da cidade",
      value: kpis.cityRisk.label,
      fillClass: "",
      percent: kpis.cityRisk.score,
      meta: `Índice ${kpis.cityRisk.score}/100`,
      critical: false,
    },
    {
      icon: "□",
      label: "Regiões monitoradas",
      value: `${kpis.regions.active} / ${kpis.regions.total}`,
      fillClass: "progress-bar__fill--cyan",
      percent: (kpis.regions.active / kpis.regions.total) * 100,
      meta: "Cobertura do gêmeo digital",
      critical: false,
    },
    {
      icon: "⌁",
      label: "Sensores ativos",
      value: `${kpis.sensors.active} / ${kpis.sensors.total}`,
      fillClass: "progress-bar__fill--green",
      percent: sensorPercent,
      meta: `${sensorPercent}% operacionais`,
      critical: false,
    },
    {
      icon: "◍",
      label: "Satélites simulados",
      value: String(kpis.satellites.count),
      fillClass: "progress-bar__fill--purple",
      percent: (kpis.satellites.count / 5) * 100,
      meta: kpis.satellites.names,
      critical: false,
    },
    {
      icon: "!",
      label: "Alertas críticos",
      value: String(kpis.criticalAlerts),
      fillClass: "progress-bar__fill--red",
      percent: Math.min(kpis.criticalAlerts * 25, 100),
      meta: "Processados por IA",
      critical: true,
    },
  ];

  return (
    <section className="kpis" aria-label="Indicadores principais">
      {items.map((item) => (
        <article key={item.label} className={`kpi card${item.critical ? " kpi--critical" : ""}${isUpdating ? " is-updating" : ""}`}>
          <div className="kpi__head">
            <span className="kpi__icon">{item.icon}</span>
            <span className="kpi__label">{item.label}</span>
          </div>
          <p className="kpi__value">{item.value}</p>
          <div className="progress-bar" aria-hidden="true">
            <span className={`progress-bar__fill ${item.fillClass}`} style={{ width: `${item.percent}%` }} />
          </div>
          <span className="kpi__meta">{item.meta}</span>
        </article>
      ))}
    </section>
  );
}

type UrbanMapProps = {
  regions: OrbitTwinState["regions"];
  selectedRegion: RegionKey;
  onSelectRegion: (region: RegionKey) => void;
};

function UrbanMap({ regions, selectedRegion, onSelectRegion }: UrbanMapProps) {
  return (
    <div className="map-card card">
      <header className="section-head">
        <div>
          <h2>Mapa urbano de risco</h2>
          <p>Telemetria integrada · sensores IoT · correção orbital</p>
        </div>
        <div className="data-stream" aria-hidden="true">
          <span /><span /><span />
        </div>
      </header>

      <div className="urban-map" role="group" aria-label="Regiões urbanas monitoradas">
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
              <span className="zone__pulse" aria-hidden="true" />
              <span className="zone__name">{region.name}</span>
              <span className={`zone__badge ${riskClass(region.risk)}`}>{RISK_LABELS[region.risk]}</span>
              <span className="zone__bar" style={{ transform: `scaleX(${RISK_SCORE[region.risk] / 100})` }} aria-hidden="true" />
            </button>
          );
        })}
        <div className="urban-map__hub" aria-hidden="true">
          <span className="hub-ring" />
          <span className="hub-label">ORBIT<br />TWIN</span>
        </div>
        <svg className="urban-map__lines" viewBox="0 0 600 400" preserveAspectRatio="none" aria-hidden="true">
          <line x1="300" y1="200" x2="150" y2="80" className="data-line" />
          <line x1="300" y1="200" x2="450" y2="80" className="data-line" />
          <line x1="300" y1="200" x2="100" y2="200" className="data-line" />
          <line x1="300" y1="200" x2="500" y2="200" className="data-line" />
          <line x1="300" y1="200" x2="150" y2="320" className="data-line" />
          <line x1="300" y1="200" x2="450" y2="320" className="data-line" />
        </svg>
      </div>

      <div className="map-legend">
        <span><i className="dot dot--low" /> Baixo</span>
        <span><i className="dot dot--medium" /> Médio</span>
        <span><i className="dot dot--high" /> Alto</span>
        <span><i className="dot dot--critical" /> Crítico</span>
      </div>
    </div>
  );
}

function AnalysisPanel({ region }: { region: Region }) {
  const riskPercent = RISK_SCORE[region.risk];
  const sensors = useMemo(() => parseSensorActivity(region.sensors), [region.sensors]);

  return (
    <aside className="analysis card" aria-live="polite" aria-atomic="true">
      <header className="section-head section-head--compact">
        <h2>Análise da Região</h2>
        <p>{region.name} · telemetria em tempo real</p>
      </header>
      <div className="analysis__body">
        <AnalysisBlock label="Região" value={region.name} />
        <div className="analysis-block">
          <span className="analysis-block__label">Nível de risco</span>
          <span className={`analysis-block__value analysis-block__value--risk ${riskClass(region.risk)}`}>
            {RISK_LABELS[region.risk]}
          </span>
        </div>
        <AnalysisMetric
          label="Índice de risco"
          value={`${riskPercent}%`}
          percent={riskPercent}
          fill="linear-gradient(90deg,var(--orange),var(--red))"
        />
        <AnalysisMetric
          label="Chuva prevista (6h)"
          value={region.rain}
          percent={Math.min(riskPercent + 8, 92)}
          fill="linear-gradient(90deg,var(--blue),var(--cyan))"
        />
        <AnalysisMetric
          label="Sensores ativos"
          value={region.sensors}
          percent={sensors.percent}
          fill="linear-gradient(90deg,#16a34a,var(--green))"
        />
        <AnalysisBlock label="Fonte espacial simulada" value={region.source} />
        <div className="analysis-block">
          <span className="analysis-block__label">Recomendação preventiva</span>
          <p className="analysis-rec">{region.recommendation}</p>
        </div>
      </div>
    </aside>
  );
}

function AnalysisBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="analysis-block">
      <span className="analysis-block__label">{label}</span>
      <span className="analysis-block__value">{value}</span>
    </div>
  );
}

type AnalysisMetricProps = {
  label: string;
  value: string;
  percent: number;
  fill: string;
};

function AnalysisMetric({ label, value, percent, fill }: AnalysisMetricProps) {
  return (
    <div className="analysis-metric">
      <div className="analysis-metric__head">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="bar-chart">
        <span className="bar-chart__fill" style={{ width: `${percent}%`, background: fill }} />
      </div>
    </div>
  );
}

type RoutesSectionProps = {
  region: Region;
  route: RouteData;
  places: OperationalPlace[];
  inputs: RouteInputs;
  history: OperationalEvent[];
  isRouting: boolean;
  routeError: string | null;
  onInputsChange: Dispatch<SetStateAction<RouteInputs>>;
  onGenerateRoute: () => void;
};

function RoutesSection({
  region,
  route,
  places,
  inputs,
  history,
  isRouting,
  routeError,
  onInputsChange,
  onGenerateRoute,
}: RoutesSectionProps) {
  const activePlaces = useMemo(() => sortPlacesForRegion(places, route.originPlaceId, route.destinationPlaceId), [
    places,
    route.originPlaceId,
    route.destinationPlaceId,
  ]);

  return (
    <section className="routes card" aria-live="polite" aria-atomic="true">
      <header className="section-head">
        <div>
          <h2>Rotas Alternativas Seguras</h2>
          <p>Comparação entre caminho convencional e rota recomendada pelo OrbitTwin.</p>
        </div>
        <button
          type="button"
          className={`btn-orbit btn-orbit--compact${isRouting ? " is-loading" : ""}`}
          onClick={onGenerateRoute}
          disabled={isRouting}
        >
          {isRouting ? "Calculando rota..." : "Gerar rota segura"}
        </button>
      </header>

      <div className="route-controls" aria-label="Parâmetros operacionais da rota">
        <RouteSelect
          label="Origem"
          value={inputs.originId}
          options={activePlaces}
          onChange={(originId) => onInputsChange((current) => ({ ...current, originId }))}
        />
        <RouteSelect
          label="Destino"
          value={inputs.destinationId}
          options={activePlaces}
          onChange={(destinationId) => onInputsChange((current) => ({ ...current, destinationId }))}
        />
        <label className="route-field">
          <span>Perfil</span>
          <select
            value={inputs.profile}
            onChange={(event) => onInputsChange((current) => ({ ...current, profile: event.target.value as RouteInputs["profile"] }))}
          >
            {Object.entries(TRAVEL_PROFILE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="route-status" aria-label="Status do cálculo de rota">
          <span className={`source-badge source-badge--${route.source}`}>{route.source === "osrm" ? "OSRM real" : "Fallback local"}</span>
          <span>{route.confidence}% confiança</span>
        </div>
      </div>

      {routeError && <p className="route-error">{routeError}</p>}

      <div className="routes-grid">
        <RouteMap route={route} />
        <div className="route-panel">
          <RouteCard
            variant="danger"
            title="Rota convencional"
            risk={routeRiskLabel(route.conventionalRisk)}
            time={`${route.conventionalTime} min`}
            distance={`${route.conventionalDistanceKm.toFixed(1)} km`}
            score={`${route.conventionalRisk}/100`}
            label="Trechos críticos"
            items={route.criticalSegments}
            isUpdating={isRouting}
          />
          <RouteCard
            variant="safe"
            title="Rota OrbitTwin"
            risk={routeRiskLabel(route.safeRisk)}
            time={`${route.safeTime} min`}
            distance={`${route.safeDistanceKm.toFixed(1)} km`}
            score={`${route.safeRisk}/100`}
            label="Trechos críticos evitados"
            items={route.avoidedBlocks}
            isUpdating={isRouting}
          />
          <div className="route-decision">
            <span>Decisão recomendada</span>
            <strong>Priorizar rota segura</strong>
            <p>{buildRouteRecommendation(region, route)}</p>
          </div>
          <OperationalHistory history={history} />
        </div>
      </div>
    </section>
  );
}

type RouteSelectProps = {
  label: string;
  value: string;
  options: OperationalPlace[];
  onChange: (value: string) => void;
};

function RouteSelect({ label, value, options, onChange }: RouteSelectProps) {
  return (
    <label className="route-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((place) => (
          <option key={place.id} value={place.id}>
            {place.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function RouteMap({ route }: { route: RouteData }) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayersRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) return;

    const leafletMap = L.map(mapNodeRef.current, {
      attributionControl: true,
      zoomControl: true,
    }).setView(route.map.center, 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(leafletMap);

    mapRef.current = leafletMap;
    const resizeTimer = window.setTimeout(() => leafletMap.invalidateSize(), 250);

    return () => {
      window.clearTimeout(resizeTimer);
      routeLayersRef.current = [];
      leafletMap.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const leafletMap = mapRef.current;
    if (!leafletMap) return;

    routeLayersRef.current.forEach((layer) => leafletMap.removeLayer(layer));
    routeLayersRef.current = [];

    const riskPolygon = L.polygon(route.map.riskArea, {
      color: "#ef4444",
      fillColor: "#f97316",
      fillOpacity: 0.28,
      opacity: 0.9,
      weight: 2,
    })
      .bindPopup("Área de risco / alagamento previsto")
      .addTo(leafletMap);

    const conventionalLine = L.polyline(route.map.conventionalPath, {
      color: "#ef4444",
      dashArray: "8 8",
      opacity: 0.95,
      weight: 5,
    })
      .bindPopup("Rota convencional - risco elevado")
      .addTo(leafletMap);

    const safeLine = L.polyline(route.map.safePath, {
      color: "#00d4ff",
      opacity: 0.96,
      weight: 6,
    })
      .bindPopup("Rota OrbitTwin - rota segura")
      .addTo(leafletMap);

    const originMarker = L.circleMarker(route.map.originCoords, {
      color: "#dbeafe",
      fillColor: "#3b82f6",
      fillOpacity: 0.95,
      radius: 9,
      weight: 2,
    })
      .bindPopup(`Origem: ${route.origin}`)
      .bindTooltip("Origem", { direction: "top" })
      .addTo(leafletMap);

    const destinationMarker = L.circleMarker(route.map.destinationCoords, {
      color: "#dcfce7",
      fillColor: "#22c55e",
      fillOpacity: 0.95,
      radius: 9,
      weight: 2,
    })
      .bindPopup(`Destino: ${route.destination}`)
      .bindTooltip("Destino", { direction: "top" })
      .addTo(leafletMap);

    const blockMarkers = route.map.blocks.map((coords, index) =>
      L.circleMarker(coords, {
        color: "#fecaca",
        fillColor: "#ef4444",
        fillOpacity: 0.95,
        radius: 8,
        weight: 2,
      })
        .bindPopup(`Bloqueio previsto B${index + 1}`)
        .bindTooltip(`B${index + 1}`, { direction: "right" })
        .addTo(leafletMap),
    );

    routeLayersRef.current = [
      riskPolygon,
      conventionalLine,
      safeLine,
      originMarker,
      destinationMarker,
      ...blockMarkers,
    ];

    const bounds = L.latLngBounds([...route.map.conventionalPath, ...route.map.safePath]);
    if (bounds.isValid()) {
      leafletMap.fitBounds(bounds, { padding: [32, 32] });
    } else {
      leafletMap.setView(route.map.center, 12);
    }

    const resizeTimer = window.setTimeout(() => leafletMap.invalidateSize(), 150);
    return () => window.clearTimeout(resizeTimer);
  }, [route]);

  return (
    <div className="routes-map-wrap">
      <div className="route-map__meta">
        <span>Origem: {route.origin}</span>
        <span>Destino: {route.destination}</span>
      </div>

      <div ref={mapNodeRef} className="routes-map" aria-label="Mapa real com rotas alternativas" />

      <div className="route-map__legend">
        <span><i className="route-legend route-legend--danger" /> Rota convencional</span>
        <span><i className="route-legend route-legend--safe" /> Rota OrbitTwin segura</span>
        <span><i className="route-legend route-legend--risk" /> Área de risco</span>
      </div>
    </div>
  );
}

type RouteCardProps = {
  variant: "danger" | "safe";
  title: string;
  risk: string;
  time: string;
  distance: string;
  score: string;
  label: string;
  items: string[];
  isUpdating: boolean;
};

function RouteCard({ variant, title, risk, time, distance, score, label, items, isUpdating }: RouteCardProps) {
  return (
    <article className={`route-card route-card--${variant}${isUpdating ? " is-updating" : ""}`}>
      <div className="route-card__head">
        <span>{title}</span>
        <strong>{risk}</strong>
      </div>
      <dl className="route-card__metrics">
        <div>
          <dt>Tempo</dt>
          <dd>{time}</dd>
        </div>
        <div>
          <dt>Distância</dt>
          <dd>{distance}</dd>
        </div>
        <div>
          <dt>Risco</dt>
          <dd>{score}</dd>
        </div>
      </dl>
      <p className="route-card__label">{label}</p>
      <ul className="route-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function OperationalHistory({ history }: { history: OperationalEvent[] }) {
  return (
    <div className="route-history">
      <div className="route-history__head">
        <span>Histórico operacional</span>
        <strong>{history.length}</strong>
      </div>
      {history.length === 0 ? (
        <p className="route-history__empty">Nenhuma decisão registrada nesta sessão.</p>
      ) : (
        <ol className="route-history__list">
          {history.slice(0, 4).map((event) => (
            <li key={event.id}>
              <div>
                <strong>{event.region}</strong>
                <span>{event.timestamp}</span>
              </div>
              <p>
                {event.origin} → {event.destination} · {TRAVEL_PROFILE_LABELS[event.profile]} · redução {event.riskReduction} pts
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function SpatialData({ spatial, isUpdating }: { spatial: Record<string, SpatialMetric>; isUpdating: boolean }) {
  return (
    <section className="spatial card">
      <header className="section-head">
        <div>
          <h2>Dados espaciais simulados</h2>
          <p>Produtos derivados de imagens orbitais processadas pelo gêmeo digital</p>
        </div>
      </header>
      <div className="spatial-grid">
        {Object.entries(spatial).map(([key, item]) => (
          <div key={key} className={`spatial-item${isUpdating ? " is-updating" : ""}`}>
            <div className="spatial-item__label">{SPATIAL_LABELS[key as keyof typeof SPATIAL_LABELS]}</div>
            <div className="spatial-item__value">
              {item.value} <span className="spatial-item__unit">{item.unit}</span>
            </div>
            <div className="spatial-bars" aria-hidden="true">
              {item.bars.map((height, index) => (
                <span key={`${key}-${index}`} style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AlertsSection({ alerts }: { alerts: Alert[] }) {
  return (
    <section className="alerts card">
      <header className="section-head">
        <div>
          <h2>Alertas Inteligentes</h2>
          <p>Correlação automática entre sensores IoT, precipitação orbital e modelos de IA</p>
        </div>
        <span className="alerts-count">{alerts.length} ativos</span>
      </header>
      <div className="alerts-grid">
        {alerts.map((alert) => (
          <article key={`${alert.time}-${alert.region}-${alert.type}`} className={`alert-card alert-card--${alert.type}`}>
            <div className="alert-card__top">
              <span className="alert-card__time">{alert.time}</span>
              <span className={`alert-card__type alert-card__type--${alert.type}`}>{ALERT_LABELS[alert.type]}</span>
            </div>
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
      <header className="section-head">
        <div>
          <h2>Infraestrutura Cloud</h2>
          <p>Pipeline de entrega containerizada na Microsoft Azure</p>
        </div>
      </header>
      <div className="infra-flow">
        {infrastructureNodes.map((node, index) => (
          <FragmentedInfraNode
            key={node.title}
            icon={node.icon}
            title={node.title}
            description={node.description}
            tag={node.tag}
            highlight={Boolean(node.highlight)}
            showConnector={index < infrastructureNodes.length - 1}
          />
        ))}
      </div>
    </section>
  );
}

type FragmentedInfraNodeProps = {
  icon: string;
  title: string;
  description: string;
  tag: string;
  highlight: boolean;
  showConnector: boolean;
};

function FragmentedInfraNode({ icon, title, description, tag, highlight, showConnector }: FragmentedInfraNodeProps) {
  return (
    <>
      <div className={`infra-node${highlight ? " infra-node--highlight" : ""}`}>
        <div className="infra-node__icon">{icon}</div>
        <h3>{title}</h3>
        <p>{description}</p>
        <span className="infra-node__tag">{tag}</span>
      </div>
      {showConnector && (
        <div className="infra-connector" aria-hidden="true">
          <span />
        </div>
      )}
    </>
  );
}

function sortPlacesForRegion(places: OperationalPlace[], originId: string, destinationId: string): OperationalPlace[] {
  const activePlaces = new Set([originId, destinationId]);

  return [...places].sort((first, second) => {
    const activeDelta = Number(activePlaces.has(second.id)) - Number(activePlaces.has(first.id));
    if (activeDelta !== 0) return activeDelta;

    const regionDelta = first.region.localeCompare(second.region);
    if (regionDelta !== 0) return regionDelta;

    return first.name.localeCompare(second.name);
  });
}

function createOperationId(): string {
  if ("crypto" in window && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function Footer() {
  return (
    <footer className="footer">
      <p>OrbitTwin Cloud · Global Solution 2026 · Cloud Solutions &amp; Scalable Infrastructure</p>
      <p className="footer__sub">FIAP · Indústria Espacial · Gêmeo Digital Urbano</p>
    </footer>
  );
}

export default App;
