import type { AppMode } from "../types";
import { ModeToggle } from "./ModeToggle";

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
            <p className="header__subtitle">Gêmeo digital urbano com dados espaciais, sensores IoT e IA</p>
          </div>
        </div>
        <div className="header__meta">
          <ModeToggle mode={mode} onChange={onModeChange} />
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
