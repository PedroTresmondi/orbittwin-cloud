import type { ReactNode } from "react";

type MapFeedNoticeProps = {
  variant: "info" | "warning";
  children: ReactNode;
};

export function MapFeedNotice({ variant, children }: MapFeedNoticeProps) {
  return (
    <p className={`map-feed-notice map-feed-notice--${variant}`} role="status">
      {children}
    </p>
  );
}
