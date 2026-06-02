import { useId, useState } from "react";

type GlassAccordionProps = {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
};

export function GlassAccordion({ title, subtitle, defaultOpen = false, badge, children }: GlassAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className={`glass-accordion glass-surface${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="glass-accordion__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="glass-accordion__chevron" aria-hidden="true" />
        <span className="glass-accordion__text">
          <span className="glass-accordion__title">{title}</span>
          {subtitle && <span className="glass-accordion__subtitle">{subtitle}</span>}
        </span>
        {badge && <span className="glass-accordion__badge">{badge}</span>}
      </button>
      <div id={panelId} className="glass-accordion__panel" hidden={!open}>
        <div className="glass-accordion__content">{children}</div>
      </div>
    </section>
  );
}
