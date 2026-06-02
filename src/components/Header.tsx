import type { AppMode } from "../types";
import { ViewModeToggle } from "./ViewModeToggle";

type HeaderProps = {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onMenuOpen: () => void;
};

export function Header({ mode, onModeChange, onMenuOpen }: HeaderProps) {
  return (
    <header className="header header--glass">
      <div className="header__inner">
        <button type="button" className="header__menu" aria-label="Abrir menu" onClick={onMenuOpen}>
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
        <div className="header__brand">
          <div className="header__logo" aria-hidden="true">
            <span className="logo-orbit" />
            <span className="logo-core" />
            <span className="logo-satellite" />
          </div>
          <div className="header__titles">
            <h1>OrbitTwin</h1>
            <p className="header__subtitle">Rotas seguras · São Paulo</p>
          </div>
        </div>
        <ViewModeToggle mode={mode} onChange={onModeChange} />
      </div>
    </header>
  );
}
