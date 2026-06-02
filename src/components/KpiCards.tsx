import type { DecisionKpi } from "../types/decisionDashboard";
import { DataStatusBadge } from "./DataStatusBadge";

type KpiCardsProps = {
  kpis: DecisionKpi[];
};

export function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <section className="decision-kpis" aria-label="Indicadores principais">
      {kpis.map((kpi) => (
        <article key={kpi.id} className="decision-kpi card">
          <div className="decision-kpi__head">
            <span className="decision-kpi__label">{kpi.label}</span>
            <DataStatusBadge mode={kpi.source} />
          </div>
          <p className="decision-kpi__value">{kpi.value}</p>
        </article>
      ))}
    </section>
  );
}
