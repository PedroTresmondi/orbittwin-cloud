import { useEffect, useId } from "react";

type GlassDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "left" | "right";
  children: React.ReactNode;
};

export function GlassDrawer({ open, onClose, title, side = "left", children }: GlassDrawerProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div className={`glass-drawer${open ? " is-open" : ""}`} data-side={side}>
      <button type="button" className="glass-drawer__backdrop" aria-label="Fechar menu" onClick={onClose} />
      <aside
        className="glass-drawer__panel glass-surface"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="glass-drawer__head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="glass-drawer__close" aria-label="Fechar" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="glass-drawer__body">{children}</div>
      </aside>
    </div>
  );
}
