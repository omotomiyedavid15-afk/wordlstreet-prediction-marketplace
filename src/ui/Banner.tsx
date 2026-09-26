import { ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from "@heroicons/react/20/solid";
import type { ReactNode } from "react";

/* SCOPED TO TABLE v1 — candidate for promotion to its own Alert / Banner component.
   A notice that persists above the thing it is about until someone dismisses it:
   "audit logs are kept for 30 days", "our banking partner is down". Unlike a Toast it
   does not announce and leave — it stays, because the condition does.

   It runs on the tonal surfaces the Toast's persistent emphasis already defined, so
   there is no new colour here. */

export type BannerTone = "info" | "warning" | "error";

const skin: Record<BannerTone, string> = {
  info: "bg-tonal-info text-tonal-info-text",
  warning: "bg-tonal-warning text-tonal-warning-text",
  error: "bg-tonal-error text-tonal-error-text",
};

export function Banner({
  tone = "info",
  children,
  action,
  onDismiss,
  className = "",
}: {
  tone?: BannerTone;
  children: ReactNode;
  /** One follow-up — "Download last 30 days", "Go to account". A link or a button. */
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const Icon = tone === "info" ? InformationCircleIcon : ExclamationTriangleIcon;
  return (
    <div
      role={tone === "info" ? "status" : "alert"}
      className={`flex items-start gap-2.5 rounded-lg px-3.5 py-2.5 text-[13px] leading-5 ${skin[tone]} ${className}`}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p className="min-w-0 flex-1 text-pretty">
        {children}
        {action ? <span className="ml-2 inline-block font-medium">{action}</span> : null}
      </p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notice"
          className="ws-touch-target -my-2 -mr-2 grid size-8 shrink-0 place-items-center rounded-md opacity-70 transition-opacity duration-150 hover:opacity-100"
        >
          <XMarkIcon aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

/** The link-weight action inside a banner — underlined, in the banner's own ink. */
export function BannerLink({ children, href, onClick }: { children: ReactNode; href?: string; onClick?: () => void }) {
  const cls = "underline decoration-current/40 underline-offset-[3px] transition-[text-decoration-color] duration-150 hover:decoration-current";
  return href ? (
    <a href={href} className={cls}>
      {children}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
