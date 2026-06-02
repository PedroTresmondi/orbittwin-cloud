type DemoQuickActionsProps = {
  isLoading: boolean;
  onRandomAndCalculate: () => void;
  onGsDetourDemo: () => void;
  onFloodDemo: () => void;
  onFillExample: () => void;
};

export function DemoQuickActions({
  isLoading,
  onRandomAndCalculate,
  onGsDetourDemo,
  onFloodDemo,
  onFillExample,
}: DemoQuickActionsProps) {
  return (
    <div className="demo-actions">
      <span className="demo-actions__label">Sem endereço? Experimente:</span>
      <div className="demo-actions__buttons">
        <button
          type="button"
          className="btn-orbit btn-secondary--sm demo-actions__primary"
          disabled={isLoading}
          aria-label="Demonstração GS: desvio em área crítica"
          onClick={onGsDetourDemo}
        >
          {isLoading ? "…" : "Demo GS: desvio crítico"}
        </button>
        <button
          type="button"
          className="btn-secondary btn-secondary--sm"
          disabled={isLoading}
          aria-label="Testar exemplo com enchente simulada"
          onClick={onFloodDemo}
        >
          {isLoading ? "…" : "+ Enchente"}
        </button>
        <button
          type="button"
          className="btn-secondary btn-secondary--sm"
          disabled={isLoading}
          onClick={onRandomAndCalculate}
        >
          Aleatória
        </button>
        <button type="button" className="btn-ghost btn-ghost--sm" disabled={isLoading} onClick={onFillExample}>
          Paulista → Santo Amaro
        </button>
      </div>
    </div>
  );
}
