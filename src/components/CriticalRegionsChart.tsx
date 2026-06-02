import { RISK_LABELS } from "../data";
import type { CriticalRegion } from "../types/decisionDashboard";
import type { RiskLevel } from "../types";
import { DataStatusBadge } from "./DataStatusBadge";

type CriticalRegionsChartProps = {
  regions: CriticalRegion[];
};

const DONUT_COLORS: Record<RiskLevel, string> = {
  critical: "#ff6b6b",
  high: "#fcc419",
  medium: "#22d3ee",
  low: "#40c057",
};

const DONUT_TRACK = "rgba(255, 255, 255, 0.08)";

export function CriticalRegionsChart({ regions }: CriticalRegionsChartProps) {
  const topDonuts = regions.slice(0, 4);
  const rest = regions.slice(4);

  return (
    <section className="critical-regions glass-surface" aria-labelledby="critical-regions-title">
      <header className="critical-regions__head">
        <h3 id="critical-regions-title">
          <span className="critical-regions__icon" aria-hidden="true" />
          Regiões mais críticas (%)
        </h3>
      </header>

      <div className="critical-regions__donuts" role="list">
        {topDonuts.map((region) => (
          <RegionDonut key={region.id} region={region} />
        ))}
      </div>

      {rest.length > 0 && (
        <ul className="critical-regions__list critical-regions__list--compact">
          {rest.map((region) => (
            <li key={region.id} className="critical-regions__item critical-regions__item--compact">
              <span className="critical-regions__name">{region.name}</span>
              <span className="critical-regions__score-inline">{region.riskScore}%</span>
              <span className="critical-regions__level">{RISK_LABELS[region.riskLevel]}</span>
              <DataStatusBadge mode={region.source} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RegionDonut({ region }: { region: CriticalRegion }) {
  const size = 88;
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, region.riskScore));
  const dashOffset = circumference - (progress / 100) * circumference;
  const color = DONUT_COLORS[region.riskLevel];

  return (
    <figure className="critical-donut" role="listitem" title={`${region.name}: ${progress}%`}>
      <svg
        className="critical-donut__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={DONUT_TRACK}
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center})`}
          className="critical-donut__ring"
        />
      </svg>
      <figcaption className="critical-donut__caption">
        <span className="critical-donut__value" style={{ color }}>
          {progress}%
        </span>
        <span className="critical-donut__name">{shortRegionName(region.name)}</span>
      </figcaption>
    </figure>
  );
}

function shortRegionName(name: string): string {
  if (name.length <= 14) return name;
  return name.replace("Marginal ", "Marg. ").replace("Centro Expandido", "Centro");
}
