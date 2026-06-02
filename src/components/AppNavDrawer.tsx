import type { AppMode } from "../types";
import { GlassDrawer } from "./GlassDrawer";

type AppNavDrawerProps = {
  open: boolean;
  mode: AppMode;
  onClose: () => void;
  onModeChange: (mode: AppMode) => void;
  onNavigate: (target: "planner" | "dashboard" | "demo") => void;
};

export function AppNavDrawer({ open, mode, onClose, onModeChange, onNavigate }: AppNavDrawerProps) {
  const go = (target: "planner" | "dashboard" | "demo") => {
    onNavigate(target);
    onClose();
  };

  return (
    <GlassDrawer open={open} onClose={onClose} title="Menu OrbitTwin" side="left">
      <nav className="nav-drawer" aria-label="Navegação principal">
        <p className="nav-drawer__section">Planejamento</p>
        <button type="button" className="nav-drawer__item" onClick={() => go("planner")}>
          <span className="nav-drawer__icon" aria-hidden="true">◎</span>
          Planejar rota segura
        </button>
        <button type="button" className="nav-drawer__item" onClick={() => go("demo")}>
          <span className="nav-drawer__icon" aria-hidden="true">◈</span>
          Demo GS: desvio crítico
        </button>

        <p className="nav-drawer__section">Modo de uso</p>
        <button
          type="button"
          className={`nav-drawer__item${mode === "citizen" ? " is-active" : ""}`}
          onClick={() => {
            onModeChange("citizen");
            onClose();
          }}
        >
          Cidadão
        </button>
        <button
          type="button"
          className={`nav-drawer__item${mode === "manager" ? " is-active" : ""}`}
          onClick={() => {
            onModeChange("manager");
            go("dashboard");
          }}
        >
          Gestor · Indicadores
        </button>

        <p className="nav-drawer__section">Sobre</p>
        <p className="nav-drawer__meta">
          Global Solution 2026 · São Paulo
          <br />
          OSRM · Open-Meteo · NASA FIRMS
        </p>
      </nav>
    </GlassDrawer>
  );
}
