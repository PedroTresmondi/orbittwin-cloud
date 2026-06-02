import type { DataMode } from "../types";

type MapDecisionCardProps = {
  extraMinutes: number;
  exposureReductionPercent: number;
  blocksAvoided: number;
  confidence: number;
  dataMode: DataMode;
};

const MODE_LABEL: Record<DataMode, string> = {
  real: "Dados reais",
  simulated: "Simulado",
  hybrid: "Híbrido",
};

export function MapDecisionCard({
  extraMinutes,
  exposureReductionPercent,
  blocksAvoided,
  confidence,
  dataMode,
}: MapDecisionCardProps) {
  const exposureLine =
    exposureReductionPercent > 0
      ? `−${exposureReductionPercent}% exposição a áreas críticas`
      : "Reduz exposição a áreas críticas";

  return (
    <aside className="map-decision-card" aria-label="Recomendação de rota segura">
      <h3 className="map-decision-card__title">Rota segura recomendada</h3>
      <p className="map-decision-card__headline">
        {extraMinutes > 0 ? (
          <>
            <strong>+{extraMinutes} min</strong> no trajeto, mas {exposureLine}.
          </>
        ) : (
          <>{exposureLine} com tempo similar.</>
        )}
      </p>
      <ul className="map-decision-card__metrics">
        <li>
          <span>Tempo adicional</span>
          <strong>{extraMinutes > 0 ? `+${extraMinutes} min` : "—"}</strong>
        </li>
        <li>
          <span>Redução de exposição</span>
          <strong>{exposureReductionPercent > 0 ? `−${exposureReductionPercent}%` : "—"}</strong>
        </li>
        <li>
          <span>Bloqueios evitados</span>
          <strong>{blocksAvoided}</strong>
        </li>
        <li>
          <span>Confiança</span>
          <strong>{confidence}%</strong>
        </li>
      </ul>
      <p className="map-decision-card__source">
        Fonte: <span className={`map-decision-card__badge map-decision-card__badge--${dataMode}`}>{MODE_LABEL[dataMode]}</span>
      </p>
    </aside>
  );
}
