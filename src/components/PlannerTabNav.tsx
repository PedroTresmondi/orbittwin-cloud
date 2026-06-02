export type PlannerTabId = "map" | "simulate" | "details";

export type PlannerTab = {
  id: PlannerTabId;
  label: string;
};

const CITIZEN_TABS: PlannerTab[] = [
  { id: "map", label: "Mapa" },
  { id: "simulate", label: "Simular" },
  { id: "details", label: "Detalhes" },
];

const MANAGER_TABS: PlannerTab[] = [
  { id: "map", label: "Mapa" },
  { id: "simulate", label: "Cenários" },
  { id: "details", label: "Comparativo" },
];

type PlannerTabNavProps = {
  active: PlannerTabId;
  isManager: boolean;
  simulateActive: boolean;
  onChange: (tab: PlannerTabId) => void;
  onScrollToIndicators?: () => void;
};

export function PlannerTabNav({
  active,
  isManager,
  simulateActive,
  onChange,
  onScrollToIndicators,
}: PlannerTabNavProps) {
  const tabs = isManager ? MANAGER_TABS : CITIZEN_TABS;

  return (
    <div className="planner-tabs-row">
      <nav className="planner-tabs" aria-label="Seções da rota">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            className={`planner-tabs__btn${active === tab.id ? " is-active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
            {tab.id === "simulate" && simulateActive && (
              <span className="planner-tabs__dot" aria-label="Simulação ativa" />
            )}
          </button>
        ))}
      </nav>
      {isManager && onScrollToIndicators && (
        <button type="button" className="planner-tabs__jump" onClick={onScrollToIndicators}>
          Indicadores ↓
        </button>
      )}
    </div>
  );
}
