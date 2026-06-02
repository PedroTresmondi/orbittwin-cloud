import type { DecisionDashboardSnapshot } from "../types/decisionDashboard";
import { CentralStatusBadge, DataStatusBadge } from "./DataStatusBadge";
import { CriticalRegionsChart } from "./CriticalRegionsChart";
import { DecisionRecommendation } from "./DecisionRecommendation";
import { GlassAccordion } from "./GlassAccordion";
import { KpiCards } from "./KpiCards";
import { RecentAlerts } from "./RecentAlerts";
import { UrbanRiskMiniMap } from "./UrbanRiskMiniMap";

type DecisionDashboardProps = {
  snapshot: DecisionDashboardSnapshot;
};

export function DecisionDashboard({ snapshot }: DecisionDashboardProps) {
  const realSources = snapshot.dataSources.filter((c) => c.mode === "real").length;

  return (
    <section id="decision-dashboard" className="decision-dashboard glass-surface" aria-labelledby="decision-dashboard-title">
      <header className="decision-dashboard__header">
        <div className="decision-dashboard__titles">
          <h2 id="decision-dashboard-title">Painel de decisão</h2>
          <p className="decision-dashboard__subtitle">KPIs, risco urbano e alertas vinculados à rota acima.</p>
        </div>
        <CentralStatusBadge text={snapshot.statusBadge.text} variant={snapshot.statusBadge.variant} />
      </header>

      <div className="decision-dashboard__kpis-wrap">
        <KpiCards kpis={snapshot.kpis} />
      </div>

      <div className="decision-dashboard__grid">
        <GlassAccordion title="Mapa de risco urbano" subtitle="Zonas em São Paulo" defaultOpen>
          <UrbanRiskMiniMap zones={snapshot.mapZones} markers={snapshot.mapMarkers} />
        </GlassAccordion>

        <GlassAccordion title="Regiões críticas" subtitle="Ranking por exposição" defaultOpen>
          <CriticalRegionsChart regions={snapshot.criticalRegions} />
        </GlassAccordion>
      </div>

      <GlassAccordion title="Alertas recentes" subtitle={`${snapshot.alerts.length} ativos`}>
        <RecentAlerts alerts={snapshot.alerts} />
      </GlassAccordion>

      <GlassAccordion title="Recomendação OrbitTwin" subtitle={`Confiança ${snapshot.recommendation.confidence}%`} defaultOpen>
        <DecisionRecommendation recommendation={snapshot.recommendation} />
      </GlassAccordion>

      <GlassAccordion title="Fontes de dados" subtitle={`${realSources} fontes reais`}>
        <div className="decision-dashboard__sources">
          {snapshot.dataSources.map((chip) => (
            <span key={chip.name} className="decision-dashboard__chip">
              <span className="decision-dashboard__chip-name">{chip.name}</span>
              <DataStatusBadge mode={chip.mode} />
            </span>
          ))}
        </div>
      </GlassAccordion>
    </section>
  );
}
