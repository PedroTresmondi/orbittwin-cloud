import type { AppMode } from "../types";
import { ViewModeToggle } from "./ViewModeToggle";

type HeaderProps = {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
};

export function Header({ mode, onModeChange }: HeaderProps) {
  return (
    <header className="header">
      <div className="header__inner">
        <div className="header__brand">
          <div className="header__logo" aria-hidden="true">
            <span className="logo-orbit" />
            <span className="logo-core" />
            <span className="logo-satellite" />
          </div>
          <div className="header__titles">
            <h1>OrbitTwin Cloud</h1>
            <p className="header__subtitle">Google Maps de segurança climática · São Paulo</p>
          </div>
        </div>
        <div className="header__meta">
          <ViewModeToggle mode={mode} onChange={onModeChange} />
          <span className="badge badge--gs">Global Solution 2026 | Indústria Espacial</span>
          <span className="badge badge--azure">
            <span className="status-dot" />
            Publicado em Azure Container Instances
          </span>
        </div>
      </div>
    </header>
  );
}
