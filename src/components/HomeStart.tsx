type HomeStartProps = {
  hasOrigin: boolean;
  hasDestination: boolean;
  hasRoute: boolean;
};

export function HomeStart({ hasOrigin, hasDestination, hasRoute }: HomeStartProps) {
  if (hasRoute) return null;

  return (
    <header className="home-start">
      <h2 id="hero-title">Para onde você vai?</h2>
      <p className="home-start__lead">Compare a rota comum com uma rota mais segura em áreas de risco.</p>
      <ol className="home-start__steps" aria-label="Passos">
        <li className={hasOrigin ? "home-start__step is-done" : "home-start__step is-current"}>
          <span className="home-start__num">1</span>
          Origem
        </li>
        <li
          className={
            hasDestination
              ? "home-start__step is-done"
              : hasOrigin
                ? "home-start__step is-current"
                : "home-start__step"
          }
        >
          <span className="home-start__num">2</span>
          Destino
        </li>
        <li className={hasOrigin && hasDestination ? "home-start__step is-current" : "home-start__step"}>
          <span className="home-start__num">3</span>
          Calcular
        </li>
      </ol>
    </header>
  );
}
