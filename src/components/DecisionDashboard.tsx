import type { DecisionDashboardSnapshot } from "../types/decisionDashboard";
import { CentralStatusBadge, DataStatusBadge } from "./DataStatusBadge";
import { CriticalRegionsChart } from "./CriticalRegionsChart";
import { DecisionRecommendation } from "./DecisionRecommendation";
import { KpiCards } from "./KpiCards";
import { RecentAlerts } from "./RecentAlerts";
import { UrbanRiskMiniMap } from "./UrbanRiskMiniMap";

type DecisionDashboardProps = {
  snapshot: DecisionDashboardSnapshot;
};

export function DecisionDashboard({ snapshot }: DecisionDashboardProps) {
  return (
    <section id="decision-dashboard" className="decision-dashboard" aria-labelledby="decision-dashboard-title">
      <header className="decision-dashboard__header">
        <div>
          <h2 id="decision-dashboard-title">Indicadores para tomada de decisão</h2>
          <p className="decision-dashboard__subtitle">
            Visão estratégica para gestores públicos e equipes de emergência.
          </p>
        </div>
        <CentralStatusBadge text={snapshot.statusBadge.text} variant={snapshot.statusBadge.variant} />
      </header>

      <p className="decision-dashboard__disclaimer">
        Este painel combina dados reais de clima e rotas com camadas simuladas de risco urbano para demonstrar
        tomada de decisão preventiva.
      </p>

      <div className="decision-dashboard__sources">
        {snapshot.dataSources.map((chip) => (
          <span key={chip.name} className="decision-dashboard__chip">
            {chip.name} <DataStatusBadge mode={chip.mode} />
          </span>
        ))}
      </div>

      <KpiCards kpis={snapshot.kpis} />

      <div className="decision-dashboard__mid">
        <UrbanRiskMiniMap zones={snapshot.mapZones} markers={snapshot.mapMarkers} />
        <CriticalRegionsChart regions={snapshot.criticalRegions} />
      </div>

      <div className="decision-dashboard__bottom">
        <RecentAlerts alerts={snapshot.alerts} />
        <DecisionRecommendation recommendation={snapshot.recommendation} />
      </div>
    </section>
  );
}
