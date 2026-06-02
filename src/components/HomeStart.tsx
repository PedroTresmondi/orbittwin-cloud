type HomeStartProps = {
  hasOrigin: boolean;
  hasDestination: boolean;
  hasRoute: boolean;
};

export function HomeStart({ hasOrigin, hasDestination, hasRoute }: HomeStartProps) {
  if (hasRoute) {
    return (
      <header className="home-start home-start--compact">
        <h2 id="hero-title">Sua rota</h2>
        <p className="home-start__lead">Use as abas abaixo para ver o mapa, simular riscos ou abrir detalhes.</p>
      </header>
    );
  }

  const step = !hasOrigin ? 1 : !hasDestination ? 2 : 3;

  return (
    <header className="home-start">
      <h2 id="hero-title">Para onde você vai?</h2>
      <p className="home-start__lead">
        Informe origem e destino em São Paulo. O OrbitTwin compara a rota comum com uma alternativa mais segura.
      </p>
      <p className="home-start__step-hint" aria-live="polite">
        Passo {step} de 3: {step === 1 ? "origem" : step === 2 ? "destino" : "calcular"}
      </p>
    </header>
  );
}
