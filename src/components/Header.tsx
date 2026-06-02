import type { AppMode } from "../types";
import { ViewModeToggle } from "./ViewModeToggle";

type HeaderProps = {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
};

export function Header({ mode, onModeChange }: HeaderProps) {
  return (
    <header className="header header--compact">
      <div className="header__inner">
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
