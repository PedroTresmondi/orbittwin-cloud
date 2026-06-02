type HeroSectionProps = {
  onPlanRoute: () => void;
  onOpenManager: () => void;
  onDemoFlood: () => void;
  isLoading?: boolean;
};

export function HeroSection({ onPlanRoute, onOpenManager, onDemoFlood, isLoading = false }: HeroSectionProps) {
  return (
    <section className="hero card" aria-labelledby="hero-title">
      <div className="hero__content">
        <p className="hero__eyebrow">Global Solution 2026 · Gêmeo digital urbano</p>
        <h2 id="hero-title">OrbitTwin</h2>
        <p className="hero__subtitle">Planeje rotas mais seguras em dias de risco climático.</p>
        <p className="hero__text">
          Digite origem e destino para encontrar uma rota mais segura em cenários de chuva, enchente ou risco urbano.
          Usamos <strong>dados reais</strong> (OSRM, Nominatim, Open-Meteo) e <strong>simulação de eventos</strong> para
          demonstração na apresentação.
        </p>
        <div className="hero__example card">
          <span className="hero__example-label">Exemplo rápido</span>
          <p>
            <strong>Origem:</strong> Avenida Paulista · <strong>Destino:</strong> Estação Santo Amaro
          </p>
          <button
            type="button"
            className="btn-orbit btn-orbit--large"
            disabled={isLoading}
            onClick={onDemoFlood}
          >
            {isLoading ? "Calculando exemplo…" : "Testar exemplo com enchente simulada"}
          </button>
        </div>
        <div className="hero__actions">
          <button type="button" className="btn-secondary btn-secondary--hero" onClick={onPlanRoute}>
            Planejar rota segura
          </button>
          <button type="button" className="btn-secondary btn-secondary--hero" onClick={onOpenManager}>
            Acessar painel gestor
          </button>
        </div>
      </div>
      <ul className="hero__features" aria-label="Destaques do produto">
        <li>Dados reais + fallback automático</li>
        <li>Simulação: chuva, enchente, bloqueio</li>
        <li>Modo Cidadão e Modo Gestor</li>
      </ul>
    </section>
  );
}
