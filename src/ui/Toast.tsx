import {
  ArrowPathIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Disclosure } from "./Accordion";
import { Button } from "./Button";
import { StepGlyph, StepStatus } from "./Step";

export type ToastTone = "success" | "error" | "warning" | "info" | "promo" | "neutral";

/* How hard the card itself signals.
   `subtle` is a neutral card carrying a coloured disc — it announces once and then sits
   quietly, which is right for anything transient.
   `tonal` tints the whole card and colours the text with it, for a notice that has to
   keep signalling while it stays on screen: a security warning, an unresolved failure. */
export type ToastEmphasis = "subtle" | "tonal";

const toneIcons: Record<ToastTone, ComponentType<{ className?: string }>> = {
  // The glyph carries the colour itself — a rosette for success, a triangle for error.
  // Its silhouette is the first thing recognised, before the colour resolves.
  success: CheckBadgeIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
  // Promo runs on gold. The reference used purple, but gold is the only brand accent
  // we have — a sixth hue would be a colour nobody in the system can explain.
  promo: SparklesIcon,
  neutral: QuestionMarkCircleIcon,
};

/* Two skins for one card. Quiet is the resting state a toast spends almost all of its
   life in: a neutral card, the tone carried only by the glyph. Loud is the entrance —
   the whole card floods so a glance from across the screen registers it. The card
   transitions between them; it never moves. */
/* The badge is a solid disc of the semantic colour with the glyph knocked out in the
   on-colour token. Two layers rather than one tinted glyph — a coloured outline shape
   reads as decoration at 20px, a filled disc reads as a status mark. */
const quietBadge: Record<ToastTone, string> = {
  success: "bg-feedback-success-fill text-text-on-feedback",
  error: "bg-feedback-danger-fill text-text-on-feedback",
  warning: "bg-feedback-warning-fill text-text-on-feedback",
  info: "bg-feedback-info-fill text-text-on-feedback",
  promo: "bg-action-primary text-text-on-accent",
  neutral: "bg-surface-overlay text-text-secondary",
};

const loudCard: Record<ToastTone, string> = {
  success: "bg-feedback-success-fill text-text-on-feedback",
  error: "bg-feedback-danger-fill text-text-on-feedback",
  warning: "bg-feedback-warning-fill text-text-on-feedback",
  info: "bg-feedback-info-fill text-text-on-feedback",
  promo: "bg-action-primary text-text-on-accent",
  neutral: "bg-surface-overlay text-text-primary",
};

/* Tonal maps promo onto the warning tint — both are gold, and a second gold surface a
   few percent apart would read as a rendering error rather than a distinction. */
const tonalCard: Record<ToastTone, string> = {
  success: "bg-tonal-success text-tonal-success-text",
  error: "bg-tonal-error text-tonal-error-text",
  warning: "bg-tonal-warning text-tonal-warning-text",
  info: "bg-tonal-info text-tonal-info-text",
  promo: "bg-tonal-warning text-tonal-warning-text",
  neutral: "bg-tonal-neutral text-tonal-neutral-text",
};

/** Reads a duration token as a number of milliseconds. The CSS transitions can use
 *  var() directly, but a setTimeout cannot — without this the hold would be a literal in
 *  here and a token in Foundations, and the two would drift apart the first time one
 *  changed. Falls back to the token's documented value if the property is missing. */
function durationToken(name: string, fallback: number) {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const ms = raw.endsWith("ms") ? parseFloat(raw) : raw.endsWith("s") ? parseFloat(raw) * 1000 : NaN;
  return Number.isFinite(ms) ? ms : fallback;
}

