import type { AppMode } from "../types";

type ModeToggleProps = {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
};

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="mode-toggle" role="tablist" aria-label="Modo de uso">
      <button
        type="button"
        role="tab"
        aria-selected={mode === "citizen"}
        className={`mode-toggle__btn${mode === "citizen" ? " is-active" : ""}`}
        onClick={() => onChange("citizen")}
      >
        Cidadão
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "manager"}
        className={`mode-toggle__btn${mode === "manager" ? " is-active" : ""}`}
        onClick={() => onChange("manager")}
      >
        Gestor
      </button>
    </div>
  );
}
