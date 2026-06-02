type GsPresenterBarProps = {
  step: number;
  onStepChange?: (step: number) => void;
};

const STEPS = [
  { id: 1, label: "Demo", hint: "Desvio crítico" },
  { id: 2, label: "Mapa", hint: "Vermelho vs ciano" },
  { id: 3, label: "Gestor", hint: "KPIs e alertas" },
  { id: 4, label: "Cenário", hint: "+ Enchente opcional" },
];

export function GsPresenterBar({ step, onStepChange }: GsPresenterBarProps) {
  return (
    <aside className="gs-presenter glass-surface" aria-label="Roteiro de apresentação GS">
      <span className="gs-presenter__title">Roteiro GS</span>
      <ol className="gs-presenter__steps">
        {STEPS.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className={`gs-presenter__step${step === s.id ? " is-active" : ""}${step > s.id ? " is-done" : ""}`}
              onClick={() => onStepChange?.(s.id)}
            >
              <span className="gs-presenter__num">{s.id}</span>
              <span className="gs-presenter__text">
                {s.label}
                <small>{s.hint}</small>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </aside>
  );
}