/** Someone who has asked for reduced motion gets the resting state immediately — no
 *  colour flash at all. The information is identical; only the announcement is dropped. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

export function Toast({
  tone = "info",
  title,
  description,
  emphasis = "subtle",
  icon,
  action,
  footer,
  onDismiss,
  loud: controlledLoud,
  children,
  className = "",
}: {
  tone?: ToastTone;
  emphasis?: ToastEmphasis;
  title: string;
  /** A node rather than a string so a live value can sit in the sentence — "Your quote
   *  expires in <Countdown />." */
  description?: ReactNode;
  /** Overrides the tone glyph — the spinner for a sync toast, a step number for a
   *  stepper. The badge keeps its tone colour either way. */
  icon?: ReactNode;
  action?: ReactNode;
  /** A ruled row beneath the message — an overflow summary on the left, an action on the
   *  right. For a notice that stands for more than one thing: "+3 additional warnings". */
  footer?: { label: ReactNode; action?: ReactNode };
  onDismiss?: () => void;
  /** Leave undefined and the toast runs its own flash-then-settle. Pass a value to drive
   *  it externally, which is what the docs page's cycling demo does. */
  loud?: boolean;
  /** Extra body below the description — a disclosure, a second row of actions. */
  children?: ReactNode;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const selfDriven = controlledLoud === undefined;

  // An uncontrolled toast lands loud and settles once. With an action on board it holds
  // longer, so it does not relax while someone is still reaching for the button.
  const [selfLoud, setSelfLoud] = useState(selfDriven && !reduced);
  useEffect(() => {
    if (!selfDriven || !selfLoud) return;
    const hold = action
      ? durationToken("--ws-duration-hold-long", 2600)
      : durationToken("--ws-duration-hold", 1600);
    const id = setTimeout(() => setSelfLoud(false), hold);
    return () => clearTimeout(id);
  }, [selfDriven, selfLoud, action]);

  const loud = (selfDriven ? selfLoud : controlledLoud) && !reduced;

  const Glyph = toneIcons[tone];
  const motion = {
    transitionDuration: "var(--ws-duration-slow)",
    transitionTimingFunction: "var(--ws-ease-standard)",
  };

  const tonal = emphasis === "tonal" && !loud;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`w-full rounded-xl p-4 transition-colors ${
        loud ? loudCard[tone] : tonal ? tonalCard[tone] : "bg-surface-raised"
      } ${className}`}
      style={{ ...motion, boxShadow: "var(--ws-shadow-overlay)" }}
    >
      <div className="flex items-center gap-3.5">
        {/* Tonal drops the disc: on a tinted card the bare glyph in the tone colour is
            the clearer mark, and a filled disc would be a third weight of the same hue. */}
        <span
          className={`grid shrink-0 place-items-center transition-colors ${
            tonal
              ? "size-6"
              : `size-9 rounded-full ${loud ? "bg-surface-sunken/20 text-current" : quietBadge[tone]}`
          }`}
          style={motion}
        >
          {icon ?? <Glyph className={tonal ? "size-6" : "size-5"} aria-hidden="true" />}
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={`text-[14.5px] leading-tight font-semibold tracking-[-0.005em] text-pretty ${
              loud || tonal ? "" : "text-text-primary"
            }`}
          >
            {title}
          </p>
          {description ? (
            <p
              className={`mt-1 text-[13px] leading-snug text-pretty ${
                loud ? "opacity-75" : tonal ? "opacity-85" : "text-text-tertiary"
              }`}
            >
              {description}
            </p>
          ) : null}
          {children ? <div className="mt-3">{children}</div> : null}
        </div>

        {action ? <div className="shrink-0 pl-1">{action}</div> : null}

        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={`Dismiss ${title}`}
            className={`ws-touch-target grid size-8 shrink-0 place-items-center rounded-lg transition-colors duration-150 ${
              loud || tonal
                ? "opacity-70 hover:opacity-100"
                : "text-text-tertiary hover:bg-surface-overlay hover:text-text-primary"
            }`}
          >
            <XMarkIcon className="size-4" />
          </button>
        ) : null}
      </div>

      {footer ? (
        <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-current/15 pt-3.5">
          <span
            className={`min-w-0 truncate text-[13px] font-medium ${
              loud || tonal ? "" : "text-text-secondary"
            }`}
          >
            {footer.label}
          </span>
          {footer.action ? <span className="shrink-0">{footer.action}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ Sync ---- */

/** A background operation with no known end time. The spinner replaces the tone glyph
 *  but keeps the badge, so it still reads as the same component. */
export function SyncToast({
  title,
  description,
  onDismiss,
  loud,
}: {
  title: string;
  description?: string;
  onDismiss?: () => void;
  loud?: boolean;
}) {
  return (
    <Toast
      tone="info"
      title={title}
      description={description}
      onDismiss={onDismiss}
      loud={loud}
      icon={
        <ArrowPathIcon
          className="size-4 animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
      }
    />
  );
}

/* --------------------------------------------------------------- Stepper ---- */

/** One toast for a whole multi-step transaction. The step number and status update in
 *  place — firing a new toast per step buries the earlier ones and loses the thread.
 *  The glyph and the status line come from Step, the same pieces the Progress step row
 *  and vertical stepper are built from. */
export function StepperToast({
  step,
  total,
  title,
  status,
  onDismiss,
  loud,
}: {
  step: number;
  total: number;
  title: string;
  status: string;
  onDismiss?: () => void;
  loud?: boolean;
}) {
  const done = step > total;
  return (
    <Toast
      tone={done ? "success" : "info"}
      title={title}
      onDismiss={onDismiss}
      loud={loud}
      icon={
        <StepGlyph
          state={done ? "done" : "current"}
          number={step}
          className="size-4"
          numberClassName="text-[12px]"
        />
      }
    >
      <StepStatus busy={!done} trailing={!done ? `${step} / ${total}` : undefined}>
        {status}
      </StepStatus>
    </Toast>
  );
}

/* --------------------------------------------------------- Detailed error ---- */

/** For financial failures, where "something went wrong" is not an acceptable message.
 *  States the amount and counterparty plainly, hides the technical reason behind a
 *  disclosure, and offers two ways out rather than one. */
export function DetailedErrorToast({
  title,
  description,
  reason,
  primaryAction,
  secondaryAction,
  onDismiss,
  loud,
}: {
  title: string;
  description: string;
  /** The technical explanation. Collapsed by default — it answers a question most
   *  people will not ask, and shown inline it buries the two recovery actions. */
  reason: string;
  primaryAction: ReactNode;
  secondaryAction: ReactNode;
  onDismiss?: () => void;
  loud?: boolean;
}) {
  return (
    <Toast
      tone="error"
      title={title}
      description={description}
      onDismiss={onDismiss}
      loud={loud}
    >
      {/* The Accordion family's lightest member — the same trigger, motion and aria as
          every other section that opens in place. */}
      <Disclosure label="Why this happened">{reason}</Disclosure>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {primaryAction}
        {secondaryAction}
      </div>
    </Toast>
  );
}

/* ----------------------------------------------------------------- Stack ---- */

/** Bottom-right, newest on top — the convention the sandbox already documents. Toasts
 *  do not move when one is added or removed; only the stack's height changes. */
export function ToastStack({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full max-w-[420px] flex-col-reverse gap-2.5">{children}</div>
  );
}

/** The trailing action. Prominence follows urgency, which is the distinction the style
 *  reference draws: the success toast's action sits back in a quiet neutral pill, the
 *  error toast's recovery action comes forward in a high-contrast one. Neither is gold —
 *  a toast never carries the screen's primary action. */
export function ToastAction({
  children,
  prominence = "quiet",
  onClick,
}: {
  children: ReactNode;
  prominence?: "quiet" | "strong";
  onClick?: () => void;
}) {
  return (
    <Button
      variant={prominence === "strong" ? "contrast" : "secondary"}
      size="sm"
      shape="pill"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
