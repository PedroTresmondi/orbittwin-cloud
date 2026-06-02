import type { DashboardDataMode } from "../types/decisionDashboard";

const MODE_LABELS: Record<DashboardDataMode, string> = {
  real: "Real",
  simulated: "Simulado",
  hybrid: "Híbrido",
  fallback: "Fallback",
};

type DataStatusBadgeProps = {
  mode: DashboardDataMode;
  size?: "sm" | "md";
};

export function DataStatusBadge({ mode, size = "sm" }: DataStatusBadgeProps) {
  return (
    <span className={`data-status-badge data-status-badge--${mode} data-status-badge--${size}`}>
      {MODE_LABELS[mode]}
    </span>
  );
}

type CentralStatusBadgeProps = {
  text: string;
  variant: "live" | "simulation" | "hybrid" | "fallback";
};

export function CentralStatusBadge({ text, variant }: CentralStatusBadgeProps) {
  return <span className={`central-status-badge central-status-badge--${variant}`}>{text}</span>;
}
