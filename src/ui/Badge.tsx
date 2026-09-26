import {
  ArchiveBoxIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  InformationCircleIcon,
  LockClosedIcon,
  MinusIcon,
  NoSymbolIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  TrashIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";
import type { ComponentType, ReactNode } from "react";

export type BadgeSize = "sm" | "md";

/* Every pill in this file is fully rounded except CountBadge, which goes circular at a
   single digit. Sizes come off the same 4px grid the rest of the system uses. */
const pill: Record<BadgeSize, string> = {
  sm: "h-[22px] gap-1.5 rounded-full px-2.5 text-[11px]",
  md: "h-[26px] gap-1.5 rounded-full px-3 text-[12px]",
};

const glyph: Record<BadgeSize, string> = { sm: "size-3", md: "size-3.5" };

const base =
  "inline-flex shrink-0 items-center whitespace-nowrap font-medium leading-none";

/* ---------------------------------------------------------------- Status ---- */

export type StatusTone =
  | "success"
  | "pending"
  | "warning"
  | "error"
  | "neutral"
  | "info"
  | "unknown"
  // Account and order states. Each borrows a feedback hue that already means the same
  // kind of thing and gets its own glyph — added as a vocabulary here so a table never
  // invents a one-off colour for "frozen".
  | "verified"
  | "flagged"
  | "deleted"
  | "deactivated"
  | "frozen"
  | "cancelled"
  // Security controls — 2FA, a withdrawal allow-list. Disabled is a warning, not a
  // neutral: an account with 2FA off is a risk someone should notice.
  | "enabled"
  | "disabled";

/* Pending and warning deliberately share a colour. They are different states with the
   same urgency, and the icon is what tells them apart — a clock means "waiting on the
   system", a triangle means "waiting on you". This is the whole reason a status pill
   never ships as colour alone: two states can legitimately need the same hue. */
const statusIcons: Record<StatusTone, ComponentType<{ className?: string }>> = {
  success: CheckCircleIcon,
  pending: ClockIcon,
  warning: ExclamationTriangleIcon,
  error: XCircleIcon,
  neutral: ArchiveBoxIcon,
  info: InformationCircleIcon,
  unknown: QuestionMarkCircleIcon,
  verified: CheckBadgeIcon, // the rosette — the same mark Avatar uses for a verified person
  flagged: FlagIcon,
  deleted: TrashIcon,
  deactivated: NoSymbolIcon,
  // Heroicons has no snowflake. A lock says the same thing about money — it cannot move.
  frozen: LockClosedIcon,
  cancelled: XCircleIcon,
  enabled: ShieldCheckIcon,
  disabled: ShieldExclamationIcon,
};

/* Default wording, so <StatusPill tone="frozen" /> reads "Frozen" without a caller
   retyping it. Children still win — "2FA off", "Sucessful" fixed to "Successful". */
const statusLabels: Record<StatusTone, string> = {
  success: "Success",
  pending: "Pending",
  warning: "Warning",
  error: "Failed",
  neutral: "Archived",
  info: "Info",
  unknown: "Unknown",
  verified: "Verified",
  flagged: "Flagged",
  deleted: "Deleted",
  deactivated: "Deactivated",
  frozen: "Frozen",
  cancelled: "Cancelled",
  enabled: "Enabled",
  disabled: "Disabled",
};

const statusOutline: Record<StatusTone, string> = {
  success: "border border-feedback-success/45 bg-feedback-success/10 text-feedback-success",
  pending: "border border-feedback-warning/45 bg-feedback-warning/10 text-feedback-warning",
  warning: "border border-feedback-warning/45 bg-feedback-warning/10 text-feedback-warning",
  error: "border border-feedback-danger/45 bg-feedback-danger/10 text-feedback-danger",
  neutral: "border border-border-default bg-surface-raised/40 text-text-tertiary",
  info: "border border-feedback-info/45 bg-feedback-info/10 text-feedback-info",
  // Unknown is deliberately not a colour. Painting an indeterminate state green or red
  // asserts something we do not know; a dashed edge says the system is missing an answer.
  unknown: "border border-dashed border-border-strong text-text-secondary",
  verified: "border border-feedback-success/45 bg-feedback-success/10 text-feedback-success",
  flagged: "border border-feedback-warning/45 bg-feedback-warning/10 text-feedback-warning",
  deleted: "border border-feedback-danger/45 bg-feedback-danger/10 text-feedback-danger",
  // Deactivated shares neutral's grey on purpose — it is an account that is simply off.
  // The struck-circle glyph is what separates it from an archived record.
  deactivated: "border border-border-default bg-surface-raised/40 text-text-tertiary",
  frozen: "border border-feedback-info/45 bg-feedback-info/10 text-feedback-info",
  // Cancelled by the person who placed it is not a failure, so it is not red.
  cancelled: "border border-border-default bg-surface-raised/40 text-text-tertiary",
  enabled: "border border-feedback-success/45 bg-feedback-success/10 text-feedback-success",
  disabled: "border border-feedback-warning/45 bg-feedback-warning/10 text-feedback-warning",
};

const statusFilled: Record<StatusTone, string> = {
  success: "bg-feedback-success-fill text-text-on-feedback",
  pending: "bg-feedback-warning-fill text-text-on-feedback",
  warning: "bg-feedback-warning-fill text-text-on-feedback",
  error: "bg-feedback-danger-fill text-text-on-feedback",
  neutral: "bg-surface-overlay text-text-primary",
  info: "bg-feedback-info-fill text-text-on-feedback",
  unknown: "border border-dashed border-border-strong bg-surface-raised text-text-secondary",
  verified: "bg-feedback-success-fill text-text-on-feedback",
  flagged: "bg-feedback-warning-fill text-text-on-feedback",
  deleted: "bg-feedback-danger-fill text-text-on-feedback",
  deactivated: "bg-surface-overlay text-text-primary",
  frozen: "bg-feedback-info-fill text-text-on-feedback",
  cancelled: "bg-surface-overlay text-text-primary",
  enabled: "bg-feedback-success-fill text-text-on-feedback",
  disabled: "bg-feedback-warning-fill text-text-on-feedback",
};

export function StatusPill({
  tone,
  variant = "outline",
  size = "md",
  icon,
  children,
  className = "",
}: {
  tone: StatusTone;
  variant?: "outline" | "filled";
  size?: BadgeSize;
  /** Replaces the tone's glyph — for an activity verb ("Updated", "Invited") where the
   *  colour is right but the status glyph is not. The colour still comes from the tone. */
  icon?: ComponentType<{ className?: string }>;
  /** Defaults to the tone's own word. */
  children?: ReactNode;
  className?: string;
}) {
  const Icon = icon ?? statusIcons[tone];
  const skin = variant === "filled" ? statusFilled[tone] : statusOutline[tone];
  return (
    <span className={`${base} ${pill[size]} ${skin} ${className}`}>
      <Icon className={`${glyph[size]} shrink-0`} aria-hidden="true" />
      {children ?? statusLabels[tone]}
    </span>
  );
}

/* ----------------------------------------------------------------- Trend ---- */

export type TrendDirection = "up" | "down" | "flat";

/* Direction is read off the caret first and the colour second. Up and down are the
   feedback tokens, never a domain accent — a price move means the same thing in
   Marketplace as it does in Xstream, so it cannot be tinted by the mode. */
const trendIcons: Record<TrendDirection, ComponentType<{ className?: string }>> = {
  up: ArrowUpIcon,
  down: ArrowDownIcon,
  flat: MinusIcon,
};

const trendOutline: Record<TrendDirection, string> = {
  up: "border border-feedback-success/45 bg-feedback-success/10 text-feedback-success",
  down: "border border-feedback-danger/45 bg-feedback-danger/10 text-feedback-danger",
  flat: "border border-border-default bg-surface-raised/40 text-text-tertiary",
};

const trendFilled: Record<TrendDirection, string> = {
  up: "bg-feedback-success-fill text-text-on-feedback",
  down: "bg-feedback-danger-fill text-text-on-feedback",
  flat: "bg-surface-overlay text-text-primary",
};

export function TrendPill({
  direction,
  value,
  variant = "outline",
  size = "md",
  className = "",
}: {
  direction: TrendDirection;
  /** Already formatted and signed, e.g. "+2.41%" or "−₦1,240". */
  value: string;
  variant?: "outline" | "filled";
  size?: BadgeSize;
  className?: string;
}) {
  const Icon = trendIcons[direction];
  const skin = variant === "filled" ? trendFilled[direction] : trendOutline[direction];
  return (
    <span
      className={`${base} ${pill[size]} ${skin} tabular-nums ${className}`}
      // Screen readers get the direction as a word; the caret is decorative to them.
      aria-label={`${direction === "up" ? "Up" : direction === "down" ? "Down" : "Unchanged"} ${value}`}
    >
      <Icon className={`${glyph[size]} shrink-0`} aria-hidden="true" />
      {value}
    </span>
  );
}

/* ------------------------------------------------------------ Domain tag ---- */

export type Domain =
  | "finance"
  | "social"
  | "vivid"
  | "xstream"
  | "marketplace"
  | "vision"
  | "academy"
  | "prediction";

export const domainLabels: Record<Domain, string> = {
  finance: "Core Finance",
  social: "Social",
  vivid: "Vivid AI",
  xstream: "Xstream",
  marketplace: "Marketplace",
  vision: "Vision",
  academy: "Academy",
  prediction: "Prediction",
};

/* Core Finance has no accent of its own — it is the surface every other mode returns
   to, so its tag runs on gold. The other seven each take their own accent token. */
const domainTone: Record<Domain, string> = {
  finance: "border border-action-primary/45 bg-action-primary-tonal text-action-primary-text",
  social: "border border-domain-social/45 bg-domain-social/10 text-domain-social",
  vivid: "border border-domain-vivid/45 bg-domain-vivid/10 text-domain-vivid",
  xstream: "border border-domain-xstream/45 bg-domain-xstream/10 text-domain-xstream",
  marketplace:
    "border border-domain-marketplace/45 bg-domain-marketplace/10 text-domain-marketplace",
  vision: "border border-domain-vision/45 bg-domain-vision/10 text-domain-vision",
  academy: "border border-domain-academy/45 bg-domain-academy/10 text-domain-academy",
  prediction:
    "border border-domain-prediction/45 bg-domain-prediction/10 text-domain-prediction",
};

export function DomainTag({
  domain,
  size = "md",
  className = "",
}: {
  domain: Domain;
  size?: BadgeSize;
  className?: string;
}) {
  return (
    <span className={`${base} ${pill[size]} ${domainTone[domain]} ${className}`}>
      {domainLabels[domain]}
    </span>
  );
}

/* -------------------------------------------------------- Count / notify ---- */

export function CountBadge({
  count,
  max = 99,
  size = "md",
  className = "",
}: {
  count: number;
  /** Anything above this renders as "max+". */
  max?: number;
  size?: BadgeSize;
  className?: string;
}) {
  const label = count > max ? `${max}+` : String(count);
  // Circular at one character, rounded-rect once it grows — a circle stretched around
  // "99+" is an oval, which reads as a different component.
  const shape = label.length === 1 ? "rounded-full" : "rounded-md px-1.5";
  const box = size === "sm" ? "h-[18px] min-w-[18px] text-[10px]" : "h-5 min-w-5 text-[11px]";
  return (
    <span
      className={`${base} ${box} ${shape} justify-center bg-feedback-danger-fill font-semibold text-text-on-feedback ${className}`}
    >
      {label}
    </span>
  );
}

export function DotBadge({ size = "md", className = "" }: { size?: BadgeSize; className?: string }) {
  const box = size === "sm" ? "size-1.5" : "size-2";
  return <span className={`block shrink-0 rounded-full bg-feedback-danger-fill ${box} ${className}`} />;
}

/** Anchors a count or dot to the top-right of whatever it wraps. The ring matches the
 *  surface behind it so the badge reads as sitting on top of the icon rather than
 *  merging into it. */
export function BadgeAnchor({
  badge,
  position = "top-right",
  children,
  className = "",
}: {
  badge: ReactNode;
  /** Counts dock to the top edge, presence dots to the bottom — two different
   *  meanings that should not land in the same place on an avatar. */
  position?: "top-right" | "bottom-right";
  children: ReactNode;
  className?: string;
}) {
  const at =
    position === "bottom-right" ? "-right-0.5 -bottom-0.5" : "-top-1.5 -right-2";
  return (
    <span className={`relative inline-flex ${className}`}>
      {children}
      <span className={`absolute ${at} rounded-full ring-2 ring-surface-base`}>{badge}</span>
    </span>
  );
}

export type Presence = "online" | "offline";

/** Presence, as its own component rather than a colour passed to DotBadge — online and
 *  offline are not a count, and a grey "notification" would read as a bug. */
export function PresenceDot({
  presence,
  size = "md",
  className = "",
}: {
  presence: Presence;
  size?: BadgeSize;
  className?: string;
}) {
  const box = size === "sm" ? "size-2" : "size-2.5";
  const tone = presence === "online" ? "bg-feedback-success" : "bg-text-disabled";
  return (
    <span
      role="img"
      aria-label={presence === "online" ? "Online" : "Offline"}
      className={`block shrink-0 rounded-full ${box} ${tone} ${className}`}
    />
  );
}

/* -------------------------------------------------------------- Chip -------- */

/** A removable chip: a leading visual, a label, and a dismiss control. The dismiss is a
 *  real button so it is reachable by keyboard, and it carries its own accessible name —
 *  a row of chips all labelled "Remove" tells you nothing about which one you are on. */
export function Chip({
  leading,
  trailing,
  size = "md",
  onDismiss,
  dismissLabel,
  children,
  className = "",
}: {
  /** Avatar, flag, or icon. Sized by the caller so a flag and an avatar can differ. */
  leading?: ReactNode;
  /** Optional trailing visual, such as a dropdown chevron. */
  trailing?: ReactNode;
  size?: BadgeSize;
  onDismiss?: () => void;
  /** Defaults to "Remove {label}" when children is a plain string. */
  dismissLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  const label =
    dismissLabel ?? (typeof children === "string" ? `Remove ${children}` : "Remove");
  // Concentric: a leading avatar sits the same distance from the chip's edge as from its
  // top and bottom — 4px on sm, 6px on md. The dismiss side is 2px tighter, optically: its
  // × is a small glyph inside a round hit area, so the ink is already inset. Plain text
  // gets the wider inset text needs.
  const sm = size === "sm";
  const box = `${sm ? "h-6 gap-1 text-[10px]" : "h-8 gap-2 text-[12px]"} rounded-full ${
    leading ? (sm ? "pl-1" : "pl-1.5") : sm ? "pl-2" : "pl-3"
  } ${onDismiss || trailing ? (sm ? "pr-0.5" : "pr-1") : sm ? "pr-2" : "pr-3"}`;

  return (
    <span
      className={`${base} ${box} border border-border-default bg-surface-base text-text-primary ${className}`}
    >
      {leading}
      <span>{children}</span>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          // Pulls the round hit area towards the label, so the gap from the text to the × ink
          // matches the gap from the avatar to the text.
          aria-label={label}
          title={label}
          // The circle is 16/20px; the ::after stretches the hit area to the chip's full
          // height (24/32px) without the circle growing.
          className={`relative -ml-1 grid shrink-0 place-items-center rounded-full text-text-secondary transition-colors duration-150 after:absolute after:-inset-1 hover:bg-text-primary/10 hover:text-text-primary ${
            sm ? "size-4" : "size-5"
          }`}
        >
          <XMarkIcon aria-hidden="true" className={sm ? "size-3" : "size-3.5"} />
        </button>
      ) : null}
      {trailing ? <span className="grid shrink-0 place-items-center">{trailing}</span> : null}
    </span>
  );
}
