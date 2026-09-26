import { ArrowRightIcon, EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import { ClockIcon } from "@heroicons/react/16/solid";
import {
  useEffect,
  useId,
  useRef,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from "react";
import { TrendPill, type TrendDirection } from "./Badge";
import { IconButton } from "./Button";
import { CountdownText, useCountdown } from "./Countdown";
import { StepMarker, StepStatus, stepState, stepStateLabel, type StepMarkerSize } from "./Step";

/* Gold is what progress is. It moves to a feedback colour only when the bar stops
   meaning "how far along" and starts meaning "is this OK" — a quota running out, a
   schedule slipping. Neutral is for the supporting series beside a gold one, so the
   eye knows which bar is the headline. */
export type ProgressTone = "primary" | "success" | "warning" | "danger" | "info" | "neutral";
export type ProgressSize = "sm" | "md" | "lg";

const toneFill: Record<ProgressTone, string> = {
  primary: "bg-action-primary",
  success: "bg-feedback-success",
  warning: "bg-feedback-warning",
  danger: "bg-feedback-danger",
  info: "bg-feedback-info",
  // Secondary ink at 70%: clearly the second voice beside gold, and still ~4:1 against
  // the empty track in both themes.
  neutral: "bg-text-secondary/70",
};

// For the hatch, which paints in currentColor.
const toneInk: Record<ProgressTone, string> = {
  primary: "text-action-primary",
  success: "text-feedback-success",
  warning: "text-feedback-warning",
  danger: "text-feedback-danger",
  info: "text-feedback-info",
  neutral: "text-text-secondary",
};

// The empty track is ink at 10% rather than a surface, so it reads on canvas, on a card
// and on a tinted tray alike — every surface token disappears against at least one.
const track = "bg-text-primary/10";

const trackHeight: Record<ProgressSize, string> = { sm: "h-1", md: "h-2", lg: "h-3" };

const clamp = (n: number) => Math.min(100, Math.max(0, n));

/* A fill that changes because something happened moves on ease-standard over
   duration-slow — Foundations > Motion gives slow to full-width bars. A fill advanced by
   a clock moves linearly across each one-second tick, so consecutive ticks join into one
   continuous motion instead of a staircase of little eased hops. */
function fillMotion(linear = false): CSSProperties {
  return linear
    ? { transitionDuration: "1000ms", transitionTimingFunction: "linear" }
    : {
        transitionDuration: "var(--ws-duration-slow)",
        transitionTimingFunction: "var(--ws-ease-standard)",
      };
}

/** The fill slides in from the left rather than growing. A full-width rounded bar
 *  translated left keeps its rounded leading edge at every value — scaleX would squash
 *  the cap into an ellipse — and transform stays on the compositor. */
function Fill({
  pct,
  tone,
  motion,
  delay,
}: {
  pct: number;
  tone: ProgressTone;
  motion: CSSProperties;
  delay?: string;
}) {
  return (
    <span
      className={`absolute inset-0 rounded-full transition-transform ${toneFill[tone]}`}
      // The extra (1 − p) × 2px parks an empty fill fully clear of the track: at exactly
      // −100% its antialiased cap bleeds a 1px sliver of colour into the rounded end. It
      // shrinks to nothing as the bar fills, so a full bar still meets the right edge.
      style={{
        ...motion,
        transform: `translateX(calc(${pct - 100}% - ${(1 - pct / 100) * 2}px))`,
        transitionDelay: delay,
      }}
    />
  );
}

/* ---------------------------------------------------------------- Linear ---- */

/** Where the percentage sits.
 *  `end`    — right-aligned on the label row.
 *  `edge`   — plain figures riding the fill edge.
 *  `bubble` — a tag with a tail pointing at the fill edge. */
export type ProgressValuePosition = "end" | "edge" | "bubble";

export function ProgressBar({
  value,
  label,
  valuePosition,
  size = "md",
  tone = "primary",
  linear = false,
  valueText,
  "aria-label": ariaLabel,
  className = "",
}: {
  /** 0–100. Leave undefined for an indeterminate bar — work with no known end. */
  value?: number;
  label?: ReactNode;
  valuePosition?: ProgressValuePosition;
  size?: ProgressSize;
  tone?: ProgressTone;
  /** The value is being advanced by a clock, once a second. See fillMotion. */
  linear?: boolean;
  /** What a screen reader says instead of the bare number — "3 of 5 lessons". */
  valueText?: string;
  /** Required when there is no visible label. */
  "aria-label"?: string;
  className?: string;
}) {
  const labelId = useId();
  const indeterminate = value === undefined;
  const pct = indeterminate ? 0 : clamp(value);
  const shown = `${Math.round(pct)}%`;
  const motion = fillMotion(linear);
  const riding = !indeterminate && (valuePosition === "edge" || valuePosition === "bubble");
  const endValue = !indeterminate && valuePosition === "end";

  return (
    <div className={className}>
      {label || endValue ? (
        <div className="mb-2 flex items-baseline justify-between gap-3 text-[13px] leading-5">
          {label ? (
            <span id={labelId} className="min-w-0 truncate text-text-secondary">
              {label}
            </span>
          ) : (
            <span />
          )}
          {endValue ? (
            <span className="shrink-0 font-medium tabular-nums text-text-primary">{shown}</span>
          ) : null}
        </div>
      ) : null}

      {riding ? (
        <EdgeValue pct={pct} bubble={valuePosition === "bubble"} motion={motion}>
          {shown}
        </EdgeValue>
      ) : null}

      <div
        role="progressbar"
        aria-labelledby={label ? labelId : undefined}
        aria-label={label ? undefined : ariaLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : Math.round(pct)}
        aria-valuetext={indeterminate ? undefined : valueText}
        aria-busy={indeterminate || undefined}
        // isolate: Safari otherwise lets a transformed child paint past a rounded clip.
        className={`relative isolate overflow-hidden rounded-full ${track} ${trackHeight[size]}`}
      >
        {indeterminate ? (
          <Indeterminate tone={tone} />
        ) : (
          <Fill pct={pct} tone={tone} motion={motion} />
        )}
      </div>
    </div>
  );
}

/* The riding figure has to do two things at once: point exactly at the fill edge, and
   never hang off either end of the track. So it is two movements on the same curve:

   - an anchor whose left edge is the fill edge (left: pct%), carrying the tail;
   - the tag, sliding back across itself in proportion — left-aligned at 0%, centred at
     50%, right-aligned at 100%. The bubble's slide stops a corner-radius short at each
     end, so the tail always leaves the flat of the tag rather than its rounded corner.

   Both are linear in pct and share the fill's duration and easing, which is what keeps
   the tail on the edge through the whole transition rather than only at rest. */
function EdgeValue({
  pct,
  bubble,
  motion,
  children,
}: {
  pct: number;
  bubble: boolean;
  motion: CSSProperties;
  children: ReactNode;
}) {
  const p = pct / 100;
  return (
    <div aria-hidden="true" className={`relative ${bubble ? "mb-1 h-[27px]" : "mb-1.5 h-5"}`}>
      <div
        className="absolute bottom-0 w-0 transition-[left]"
        // Same (1 − p) × 2px park as Fill, so the tail sits on the exact pixel the fill ends.
        style={{ ...motion, left: `calc(${pct}% - ${(1 - p) * 2}px)` }}
      >
        {bubble ? (
          <>
            <span
              className="absolute bottom-[6px] left-0 block w-max rounded-md bg-text-primary px-[7px] py-[5px] text-[11px] leading-none font-semibold tabular-nums text-surface-sunken transition-transform"
              style={{ ...motion, transform: `translateX(calc(-6px - (100% - 12px) * ${p}))` }}
            >
              {children}
            </span>
            <span className="absolute bottom-[1px] left-0 h-[5px] w-[10px] -translate-x-1/2 bg-text-primary [clip-path:polygon(0_0,100%_0,50%_100%)]" />
          </>
        ) : (
          <span
            className="absolute bottom-0 left-0 w-max text-[13px] leading-5 font-medium tabular-nums text-text-primary transition-transform"
            style={{ ...motion, transform: `translateX(${-pct}%)` }}
          >
            {children}
          </span>
        )}
      </div>
    </div>
  );
}

/* Indeterminate runs linear, like the spinner beside it in Button and Toast: constant
   motion means "still working", and an eased sweep would read as arriving somewhere.
   Under reduced motion it holds still as a hatched track — the same texture the pace bar
   uses for "not measured", which is exactly what an unknown duration is. */
function Indeterminate({ tone }: { tone: ProgressTone }) {
  return (
    <>
      <span
        className={`ws-progress-sweep absolute inset-y-0 left-0 w-2/5 rounded-full ${toneFill[tone]}`}
      />
      <span className={`ws-hatch absolute inset-0 hidden opacity-70 motion-reduce:block ${toneInk[tone]}`} />
    </>
  );
}

/* -------------------------------------------------------- Segmented steps ---- */

/** One segment per named stage. For short, fixed flows — onboarding, KYC, a settlement
 *  — where the stage names are the information and there are five or fewer of them. */
export function SegmentedStepBar({
  steps,
  current,
  currentProgress = 50,
  tone = "primary",
  "aria-label": ariaLabel = "Progress",
  className = "",
}: {
  steps: string[];
  /** Zero-based. `steps.length` means every stage is done. */
  current: number;
  /** How far through the current stage, 0–100. */
  currentProgress?: number;
  tone?: ProgressTone;
  "aria-label"?: string;
  className?: string;
}) {
  // When the flow advances, the stage being left fills to the end first and the new one
  // starts after it — the fill pours from one segment into the next rather than both
  // moving at once. Read during render, updated after commit, so only that one render
  // carries the delay; later progress within the stage moves immediately.
  const previous = useRef(current);
  useEffect(() => {
    previous.current = current;
  }, [current]);
  const advanced = current > previous.current;
  const motion = fillMotion();

  return (
    <ol
      aria-label={ariaLabel}
      className={`grid gap-2 sm:gap-3 ${className}`}
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
    >
      {steps.map((step, i) => {
        const state = stepState(i, current);
        const pct = state === "done" ? 100 : state === "current" ? clamp(currentProgress) : 0;
        return (
          <li
            key={step}
            aria-current={state === "current" ? "step" : undefined}
            className="@container flex min-w-0 flex-col items-center"
          >
            <span
              className={`max-w-full truncate text-[13px] leading-5 transition-colors @max-[5.5rem]:text-[12px] duration-[var(--ws-duration-base)] ${
                state === "current"
                  ? "font-medium text-text-primary"
                  : state === "done"
                    ? "text-text-secondary"
                    : "text-text-tertiary"
              }`}
            >
              <span className="sr-only">{stepStateLabel[state]}: </span>
              {step}
            </span>
            {/* The dot speaks the same three-state language as the step markers:
                filled for done, ringed for current, bare track for upcoming. */}
            <span
              aria-hidden="true"
              className={`mt-2 mb-2.5 size-1.5 rounded-full transition-[background-color,box-shadow] duration-[var(--ws-duration-base)] ${
                state === "upcoming"
                  ? "bg-text-primary/15"
                  : `${toneFill[tone]} ${toneInk[tone]} ${state === "current" ? "shadow-[0_0_0_3px_color-mix(in_srgb,currentColor_24%,transparent)]" : ""}`
              }`}
            />
            <span aria-hidden="true" className={`relative isolate h-2 w-full overflow-hidden rounded-full ${track}`}>
              <Fill
                pct={pct}
                tone={tone}
                motion={motion}
                delay={advanced && i === current ? "var(--ws-duration-slow)" : undefined}
              />
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------ Step row / stepper ---- */

export type StepItem = {
  label: string;
  description?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
};

// Half the marker, for placing connectors: xs 20 / sm 28 / md 36.
const markerRadius: Record<StepMarkerSize, number> = { sm: 10, md: 14, lg: 18 };
// The space left between a connector's end and the disc it runs into.
const CONNECTOR_GAP = 6;

/* A new current step lights after the connector has mostly drawn into it, so the eye
   follows the line to the step instead of seeing both change at once. */
const lightAfterConnector = "calc(var(--ws-duration-slow) * 0.6)";

/** A connector line whose fill draws along it. */
function Connector({
  done,
  vertical = false,
  className = "",
  style,
}: {
  done: boolean;
  vertical?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={`absolute isolate overflow-hidden rounded-full ${track} ${className}`}
      style={style}
    >
      <span
        className={`absolute inset-0 rounded-full bg-action-primary transition-transform ${
          vertical ? "origin-top" : "origin-left"
        }`}
        style={{
          ...fillMotion(),
          transform: vertical ? `scaleY(${done ? 1 : 0})` : `scaleX(${done ? 1 : 0})`,
        }}
      />
    </span>
  );
}

/** A horizontal row of step discs joined by a line — checkmark done, ringed current,
 *  empty upcoming. The same markers and status line as the Stepper Toast. */
export function StepRow({
  steps,
  current,
  marker = "dot",
  size = "md",
  status,
  busy = false,
  "aria-label": ariaLabel = "Progress",
  className = "",
}: {
  steps: StepItem[];
  current: number;
  /** `dot` is the reference's quiet row; `number` counts the steps. An item's own icon
   *  wins over either. */
  marker?: "dot" | "number";
  size?: StepMarkerSize;
  /** Live status text for the current step, shown under the row. */
  status?: ReactNode;
  /** The current step is waiting on something outside the app. */
  busy?: boolean;
  "aria-label"?: string;
  className?: string;
}) {
  const n = steps.length;
  const inset = markerRadius[size] + CONNECTOR_GAP;
  return (
    <div className={className}>
      <ol
        aria-label={ariaLabel}
        className="grid"
        style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
      >
        {steps.map((step, i) => {
          const state = stepState(i, current);
          return (
            <li
              key={step.label}
              aria-current={state === "current" ? "step" : undefined}
              // Each column is a container: once it is too narrow for its label (five
              // steps on a phone), the non-current labels drop to screen-reader text and
              // the current one is left to speak for the row, with the status line below.
              className="@container relative flex min-w-0 flex-col items-center gap-2.5 px-1 text-center"
            >
              {i < n - 1 ? (
                // Runs from this disc's edge to the next one's, a gap short at each end.
                <Connector
                  done={i < current}
                  className="h-0.5"
                  style={{
                    top: markerRadius[size] - 1,
                    left: `calc(50% + ${inset}px)`,
                    right: `calc(-50% + ${inset}px)`,
                  }}
                />
              ) : null}
              <StepMarker
                state={state}
                size={size}
                number={marker === "number" ? i + 1 : undefined}
                icon={step.icon}
                busy={busy}
                delay={state === "current" ? lightAfterConnector : undefined}
              />
              <span
                className={`max-w-full text-[13px] leading-5 text-balance transition-colors duration-[var(--ws-duration-base)] ${
                  state === "upcoming" ? "text-text-tertiary" : "text-text-secondary"
                } ${
                  state === "current"
                    ? "font-medium text-text-primary @max-[4.5rem]:max-w-none @max-[4.5rem]:whitespace-nowrap"
                    : "@max-[4.5rem]:sr-only"
                }`}
              >
                <span className="sr-only">{stepStateLabel[state]}: </span>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
      {status ? (
        <div aria-live="polite" className="mt-5 border-t border-border-subtle pt-3.5">
          <StepStatus busy={busy && current < n} trailing={`${Math.min(current + 1, n)} / ${n}`}>
            {status}
          </StepStatus>
        </div>
      ) : null}
    </div>
  );
}

/** The same step language, stood on end: a disc, a title and a description per step, and
 *  a thick rail between them that fills as the flow moves. For a full-page onboarding or
 *  a status page, where each step needs a sentence of explanation. */
export function VerticalStepper({
  steps,
  current,
  currentProgress = 0,
  status,
  busy = false,
  size = "lg",
  "aria-label": ariaLabel = "Progress",
  className = "",
}: {
  steps: StepItem[];
  current: number;
  /** How far the rail below the current step has filled toward the next, 0–100. */
  currentProgress?: number;
  /** Live status text, shown under the current step in gold. */
  status?: ReactNode;
  busy?: boolean;
  size?: StepMarkerSize;
  "aria-label"?: string;
  className?: string;
}) {
  const motion = fillMotion();
  return (
    <ol aria-label={ariaLabel} className={className}>
      {steps.map((step, i) => {
        const state = stepState(i, current);
        const last = i === steps.length - 1;
        const rail = state === "done" ? 100 : state === "current" ? clamp(currentProgress) : 0;
        return (
          <li
            key={step.label}
            aria-current={state === "current" ? "step" : undefined}
            className="flex gap-4"
          >
            <div className="flex flex-col items-center">
              <StepMarker
                state={state}
                size={size}
                number={step.icon ? undefined : i + 1}
                icon={step.icon}
                busy={busy}
                delay={state === "current" ? lightAfterConnector : undefined}
              />
              {!last ? (
                <span
                  aria-hidden="true"
                  className={`relative isolate my-1.5 min-h-6 w-1 flex-1 overflow-hidden rounded-full ${track}`}
                >
                  <span
                    className="absolute inset-0 rounded-full bg-action-primary transition-transform"
                    style={{ ...motion, transform: `translateY(${rail - 100}%)` }}
                  />
                </span>
              ) : null}
            </div>

            <div className={`min-w-0 flex-1 pt-2 ${last ? "" : "pb-7"}`}>
              <p
                className={`text-[14.5px] leading-5 font-semibold text-pretty transition-colors duration-[var(--ws-duration-base)] ${
                  state === "upcoming" ? "text-text-secondary" : "text-text-primary"
                }`}
              >
                <span className="sr-only">{stepStateLabel[state]}: </span>
                {step.label}
              </p>
              {step.description ? (
                <p className="mt-1 max-w-[52ch] text-[13px] leading-snug text-pretty text-text-tertiary">
                  {step.description}
                </p>
              ) : null}
              {/* Mounted on every step so the live region exists before its text arrives. */}
              <div aria-live="polite">
                {state === "current" && status ? (
                  <StepStatus busy={busy} tone="accent" className="mt-2">
                    {status}
                  </StepStatus>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------------------------------------------------------- Segment meter ---- */

/** Discrete blocks instead of a smooth fill. A meter, not a task — it reports where a
 *  quantity sits against a target, so it takes role="meter" rather than progressbar. */
export function SegmentMeter({
  value,
  segments = 40,
  tone = "primary",
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  className = "",
}: {
  value: number;
  segments?: number;
  tone?: ProgressTone;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
}) {
  const lit = Math.round((clamp(value) / 100) * segments);
  const previous = useRef(lit);
  useEffect(() => {
    previous.current = lit;
  }, [lit]);
  const from = previous.current;

  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamp(value))}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      // The gap is a share of the width, not a pixel count, so block and gap keep the
      // same proportion (about 2.4 : 1) from a phone to a wide dashboard column.
      className={`flex h-7 gap-[0.75%] ${className}`}
    >
      {Array.from({ length: segments }, (_, i) => {
        const on = i < lit;
        // Blocks change in sequence from where the value was — left to right as it
        // rises, right to left as it falls — so a change reads as the fill travelling
        // rather than a group of blocks flickering at once.
        const order = on ? i - from : from - 1 - i;
        return (
          <span
            key={i}
            aria-hidden="true"
            className={`h-full min-w-0 flex-1 rounded-sm transition-[background-color,box-shadow] ${
              on ? `${toneFill[tone]} shadow-[inset_0_1px_0_0_var(--ws-sheen)]` : track
            }`}
            style={{
              transitionDuration: "var(--ws-duration-fast)",
              transitionTimingFunction: "var(--ws-ease-standard)",
              transitionDelay: order > 0 ? `${order * 14}ms` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

export type StatMetric = {
  label: string;
  /** 0–100, how far along the target. */
  value: number;
  /** Shown instead of "{value}%" — "₦2.4M", "36 / 40". */
  display?: string;
  trend?: { direction: TrendDirection; value: string };
  tone?: ProgressTone;
};

// The tray is tinted by the insight's direction — the same up/down the Trend Pill reads.
const trayTone: Record<TrendDirection, string> = {
  up: "bg-tonal-success text-tonal-success-text",
  down: "bg-tonal-error text-tonal-error-text",
  flat: "bg-tonal-neutral text-tonal-neutral-text",
};

/** A dashboard card: icon, title and menu; one or more metrics, each a Trend Pill, a
 *  value and a segment meter; and an optional insight line in a tinted tray the card
 *  sits on. */
export function StatWidget({
  icon: Icon,
  title,
  subtitle,
  metrics,
  insight,
  onMenu,
  className = "",
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  metrics: StatMetric[];
  insight?: { text: ReactNode; direction: TrendDirection; onClick?: () => void };
  onMenu?: () => void;
  className?: string;
}) {
  const baseId = useId();

  const card = (
    <div className="rounded-2xl bg-surface-base p-5 ring-1 ring-text-primary/[0.06] ring-inset">
      <header className="flex items-start gap-3">
        {/* Ink at 10%, like the tracks: surface.raised is pure white in light and the box
            would vanish into the card. */}
        <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-text-primary/10 text-text-primary shadow-[inset_0_1px_0_0_var(--ws-sheen)]">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="text-[15px] leading-5 font-semibold text-balance text-text-primary">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 truncate text-[12.5px] leading-4 text-text-tertiary">{subtitle}</p>
          ) : null}
        </div>
        {onMenu ? (
          <IconButton
            icon={EllipsisHorizontalIcon}
            label={`${title} options`}
            size="sm"
            onClick={onMenu}
            className="-mt-0.5 -mr-1.5 text-text-tertiary"
          />
        ) : null}
      </header>

      <div className="mt-5 space-y-4">
        {metrics.map((m, i) => {
          const id = `${baseId}-${i}`;
          return (
            <div key={m.label}>
              <div className="mb-2.5 flex items-center gap-2">
                <span id={id} className="min-w-0 flex-1 text-[13px] leading-4 text-pretty text-text-secondary">
                  {m.label}
                </span>
                {m.trend ? (
                  <TrendPill direction={m.trend.direction} value={m.trend.value} size="sm" />
                ) : null}
                {/* Four figures' width reserved, so 9% → 89% → 100% never shifts the
                    pill beside it. */}
                <span className="min-w-[4ch] text-right text-[15px] leading-5 font-semibold tabular-nums text-text-primary">
                  {m.display ?? `${Math.round(clamp(m.value))}%`}
                </span>
              </div>
              <SegmentMeter value={m.value} tone={m.tone} aria-labelledby={id} />
            </div>
          );
        })}
      </div>
    </div>
  );

  if (!insight) return <section className={className}>{card}</section>;

  const row = (
    <>
      <span className="min-w-0 flex-1 text-pretty">{insight.text}</span>
      {insight.onClick ? (
        <ArrowRightIcon
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform duration-[var(--ws-duration-fast)] ease-[var(--ws-ease-standard)] group-hover:translate-x-0.5"
        />
      ) : null}
    </>
  );
  const rowClass = "flex w-full items-center gap-3 px-5 py-3 text-left text-[13px] leading-5";

  // The card sits on the tray with a 1px reveal all round; 17 = the card's 16 + 1, so
  // the two corners stay concentric.
  return (
    <section className={`rounded-[17px] p-px ${trayTone[insight.direction]} ${className}`}>
      {card}
      {insight.onClick ? (
        <button type="button" onClick={insight.onClick} className={`group rounded-b-2xl ${rowClass}`}>
          {row}
        </button>
      ) : (
        <p className={rowClass}>{row}</p>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ Pace ---- */

export type PaceStatus = "ahead" | "behind" | "on";

/** Progress against where you should be by now. Solid runs to whichever of the two is
 *  lower; the hatch is the gap between them; the dot is you. Ahead, the hatch sits behind
 *  the dot — ground you have covered early. Behind, it sits in front — ground you owe.
 *  Colour follows the verdict: feedback.success ahead, feedback.danger behind. */
export function PaceBar({
  label,
  value,
  expected,
  className = "",
}: {
  label: ReactNode;
  /** Actual progress, 0–100. */
  value: number;
  /** Where the schedule says you should be by now, 0–100. */
  expected: number;
  className?: string;
}) {
  const v = clamp(value);
  const e = clamp(expected);
  const status: PaceStatus = Math.abs(v - e) < 1 ? "on" : v > e ? "ahead" : "behind";
  const tone: ProgressTone = status === "ahead" ? "success" : status === "behind" ? "danger" : "primary";
  const lo = Math.min(v, e);
  const hi = Math.max(v, e);
  const motion = fillMotion();
  const slide = { ...motion, transitionProperty: "left, width" };

  /* "30% ahead of schedule" is time, not distance. At the current rate the goal lands at
     (expected / actual) of the planned time: 21% expected at 30% actual finishes in 70%
     of the schedule — 30% early. */
  const schedule = v > 0 ? Math.round(Math.abs(e / v - 1) * 100) : null;
  const verdictInk = status === "ahead" ? "text-feedback-success" : status === "behind" ? "text-feedback-danger" : "text-action-primary-text";

  let sentence: ReactNode;
  if (v >= 100) {
    sentence = <>You've <b className={`font-medium ${verdictInk}`}>reached your goal</b>.</>;
  } else if (e <= 0 && v > 0) {
    // Nothing is due yet, so there is no rate to project from — "100% ahead" would be
    // an artefact of dividing by zero progress owed.
    sentence = <>You're <b className={`font-medium ${verdictInk}`}>ahead of pace</b> — nothing is due yet.</>;
  } else if (schedule === null) {
    sentence = (
      <>
        Not started yet — the schedule has you at{" "}
        <b className="font-semibold tabular-nums text-text-primary">{Math.round(e)}%</b> by now.
      </>
    );
  } else if (status === "on") {
    sentence = <>You're <b className={`font-medium ${verdictInk}`}>on pace</b> to reach your goal on schedule.</>;
  } else {
    sentence = (
      <>
        You're <b className={`font-medium ${verdictInk}`}>{status === "ahead" ? "ahead of pace" : "behind pace"}</b>{" "}
        and should reach your goal{" "}
        <b className="font-semibold tabular-nums text-text-primary">{schedule}%</b>{" "}
        <span className="text-text-primary">{status === "ahead" ? "ahead of schedule" : "behind schedule"}</span>
      </>
    );
  }

  return (
    <div className={className}>
      <p className="text-[15px] leading-5 font-semibold text-text-primary">{label}</p>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v)}
        aria-valuetext={`${Math.round(v)}% complete, ${status === "on" ? "on" : status} pace — expected ${Math.round(e)}% by now`}
        className="relative mt-4 h-3.5"
      >
        <div className={`absolute inset-x-0 top-1/2 isolate h-2 -translate-y-1/2 overflow-hidden rounded-full ${toneInk[tone]} bg-current/20`}>
          {/* 2px of track shows between solid and hatch — two fills butted together read
              as one bar with a colour change, not two things. */}
          <span className={`absolute inset-y-0 left-0 ${toneFill[tone]} transition-[left,width]`} style={{ ...slide, width: `max(0px, calc(${lo}% - 1px))` }} />
          <span className="ws-hatch absolute inset-y-0 transition-[left,width]" style={{ ...slide, left: `calc(${lo}% + 1px)`, width: `max(0px, calc(${hi - lo}% - 2px))` }} />
        </div>
        {/* The dot wears a 2px ring of the card surface, so it reads as sitting on the
            bar rather than merging into whichever fill it lands on. */}
        <span
          aria-hidden="true"
          className={`absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface-base transition-[left] ${toneFill[tone]}`}
          style={{ ...motion, transitionProperty: "left", left: `${v}%` }}
        />
      </div>
      <p className="mt-3 text-[13px] leading-snug text-pretty text-text-tertiary">{sentence}</p>
    </div>
  );
}

/* ------------------------------------------------------------ Live status ---- */

/** A bar with a status line and a live time-remaining underneath. The countdown is the
 *  same hook the Toast's "quote expires in…" runs on.
 *
 *  Pass `value` when the operation reports its own progress. Leave it out and pass
 *  `startedAt` when the only thing known is the deadline: the bar then fills from the
 *  clock, gliding linearly between ticks. */
export function LiveStatusBar({
  label,
  value,
  startedAt,
  endsAt,
  onExpire,
  expiredLabel = "Finishing up…",
  size = "md",
  tone = "primary",
  className = "",
}: {
  label: ReactNode;
  value?: number;
  startedAt?: number;
  endsAt: number;
  onExpire?: () => void;
  expiredLabel?: string;
  size?: ProgressSize;
  tone?: ProgressTone;
  className?: string;
}) {
  const { remaining, seconds, expired } = useCountdown(endsAt, onExpire);
  const clockDriven = value === undefined;

  // A clock-driven fill aims at where it will be on the *next* tick and takes the second
  // to get there, so it arrives exactly as the digit flips instead of trailing by one.
  let pct = value ?? 0;
  if (clockDriven && startedAt !== undefined) {
    const next = Math.max(0, remaining - (remaining % 1000 || 1000));
    pct = clamp(100 * (1 - next / Math.max(1, endsAt - startedAt)));
  }

  return (
    <div className={className}>
      <ProgressBar
        value={pct}
        label={label}
        valuePosition="end"
        size={size}
        tone={tone}
        linear={clockDriven}
      />
      <p aria-live="polite" className="mt-2.5 flex items-center gap-1.5 text-[12px] leading-4 text-text-tertiary">
        <ClockIcon aria-hidden="true" className="size-3.5 shrink-0" />
        {expired ? (
          expiredLabel
        ) : (
          <span>
            <CountdownText seconds={seconds} /> left
          </span>
        )}
      </p>
    </div>
  );
}
