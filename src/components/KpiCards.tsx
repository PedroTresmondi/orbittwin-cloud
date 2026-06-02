import type { DecisionKpi } from "../types/decisionDashboard";
import { DataStatusBadge } from "./DataStatusBadge";

type KpiCardsProps = {
  kpis: DecisionKpi[];
};

export function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <section className="decision-kpis" aria-label="Indicadores principais">
      {kpis.map((kpi) => (
        <article key={kpi.id} className="decision-kpi glass-surface">
          <span className="decision-kpi__label">{kpi.label}</span>
          <div className="decision-kpi__badge">
            <DataStatusBadge mode={kpi.source} size="md" />
          </div>
          <p className="decision-kpi__value">{kpi.value}</p>
        </article>
      ))}
    </section>
  );
}
