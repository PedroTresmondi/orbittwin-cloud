import { RISK_LABELS } from "../data";
import type { AlertItem } from "../types/decisionDashboard";
import { DataStatusBadge } from "./DataStatusBadge";

type RecentAlertsProps = {
  alerts: AlertItem[];
};

export function RecentAlerts({ alerts }: RecentAlertsProps) {
  return (
    <ul className="recent-alerts__list">
      {alerts.map((alert) => (
        <li key={alert.id} className={`recent-alerts__item recent-alerts__item--${alert.severity}`}>
          <div className="recent-alerts__top">
            <strong>{alert.title}</strong>
            <span className="recent-alerts__time">{alert.time}</span>
          </div>
          <p className="recent-alerts__region">
            {alert.region} · {RISK_LABELS[alert.severity]}
          </p>
          <p className="recent-alerts__action">{alert.action}</p>
          <DataStatusBadge mode={alert.source} />
        </li>
      ))}
    </ul>
  );
}
